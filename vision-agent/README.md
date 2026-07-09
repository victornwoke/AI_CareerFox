# CareerFox AI Voice Coach Service

This folder contains the standalone Python service that runs the CareerFox AI voice coach.

## What it does

- loads Stream and Gemini credentials from environment variables
- starts a voice-only Vision Agents session using Stream Edge transport
- reads role, experience level, practice mode, current question, and optional job description from session custom data
- reads the same context from Stream call `custom` metadata when present (`targetRole`/`roleTitle`, `experienceLevel`, `practiceMode`/`mode`, `currentQuestion`/`question`)
- exposes health, start, stop, and session-list endpoints for safe control

## Environment variables

Required:

- `STREAM_API_KEY`
- `STREAM_API_SECRET`
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`

Optional:

- `GEMINI_MODEL` — defaults to `gemini-3.1-flash-live-preview`
- `VISION_AGENT_GEMINI_MODEL` — preferred override for the voice agent runtime model
- `VISION_AGENT_SHARED_SECRET` — shared secret header between Expo API routes and this service

Model note:

- If `GEMINI_MODEL` is set to a text-only model (for example `gemini-3.5-flash`), the voice service will automatically fall back to `gemini-3.1-flash-live-preview` for realtime voice sessions.

Environment loading order:

1. workspace root `.env` (parent project)
2. `vision-agent/.env`
3. existing process environment variables

Notes:

- the service needs the Vision Agents Gemini and GetStream plugin extras, which are included by `vision-agent/requirements.txt`
- `vision_agents.plugins` is required at runtime for `gemini.Realtime()` and `getstream.Edge()`

## Run

```bash
cd vision-agent
python -m pip install -r requirements.txt
python -m vision_agent.main
```

The service listens on `http://0.0.0.0:8000`.

## Endpoints

- `GET /health`
- `GET /sessions`
- `POST /sessions/start`
- `DELETE /sessions/{sessionId}`

If `VISION_AGENT_SHARED_SECRET` is set, `GET /sessions`, `POST /sessions/start`, and `DELETE /sessions/{sessionId}` require header `X-CareerFox-Voice-Secret`.
