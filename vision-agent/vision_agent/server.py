from __future__ import annotations

from datetime import datetime, timezone
import asyncio
import contextlib
import hmac
import os
from typing import Any, Literal

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from vision_agent.agent import extract_session_context, run_session
from vision_agent.config import load_service_config, missing_required_keys
from vision_agent.registry import SessionRegistry, SessionRuntime


app = FastAPI(title="CareerFox Vision Agent", version="1.0.0")
registry = SessionRegistry()


def _verify_control_request(shared_secret_header: str | None) -> None:
    configured_secret = os.environ.get("VISION_AGENT_SHARED_SECRET", "").strip()

    if not configured_secret:
        return

    provided_secret = (shared_secret_header or "").strip()

    if not provided_secret or not hmac.compare_digest(provided_secret, configured_secret):
        raise HTTPException(status_code=401, detail="Unauthorized voice agent control request.")


def _verify_control_request_with_request(
    request: Request,
    shared_secret_header: str | None,
) -> None:
    _verify_control_request(shared_secret_header)


class SessionContextPayload(BaseModel):
    userId: str | None = None
    user_id: str | None = None
    targetRole: str | None = None
    target_role: str | None = None
    experienceLevel: str | None = None
    experience_level: str | None = None
    practiceMode: str | None = None
    practice_mode: str | None = None
    currentQuestion: str | None = None
    current_question: str | None = None
    jobDescription: str | None = None
    job_description: str | None = None
    questionCategory: str | None = None
    question_category: str | None = None
    selectedCareerPath: str | None = None
    selected_career_path: str | None = None
    customData: dict[str, Any] | None = None
    custom_data: dict[str, Any] | None = None
    context: dict[str, Any] | None = None


class StartSessionRequest(BaseModel):
    callType: str = Field(default="default", min_length=1)
    callId: str = Field(min_length=1)
    sessionId: str | None = None
    context: SessionContextPayload = Field(default_factory=SessionContextPayload)


class StartSessionResponse(BaseModel):
    sessionId: str
    callId: str
    callType: str
    status: Literal["starting", "connected", "failed"]


class StopSessionResponse(BaseModel):
    sessionId: str
    status: Literal["stopping", "not_found"]


class HealthResponse(BaseModel):
    status: str
    time: str
    configured: bool
    missing: list[str]


def _normalize_context_payload(payload: SessionContextPayload) -> dict[str, Any]:
    data = payload.model_dump(exclude_none=True)
    if payload.customData:
        data.setdefault("customData", payload.customData)
    if payload.custom_data:
        data.setdefault("custom_data", payload.custom_data)
    if payload.context:
        data.setdefault("context", payload.context)
    return data


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    config = load_service_config()
    missing = missing_required_keys(config)
    return HealthResponse(
        status="ok" if not missing else "degraded",
        time=datetime.now(timezone.utc).isoformat(),
        configured=not missing,
        missing=missing,
    )


@app.get("/sessions", response_model=list[dict[str, Any]])
async def list_sessions(
    request: Request,
    x_careerfox_voice_secret: str | None = Header(default=None),
) -> list[dict[str, Any]]:
    _verify_control_request_with_request(request, x_careerfox_voice_secret)

    sessions = await registry.all()
    return [
        {
            "sessionId": session.session_id,
            "callId": session.call_id,
            "callType": session.call_type,
            "status": session.status,
            "createdAt": session.created_at.isoformat(),
            "errorMessage": session.error_message,
        }
        for session in sessions
    ]


@app.post("/sessions/start", response_model=StartSessionResponse, status_code=201)
async def start_session(
    request: StartSessionRequest,
    http_request: Request,
    x_careerfox_voice_secret: str | None = Header(default=None),
) -> StartSessionResponse:
    _verify_control_request_with_request(http_request, x_careerfox_voice_secret)

    config = load_service_config()
    missing = missing_required_keys(config)
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"CareerFox voice coach is missing: {', '.join(missing)}",
        )

    session_id = request.sessionId or request.callId
    context = extract_session_context(_normalize_context_payload(request.context))

    session = SessionRuntime(
        session_id=session_id,
        call_type=request.callType,
        call_id=request.callId,
        context=context,
    )

    try:
        await registry.create(session)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    task = asyncio.create_task(run_session(session, registry))
    await registry.set_task(session.session_id, task)

    return StartSessionResponse(
        sessionId=session.session_id,
        callId=session.call_id,
        callType=session.call_type,
        status="starting",
    )


@app.delete("/sessions/{session_id}", response_model=StopSessionResponse)
async def stop_session(
    session_id: str,
    request: Request,
    x_careerfox_voice_secret: str | None = Header(default=None),
) -> StopSessionResponse:
    _verify_control_request_with_request(request, x_careerfox_voice_secret)

    session = await registry.get(session_id)
    if session is None:
        return StopSessionResponse(sessionId=session_id, status="not_found")

    await registry.request_stop(session_id)
    return StopSessionResponse(sessionId=session_id, status="stopping")


@app.on_event("shutdown")
async def shutdown_sessions() -> None:
    sessions = await registry.all()
    for session in sessions:
        session.stop_event.set()
        if session.task is not None:
            session.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await session.task
