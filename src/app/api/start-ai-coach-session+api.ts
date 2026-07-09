import { validateRouteQuota } from "@/lib/ai/validators";
import { jsonResponse } from "@/lib/server/aiFeedback";

const maxRequestBytes = 64_000;
const maxRoleLength = 120;
const maxExperienceLevelLength = 80;
const maxQuestionLength = 2_000;
const maxJobDescriptionLength = 12_000;
const maxCareerPathLength = 120;
const maxQuestionCategoryLength = 24;
const maxCallIdLength = 64;
const maxCallTypeLength = 40;
const routeRateLimitWindowMs = 60_000;
const routeMaxRequestsPerWindow = 24;
const callIdPattern = /^[A-Za-z0-9_-]{3,64}$/;
const callTypePattern = /^[A-Za-z0-9_-]{1,40}$/;
const userIdPattern = /^[A-Za-z0-9_-]{3,120}$/;
const supportedQuestionCategories = new Set(["behavioral", "technical"]);

type StartAiCoachSessionRequest = {
  callId?: unknown;
  callType?: unknown;
  context?: {
    currentQuestion?: unknown;
    experienceLevel?: unknown;
    jobDescription?: unknown;
    practiceMode?: unknown;
    questionCategory?: unknown;
    selectedCareerPath?: unknown;
    targetRole?: unknown;
    userId?: unknown;
  };
};

type VoiceAgentStartPayload = {
  callId: string;
  callType: string;
  context: {
    currentQuestion?: string;
    experienceLevel?: string;
    jobDescription?: string;
    practiceMode?: string;
    questionCategory?: string;
    selectedCareerPath?: string;
    targetRole?: string;
    userId: string;
  };
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function getTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function toVoiceAgentPayload(
  body: StartAiCoachSessionRequest,
): VoiceAgentStartPayload | null {
  const callId = getTrimmedString(body.callId, maxCallIdLength);
  const callType =
    getTrimmedString(body.callType, maxCallTypeLength) ?? "default";

  if (!callId || !callIdPattern.test(callId)) {
    return null;
  }

  if (!callTypePattern.test(callType)) {
    return null;
  }

  const contextRecord =
    body.context && typeof body.context === "object" ? body.context : null;

  if (!contextRecord) {
    return null;
  }

  const userId = getTrimmedString(contextRecord.userId, 120);

  if (!userId || !userIdPattern.test(userId)) {
    return null;
  }

  const targetRole = getTrimmedString(contextRecord.targetRole, maxRoleLength);
  const experienceLevel = getTrimmedString(
    contextRecord.experienceLevel,
    maxExperienceLevelLength,
  );
  const currentQuestion = getTrimmedString(
    contextRecord.currentQuestion,
    maxQuestionLength,
  );
  const jobDescription = getTrimmedString(
    contextRecord.jobDescription,
    maxJobDescriptionLength,
  );
  const selectedCareerPath = getTrimmedString(
    contextRecord.selectedCareerPath,
    maxCareerPathLength,
  );
  const practiceMode = getTrimmedString(contextRecord.practiceMode, 40);
  const questionCategoryRaw = getTrimmedString(
    contextRecord.questionCategory,
    maxQuestionCategoryLength,
  );
  const questionCategory =
    questionCategoryRaw && supportedQuestionCategories.has(questionCategoryRaw)
      ? questionCategoryRaw
      : null;

  return {
    callId,
    callType,
    context: {
      ...(currentQuestion ? { currentQuestion } : {}),
      ...(experienceLevel ? { experienceLevel } : {}),
      ...(jobDescription ? { jobDescription } : {}),
      ...(practiceMode ? { practiceMode } : {}),
      ...(questionCategory ? { questionCategory } : {}),
      ...(selectedCareerPath ? { selectedCareerPath } : {}),
      ...(targetRole ? { targetRole } : {}),
      userId,
    },
  };
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
    scope: "start-ai-coach-session",
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
    return jsonResponse(
      { error: "Voice coach is not configured right now." },
      { status: 503 },
    );
  }

  let body: StartAiCoachSessionRequest;

  try {
    body = (await request.json()) as StartAiCoachSessionRequest;
  } catch {
    return jsonResponse({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = toVoiceAgentPayload(body);

  if (!payload) {
    return jsonResponse(
      {
        error:
          "Invalid voice session payload. Check callId, callType, and userId values.",
      },
      { status: 400 },
    );
  }

  const sharedSecret = process.env.VISION_AGENT_SHARED_SECRET?.trim();

  try {
    const response = await fetch(`${voiceAgentUrl}/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sharedSecret ? { "X-CareerFox-Voice-Secret": sharedSecret } : {}),
      },
      body: JSON.stringify(payload),
    });

    let responseBody: unknown = null;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      const detail =
        responseBody &&
        typeof responseBody === "object" &&
        "detail" in responseBody &&
        typeof (responseBody as { detail?: unknown }).detail === "string"
          ? (responseBody as { detail: string }).detail.trim() ||
            "Voice coach is unavailable right now."
          : "Voice coach is unavailable right now.";

      return jsonResponse(
        { error: detail.slice(0, 220) },
        { status: response.status >= 500 ? 503 : response.status },
      );
    }

    return jsonResponse(responseBody);
  } catch {
    return jsonResponse(
      { error: "CareerFox could not start the voice coach right now." },
      { status: 503 },
    );
  }
}
