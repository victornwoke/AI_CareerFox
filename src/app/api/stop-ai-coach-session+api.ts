import { validateRouteQuota } from "@/lib/ai/validators";
import { jsonResponse } from "@/lib/server/aiFeedback";

const maxRequestBytes = 16_000;
const maxSessionIdLength = 160;
const routeRateLimitWindowMs = 60_000;
const routeMaxRequestsPerWindow = 36;
const sessionIdPattern = /^[A-Za-z0-9_-]{3,160}$/;

type StopAiCoachSessionRequest = {
  sessionId?: unknown;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function getSessionId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, maxSessionIdLength);

  if (!normalized || !sessionIdPattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  const byteLength = contentLength ? Number(contentLength) : null;

  if (
    byteLength !== null &&
    Number.isFinite(byteLength) &&
    byteLength > maxRequestBytes
  ) {
    return jsonResponse(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  const quotaValidation = validateRouteQuota(request, {
    maxRequestsPerWindow: routeMaxRequestsPerWindow,
    scope: "stop-ai-coach-session",
    windowMs: routeRateLimitWindowMs,
  });

  if (!quotaValidation.ok) {
    return jsonResponse({ error: quotaValidation.error }, { status: 429 });
  }

  const configuredVoiceAgentUrl = process.env.VISION_AGENT_URL;
  const voiceAgentUrl = configuredVoiceAgentUrl
    ? normalizeBaseUrl(configuredVoiceAgentUrl)
    : process.env.NODE_ENV === "production"
      ? ""
      : "http://127.0.0.1:8000";

  if (!voiceAgentUrl) {
    return jsonResponse({ status: "not_configured" });
  }

  let body: StopAiCoachSessionRequest;

  try {
    body = (await request.json()) as StopAiCoachSessionRequest;
  } catch {
    return jsonResponse({ error: "Invalid request body." }, { status: 400 });
  }

  const sessionId = getSessionId(body.sessionId);

  if (!sessionId) {
    return jsonResponse({ error: "sessionId is required." }, { status: 400 });
  }

  const sharedSecret = process.env.VISION_AGENT_SHARED_SECRET?.trim();

  try {
    const response = await fetch(`${voiceAgentUrl}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        ...(sharedSecret ? { "X-CareerFox-Voice-Secret": sharedSecret } : {}),
      },
    });

    let responseBody: unknown = null;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      return jsonResponse(
        { error: "CareerFox could not stop the voice coach right now." },
        { status: response.status >= 500 ? 503 : response.status },
      );
    }

    return jsonResponse(responseBody ?? { status: "stopping", sessionId });
  } catch {
    return jsonResponse(
      { error: "CareerFox could not stop the voice coach right now." },
      { status: 503 },
    );
  }
}
