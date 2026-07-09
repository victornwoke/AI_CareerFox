import { resolveApiBaseUrl } from "@/lib/api";

/**
 * Stream Video SDK utilities for React Native.
 */

export type StreamConnectionState =
  | "idle"
  | "creating"
  | "connecting"
  | "connected"
  | "failed"
  | "ended";

export interface StreamSessionConfig {
  userId: string;
  callId: string;
}

export interface StreamTokenResponse {
  apiKey: string;
  token: string;
  userId: string;
}

export interface StreamSessionBootstrap {
  apiKey: string;
  token: string;
  userId: string;
}

export interface StartAiCoachSessionRequest {
  callId: string;
  callType: string;
  context: {
    cloudProvider?: string;
    currentQuestion?: string;
    experienceLevel?: string;
    jobDescription?: string | null;
    practiceMode?: string;
    questionCategory?: string;
    selectedCareerPath?: string | null;
    targetRole?: string;
    userId: string;
  };
}

export interface StartAiCoachSessionResponse {
  callId: string;
  callType: string;
  sessionId: string;
  status: "starting" | "connected" | "failed";
}

export interface StopAiCoachSessionRequest {
  sessionId: string;
}

export const STREAM_CALL_TYPE = "default";

/**
 * Fetch Stream authentication token from backend.
 */
export async function fetchStreamSessionBootstrap(
  userId: string,
): Promise<StreamSessionBootstrap | null> {
  try {
    const baseUrl = resolveApiBaseUrl();

    if (!baseUrl) {
      console.info(
        "Stream session bootstrap unavailable: missing API base URL.",
      );
      return null;
    }

    const response = await fetch(`${baseUrl}/api/stream-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        console.info("Stream service not configured");
        return null;
      }

      const errorMessage = await readStreamErrorMessage(response);

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as StreamTokenResponse;
    return data;
  } catch (error) {
    console.error(
      "Failed to fetch Stream token:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

export async function startAiCoachSession(
  request: StartAiCoachSessionRequest,
): Promise<StartAiCoachSessionResponse | null> {
  try {
    const baseUrl = resolveApiBaseUrl();

    if (!baseUrl) {
      console.info("AI coach session unavailable: missing API base URL.");
      return null;
    }

    const response = await fetch(`${baseUrl}/api/start-ai-coach-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 503) {
        console.info("AI coach session service not configured.");
        return null;
      }

      const errorMessage = await readStreamErrorMessage(response);
      throw new Error(errorMessage);
    }

    return (await response.json()) as StartAiCoachSessionResponse;
  } catch (error) {
    console.error(
      "Failed to start AI coach session:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

export async function stopAiCoachSession(
  request: StopAiCoachSessionRequest,
): Promise<void> {
  try {
    const baseUrl = resolveApiBaseUrl();

    if (!baseUrl) {
      return;
    }

    await fetch(`${baseUrl}/api/stop-ai-coach-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (error) {
    console.warn(
      "Failed to stop AI coach session:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

async function readStreamErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    const message = body.error?.trim();

    if (message) {
      return message;
    }
  } catch {
    // Ignore malformed error payloads.
  }

  return response.status === 429
    ? "Voice service is busy right now. Please try again in a moment."
    : "CareerFox could not start a voice session right now.";
}

/**
 * Generate a unique call ID for the session
 */
export function generateCallId(userId: string, questionId: string): string {
  const maxSegmentLength = 16;
  const maxCallIdLength = 64;
  const sanitize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxSegmentLength);

  const safeUserId = sanitize(userId) || "user";
  const safeQuestionId = sanitize(questionId) || "question";
  const timestamp = Date.now().toString(36);
  return `interview_${safeUserId}_${safeQuestionId}_${timestamp}`.slice(
    0,
    maxCallIdLength,
  );
}
