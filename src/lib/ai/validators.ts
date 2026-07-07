export type AiPracticeMode =
  | "learn"
  | "practice"
  | "mock_interview"
  | "cv_review";

export type AiCoachContext = {
  answer?: string;
  cvText?: string;
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  question?: string;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type AiValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

export const AI_TEXT_LIMITS = {
  answer: 6_000,
  cvText: 20_000,
  jobDescription: 12_000,
  questionGenerationContext: 8_000,
} as const;

const aiPracticeModes: readonly AiPracticeMode[] = [
  "learn",
  "practice",
  "mock_interview",
  "cv_review",
];

const abuseLimitWindowMs = 60_000;
const maxRequestsPerWindow = 20;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

export function isAiPracticeMode(value: unknown): value is AiPracticeMode {
  return (
    typeof value === "string" && aiPracticeModes.includes(value as AiPracticeMode)
  );
}

export function validateAiPracticeMode(
  value: unknown,
): AiValidationResult<AiPracticeMode | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (isAiPracticeMode(value)) {
    return {
      data: value,
      ok: true,
    };
  }

  return {
    error:
      "practiceMode must be learn, practice, mock_interview, or cv_review.",
    ok: false,
  };
}

export function validateBasicAiRequestQuota(
  request: Request,
): AiValidationResult<null> {
  const now = Date.now();
  const authHeader = request.headers.get("authorization");
  const userId = authHeader ?? `anonymous:${request.headers.get("x-forwarded-for") ?? "unknown"}`;

  pruneExpiredWindows(now);

  const existingWindow = requestWindows.get(userId);

  if (!existingWindow || existingWindow.resetAt <= now) {
    requestWindows.set(userId, {
      count: 1,
      resetAt: now + abuseLimitWindowMs,
    });

    return {
      data: null,
      ok: true,
    };
  }

  if (existingWindow.count >= maxRequestsPerWindow) {
    return {
      error: "Please pause for a moment before asking CareerFox AI again.",
      ok: false,
    };
  }

  existingWindow.count += 1;

  return {
    data: null,
    ok: true,
  };
}

function pruneExpiredWindows(now: number): void {
  for (const [key, window] of requestWindows) {
    if (window.resetAt <= now) {
      requestWindows.delete(key);
    }
  }
}
