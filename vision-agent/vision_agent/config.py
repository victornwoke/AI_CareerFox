from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


def _load_env_files() -> None:
    current_file = Path(__file__).resolve()
    service_dir = current_file.parents[1]
    workspace_root = current_file.parents[2]

    # Prefer workspace-level .env first, then service-local overrides.
    # Existing environment variables are preserved.
    load_dotenv(workspace_root / ".env", override=False)
    load_dotenv(service_dir / ".env", override=False)


_load_env_files()


@dataclass(frozen=True)
class ServiceConfig:
    stream_api_key: str
    stream_api_secret: str
    gemini_api_key: str
    google_api_key: str
    gemini_model: str

    @property
    def has_stream_credentials(self) -> bool:
        return bool(self.stream_api_key and self.stream_api_secret)

    @property
    def has_gemini_credentials(self) -> bool:
        return bool(self.gemini_api_key or self.google_api_key)


def load_service_config() -> ServiceConfig:
    configured_model = (
        os.environ.get("VISION_AGENT_GEMINI_MODEL", "").strip()
        or os.environ.get("GEMINI_MODEL", "").strip()
        or "gemini-3.1-flash-live-preview"
    )

    resolved_model = resolve_realtime_gemini_model(configured_model)

    return ServiceConfig(
        stream_api_key=os.environ.get("STREAM_API_KEY", "").strip(),
        stream_api_secret=os.environ.get("STREAM_API_SECRET", "").strip(),
        gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip(),
        google_api_key=os.environ.get("GOOGLE_API_KEY", "").strip(),
        gemini_model=resolved_model,
    )


def resolve_realtime_gemini_model(configured_model: str) -> str:
    normalized_model = configured_model.strip() or "gemini-3.1-flash-live-preview"

    if "live" in normalized_model.lower():
        return normalized_model

    # Realtime sessions require a live-compatible model.
    return "gemini-3.1-flash-live-preview"


def get_active_gemini_key(config: ServiceConfig) -> str:
    return config.gemini_api_key or config.google_api_key


def missing_required_keys(config: ServiceConfig) -> list[str]:
    missing: list[str] = []

    if not config.stream_api_key:
        missing.append("STREAM_API_KEY")
    if not config.stream_api_secret:
        missing.append("STREAM_API_SECRET")
    if not get_active_gemini_key(config):
        missing.append("GEMINI_API_KEY or GOOGLE_API_KEY")

    return missing
