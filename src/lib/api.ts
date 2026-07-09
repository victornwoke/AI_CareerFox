import Constants from "expo-constants";
import { NativeModules } from "react-native";

import type {
    CvFeedbackOutput,
    GeneratePracticeQuestionInput,
    GeneratePracticeQuestionOutput,
    GenerateRoleLearningPlanInput,
    GenerateRoleLearningPlanOutput,
    InterviewFeedbackOutput,
} from "@/lib/server/aiFeedback";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

function normalizeConfiguredBaseUrl(candidate: string): string {
  return candidate.trim().replace(/\/+$/, "");
}

function toHttpOrigin(candidate: string): string {
  const trimmed = candidate.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const mapped = trimmed
    .replace(/^exp:\/\//i, "http://")
    .replace(/^exps:\/\//i, "https://");

  try {
    const parsed = new URL(mapped);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {
    return `http://${trimmed}`.replace(/\/+$/, "");
  }

  return "";
}

function getBaseUrlFromScriptBundle(): string {
  const scriptUrl =
    typeof NativeModules.SourceCode?.scriptURL === "string"
      ? NativeModules.SourceCode.scriptURL
      : "";

  if (!scriptUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(scriptUrl);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return `${parsedUrl.protocol}//${parsedUrl.host}`.replace(/\/+$/, "");
    }
  } catch {
    return "";
  }

  return "";
}

export function resolveApiBaseUrl(): string {
  if (configuredApiUrl && configuredApiUrl.trim().length > 0) {
    return normalizeConfiguredBaseUrl(configuredApiUrl);
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    return toHttpOrigin(hostUri);
  }

  if (Constants.linkingUri) {
    return toHttpOrigin(Constants.linkingUri);
  }

  const scriptBundleBaseUrl = getBaseUrlFromScriptBundle();

  if (scriptBundleBaseUrl) {
    return scriptBundleBaseUrl;
  }

  return "";
}

const REQUEST_TIMEOUT_MS = 30_000;

async function postJson<TRequest, TResponse>(
  path: string,
  request: TRequest,
  defaultErrorMessage: string,
): Promise<TResponse> {
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "CareerFox cannot reach the analysis service. Run with the Expo dev server or set EXPO_PUBLIC_API_URL.",
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal,
    });
  } catch {
    throw new Error("CareerFox could not reach the analysis service.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = defaultErrorMessage;

    try {
      const errorBody = (await response.json()) as { error?: string };

      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // Ignore malformed error bodies and keep the default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}

export type CvFeedbackRequest = {
  cvText?: string;
  cvFile?: {
    base64: string;
    mimeType?: string;
    name: string;
  };
  experienceLevel?: string;
  jobDescription?: string;
  jobDescriptionFile?: {
    base64: string;
    mimeType?: string;
    name: string;
  };
  targetRole: string;
  userId: string;
};

export type ExtractUploadedTextRequest = {
  base64: string;
  fileName: string;
  mimeType?: string;
};

export type InterviewFeedbackRequest = {
  answer: string;
  category: "behavioral" | "technical" | "case" | "hr";
  experienceLevel: string;
  jobDescription?: string;
  question: string;
  targetRole: string;
  userId: string;
};

export function postCvFeedback(
  request: CvFeedbackRequest,
): Promise<CvFeedbackOutput> {
  return postJson<CvFeedbackRequest, CvFeedbackOutput>(
    "/api/cv-feedback",
    request,
    "CareerFox could not analyse your CV right now.",
  );
}

export async function extractUploadedText(
  request: ExtractUploadedTextRequest,
): Promise<string> {
  const response = await postJson<ExtractUploadedTextRequest, { text: string }>(
    "/api/extract-text",
    request,
    "CareerFox could not read this uploaded file right now.",
  );

  return response.text;
}

export function postInterviewFeedback(
  request: InterviewFeedbackRequest,
): Promise<InterviewFeedbackOutput> {
  return postJson<InterviewFeedbackRequest, InterviewFeedbackOutput>(
    "/api/interview-feedback",
    request,
    "CareerFox could not score your interview answer right now.",
  );
}

export function postGeneratePracticeQuestion(
  request: GeneratePracticeQuestionInput,
): Promise<GeneratePracticeQuestionOutput> {
  return postJson<
    GeneratePracticeQuestionInput,
    GeneratePracticeQuestionOutput
  >(
    "/api/generate-practice-question",
    request,
    "CareerFox could not generate a practice question right now.",
  );
}

export function postGenerateRoleLearningPlan(
  request: GenerateRoleLearningPlanInput,
): Promise<GenerateRoleLearningPlanOutput> {
  return postJson<
    GenerateRoleLearningPlanInput,
    GenerateRoleLearningPlanOutput
  >(
    "/api/generate-role-learning-plan",
    request,
    "CareerFox could not generate a learning plan right now.",
  );
}
