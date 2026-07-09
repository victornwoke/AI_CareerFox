from __future__ import annotations

from typing import Any
import asyncio
import contextlib
import logging
import os

from vision_agent.config import (
    ServiceConfig,
    get_active_gemini_key,
    load_service_config,
    missing_required_keys,
)
from vision_agent.registry import CoachSessionContext, SessionRegistry, SessionRuntime

try:
    from vision_agents.core import Agent, User
    from vision_agents.plugins import gemini, getstream
except ImportError:  # pragma: no cover - resolved in the runtime environment
    Agent = Any  # type: ignore[assignment]
    User = Any  # type: ignore[assignment]
    gemini = Any  # type: ignore[assignment]
    getstream = Any  # type: ignore[assignment]


logger = logging.getLogger(__name__)

MAX_QUESTION_LENGTH = 2_000
MAX_JOB_DESCRIPTION_LENGTH = 12_000
MAX_ROLE_LENGTH = 120
MAX_EXPERIENCE_LENGTH = 80
MAX_USER_ID_LENGTH = 120
MAX_CATEGORY_LENGTH = 40

OPENING_MESSAGE = (
    "Hi, I'm CareerFox, your interview coach. "
    "We're going to practise an interview question together. "
    "I'll ask you the question now. "
    "When you're ready to answer, tap the mic button to start speaking. "
    "Tap it again when you've finished, and I'll give you feedback. "
    "Let's get started."
)


def _normalize_question_category(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"behavioral", "technical", "hr", "case"}:
        return normalized
    return None


def build_opening_message(context: CoachSessionContext) -> str:
    if context.question_category == "technical":
        return (
            "Hi, I'm CareerFox, your technical interview coach. "
            "I'll ask one technical question at a time. "
            "When you're ready to answer, tap the mic button to start speaking. "
            "Tap it again when you've finished, and I'll give focused feedback. "
            "Let's begin."
        )

    if context.question_category == "behavioral":
        return (
            "Hi, I'm CareerFox, your interview coach. "
            "We're going to practise a behavioural question using STAR — "
            "Situation, Task, Action, and Result. "
            "I'll ask one question now. "
            "When you're ready to answer, tap the mic button to start speaking. "
            "Tap it again when you've finished, and I'll give feedback. "
            "Let's get started."
        )

    return OPENING_MESSAGE


def _clean_text(value: object | None, limit: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit]


def _sanitize_instruction_text(value: str | None) -> str | None:
    if value is None:
        return None

    # Vision Agents parses any @token as a markdown file reference.
    # Replace @ in user-provided content (emails, handles) to avoid
    # InstructionsReadError when creating the agent.
    return value.replace("@", "(at)")


def _flatten_custom_data(raw: dict[str, Any]) -> dict[str, Any]:
    merged: dict[str, Any] = {}

    for key in ("customData", "custom_data", "context", "sessionContext", "session_context"):
        candidate = raw.get(key)
        if isinstance(candidate, dict):
            merged.update(candidate)

    merged.update({k: v for k, v in raw.items() if not isinstance(v, dict)})
    return merged


def _pick_text(
    custom_data: dict[str, Any],
    raw: dict[str, Any],
    keys: tuple[str, ...],
    limit: int,
) -> str | None:
    for key in keys:
        value = _clean_text(custom_data.get(key), limit)
        if value:
            return value

    for key in keys:
        value = _clean_text(raw.get(key), limit)
        if value:
            return value

    return None


def extract_session_context(raw: dict[str, Any]) -> CoachSessionContext:
    custom_data = _flatten_custom_data(raw)

    user_id = (
        _pick_text(custom_data, raw, ("userId", "user_id"), MAX_USER_ID_LENGTH)
        or "anonymous"
    )

    target_role = (
        _pick_text(
            custom_data,
            raw,
            ("targetRole", "target_role", "role", "roleTitle"),
            MAX_ROLE_LENGTH,
        )
        or "general role"
    )

    experience_level = (
        _pick_text(
            custom_data,
            raw,
            ("experienceLevel", "experience_level", "level"),
            MAX_EXPERIENCE_LENGTH,
        )
        or "unspecified"
    )

    practice_mode = (
        _pick_text(
            custom_data,
            raw,
            ("practiceMode", "practice_mode", "mode"),
            40,
        )
        or "mock_interview"
    )

    question_category = _normalize_question_category(
        _pick_text(
            custom_data,
            raw,
            ("questionCategory", "question_category", "category"),
            MAX_CATEGORY_LENGTH,
        )
    )

    current_question = _pick_text(
        custom_data,
        raw,
        ("currentQuestion", "current_question", "question", "questionText", "question_text"),
        MAX_QUESTION_LENGTH,
    )

    job_description = _pick_text(
        custom_data,
        raw,
        ("jobDescription", "job_description", "jd"),
        MAX_JOB_DESCRIPTION_LENGTH,
    )

    selected_career_path = _pick_text(
        custom_data,
        raw,
        ("selectedCareerPath", "selected_career_path", "careerPath", "career_path"),
        MAX_ROLE_LENGTH,
    )

    return CoachSessionContext(
        user_id=user_id,
        target_role=target_role,
        experience_level=experience_level,
        practice_mode=practice_mode,
        question_category=question_category,
        current_question=current_question,
        job_description=job_description,
        selected_career_path=selected_career_path,
        raw_custom_data=custom_data,
    )


def build_system_instructions(context: CoachSessionContext) -> str:
    category = context.question_category or "behavioral"
    safe_target_role = _sanitize_instruction_text(context.target_role) or "general role"
    safe_experience_level = (
        _sanitize_instruction_text(context.experience_level) or "unspecified"
    )
    safe_practice_mode = (
        _sanitize_instruction_text(context.practice_mode) or "mock_interview"
    )
    safe_selected_career_path = _sanitize_instruction_text(context.selected_career_path)
    safe_current_question = _sanitize_instruction_text(context.current_question)
    safe_job_description = _sanitize_instruction_text(context.job_description)

    question_block = (
        f"Interview question to ask: {safe_current_question}\n"
        if safe_current_question
        else "Ask one relevant interview question for the target role, category, and experience level.\n"
    )

    role_block = (
        f"Target role: {safe_target_role}\n"
        f"Experience level: {safe_experience_level}\n"
        f"Practice mode: {safe_practice_mode}\n"
    )

    career_path_block = (
        f"Selected career path: {safe_selected_career_path}\n"
        if safe_selected_career_path
        else ""
    )

    job_description_block = (
        f"Job description context:\n{safe_job_description}\n"
        if safe_job_description
        else ""
    )

    category_block = f"Question category: {category}\n"

    if category == "technical":
        coaching_method_block = (
            "## Coaching method — technical interviewing\n"
            "Coach for technical clarity, correctness, and depth.\n"
            "In feedback: name one strong point, then one specific improvement.\n"
            "If relevant, prompt for trade-offs, edge cases, complexity, and practical implementation details.\n"
            "Keep feedback concise (three sentences maximum).\n"
            "Adapt expectations to the role and experience level below.\n"
            "Use the job description when it is provided.\n"
            "\n"
        )
    else:
        coaching_method_block = (
            "## Coaching method — STAR\n"
            "Coach the STAR method: Situation, Task, Action, Result.\n"
            "In your feedback: name one thing that was strong, then name one specific improvement.\n"
            "If a STAR element is missing, name it and briefly show how to include it.\n"
            "Adapt your language and expectations to the role and experience level below.\n"
            "Use the job description when it is provided.\n"
            "\n"
        )

    return (
        "You are CareerFox AI, a calm, warm, confident, practical, and encouraging "
        "voice-only interview coach.\n"
        "\n"
        "## Session format — push-to-talk\n"
        "This is a push-to-talk session. The user taps a mic button to start speaking "
        "and taps it again when they have finished. You must follow this turn order:\n"
        "1. Greet the user briefly, then ask the interview question listed below. "
        "Use the exact question text — do NOT change, rephrase, or replace it.\n"
        "2. Stay silent and wait. The user will tap their mic and speak their answer.\n"
        "3. After the user taps to stop, give short, specific feedback (three sentences maximum).\n"
        "4. Offer to repeat the question or move to the next one.\n"
        "Do NOT speak while the user is talking. "
        "Do NOT ask multiple questions in a row. One question, one answer, one feedback.\n"
        "\n"
        f"{coaching_method_block}"
        "## Rules\n"
        "Speak English by default.\n"
        "Never invent or guess the role — use only the target role provided below.\n"
        "Never guarantee job offers, salary outcomes, visa results, or legal advice.\n"
        "Respond only to what the user actually said. Do not fabricate answers.\n"
        "\n"
        f"{role_block}"
        f"{category_block}"
        f"{career_path_block}"
        f"{question_block}"
        f"{job_description_block}"
    )


def create_agent(context: CoachSessionContext, config: ServiceConfig) -> Agent:
    gemini_api_key = get_active_gemini_key(config)

    if config.stream_api_key:
        os.environ.setdefault("STREAM_API_KEY", config.stream_api_key)
    if config.stream_api_secret:
        os.environ.setdefault("STREAM_API_SECRET", config.stream_api_secret)
    if config.gemini_api_key:
        os.environ.setdefault("GEMINI_API_KEY", config.gemini_api_key)
    if config.google_api_key:
        os.environ.setdefault("GOOGLE_API_KEY", config.google_api_key)
    if config.gemini_model:
        os.environ.setdefault("GEMINI_MODEL", config.gemini_model)

    llm = gemini.Realtime(
        model=config.gemini_model,
        api_key=gemini_api_key,
    )

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="CareerFox AI Coach", id="careerfox-ai-coach"),
        instructions=build_system_instructions(context),
        llm=llm,
    )


_FALLBACK_USER_ID = "anonymous"
_FALLBACK_TARGET_ROLE = "general role"
_FALLBACK_EXPERIENCE_LEVEL = "unspecified"
_FALLBACK_PRACTICE_MODE = "mock_interview"


def _coalesce(call_value: str, base_value: str, fallback: str) -> str:
    """Return call_value unless it equals the fallback sentinel; keep base_value then."""
    return call_value if call_value != fallback else base_value


def _merge_context_from_stream_call(
    base_context: CoachSessionContext,
    call_custom_data: object,
) -> CoachSessionContext:
    if not isinstance(call_custom_data, dict):
        return base_context

    call_context = extract_session_context(call_custom_data)
    flattened = _flatten_custom_data(call_custom_data)

    return CoachSessionContext(
        user_id=_coalesce(call_context.user_id, base_context.user_id, _FALLBACK_USER_ID),
        target_role=_coalesce(call_context.target_role, base_context.target_role, _FALLBACK_TARGET_ROLE),
        experience_level=_coalesce(call_context.experience_level, base_context.experience_level, _FALLBACK_EXPERIENCE_LEVEL),
        practice_mode=_coalesce(call_context.practice_mode, base_context.practice_mode, _FALLBACK_PRACTICE_MODE),
        question_category=call_context.question_category if call_context.question_category is not None else base_context.question_category,
        current_question=call_context.current_question if call_context.current_question is not None else base_context.current_question,
        job_description=call_context.job_description if call_context.job_description is not None else base_context.job_description,
        selected_career_path=call_context.selected_career_path if call_context.selected_career_path is not None else base_context.selected_career_path,
        raw_custom_data={**base_context.raw_custom_data, **flattened},
    )


async def run_session(session: SessionRuntime, registry: SessionRegistry) -> None:
    config = load_service_config()
    await registry.update_status(session.session_id, "starting")

    if missing_required_keys(config):
        message = ", ".join(missing_required_keys(config))
        await registry.update_status(session.session_id, "failed", message)
        logger.error("CareerFox voice coach cannot start: missing %s", message)
        return

    agent = None

    try:
        agent = create_agent(session.context, config)
        call = await agent.create_call(session.call_type, session.call_id)

        # Read call-level custom metadata that mobile clients attach on join/create.
        session.context = _merge_context_from_stream_call(
            session.context,
            getattr(call, "custom_data", None),
        )

        get_call_method = getattr(call, "get", None)
        if callable(get_call_method):
            try:
                await get_call_method()
                session.context = _merge_context_from_stream_call(
                    session.context,
                    getattr(call, "custom_data", None),
                )
            except Exception:
                logger.exception(
                    "Failed to refresh Stream call custom data for %s",
                    session.session_id,
                )

        # Keep instructions aligned with effective session context before joining.
        agent.instructions = type(agent.instructions)(
            build_system_instructions(session.context)
        )

        async with agent.join(call, participant_wait_timeout=None):
            await registry.update_status(session.session_id, "connected")
            logger.info(
                "CareerFox coach connected for session %s and role %s",
                session.session_id,
                session.context.target_role,
            )

            if hasattr(agent, "send_custom_event"):
                try:
                    await agent.send_custom_event(
                        {
                            "type": "coach_status",
                            "status": "connected",
                            "session_id": session.session_id,
                        }
                    )
                except Exception:
                    logger.exception("Failed to emit connected status event")

            await agent.simple_response(text=build_opening_message(session.context))

            finish_task = asyncio.create_task(agent.finish())
            stop_task = asyncio.create_task(session.stop_event.wait())

            done, pending = await asyncio.wait(
                {finish_task, stop_task},
                return_when=asyncio.FIRST_COMPLETED,
            )

            if finish_task in done:
                finish_exc = finish_task.exception()
                if finish_exc is not None:
                    raise finish_exc

            if stop_task in done and not finish_task.done():
                logger.info("Stop requested for session %s", session.session_id)
                close_method = getattr(agent, "close", None)
                if callable(close_method):
                    await close_method()

            for pending_task in pending:
                pending_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await pending_task

        await registry.update_status(session.session_id, "stopped")
    except Exception as exc:  # pragma: no cover - surfaced in service logs
        logger.exception("CareerFox voice session failed for %s", session.session_id)
        await registry.update_status(session.session_id, "failed", str(exc))
        raise
    finally:
        if agent is not None and hasattr(agent, "close"):
            try:
                await agent.close()
            except Exception:
                logger.exception("Failed to close agent for session %s", session.session_id)
        await registry.remove(session.session_id)
