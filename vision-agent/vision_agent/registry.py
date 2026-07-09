from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import asyncio
from typing import Any, Optional


@dataclass(frozen=True)
class CoachSessionContext:
    user_id: str
    target_role: str
    experience_level: str
    practice_mode: str
    question_category: str | None = None
    current_question: str | None = None
    job_description: str | None = None
    selected_career_path: str | None = None
    raw_custom_data: dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionRuntime:
    session_id: str
    call_type: str
    call_id: str
    context: CoachSessionContext
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "created"
    stop_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    task: asyncio.Task[None] | None = field(default=None, repr=False)
    error_message: str | None = None


class SessionRegistry:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionRuntime] = {}
        self._lock = asyncio.Lock()

    async def create(self, session: SessionRuntime) -> SessionRuntime:
        async with self._lock:
            if session.session_id in self._sessions:
                raise ValueError(f"Session already exists: {session.session_id}")
            self._sessions[session.session_id] = session
            return session

    async def get(self, session_id: str) -> Optional[SessionRuntime]:
        async with self._lock:
            return self._sessions.get(session_id)

    async def all(self) -> list[SessionRuntime]:
        async with self._lock:
            return list(self._sessions.values())

    async def set_task(self, session_id: str, task: asyncio.Task[None]) -> None:
        async with self._lock:
            session = self._sessions[session_id]
            session.task = task

    async def update_status(
        self,
        session_id: str,
        status: str,
        error_message: str | None = None,
    ) -> None:
        async with self._lock:
            session = self._sessions[session_id]
            session.status = status
            session.error_message = error_message

    async def request_stop(self, session_id: str) -> bool:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return False
            session.stop_event.set()
            return True

    async def remove(self, session_id: str) -> Optional[SessionRuntime]:
        async with self._lock:
            return self._sessions.pop(session_id, None)
