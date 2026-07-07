import {
  type AiGenerateJsonRequest,
  type AiProvider,
} from "@/lib/ai/aiProvider";
import { AiProviderError } from "@/lib/ai/providerErrors";

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";
const defaultModel = "gemini-3.5-flash";
const defaultTimeoutMs = 15_000;
const maxAiResponseBytes = 14_000;

export function createGeminiProvider(): AiProvider {
  return {
    generateJson: fetchGeminiStructuredJson,
    name: "gemini",
  };
}

async function fetchGeminiStructuredJson({
  prompt,
  schema,
  timeoutMs = defaultTimeoutMs,
}: AiGenerateJsonRequest): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new AiProviderError(
      "AI feedback is not configured. Add GEMINI_API_KEY on the server.",
      503,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(geminiEndpoint, {
      body: JSON.stringify({
        input: prompt,
        model: process.env.GEMINI_MODEL ?? defaultModel,
        response_format: {
          mime_type: "application/json",
          schema,
          type: "text",
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AiProviderError("AI feedback service is unavailable.", 502);
    }

    const responseBody: unknown = await response.json();
    const outputText = extractGeminiOutputText(responseBody);

    if (!outputText) {
      throw new Error("Gemini response did not include JSON output text.");
    }

    if (outputText.length > maxAiResponseBytes) {
      throw new Error("Gemini response exceeded the maximum allowed size.");
    }

    try {
      return JSON.parse(outputText);
    } catch {
      throw new Error("Gemini response was not valid JSON.");
    }
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("AI feedback service timed out.", 504);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractGeminiOutputText(responseBody: unknown): string | null {
  const record = asRecord(responseBody);

  if (!record) {
    return null;
  }

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  const candidates = record.candidates;

  if (Array.isArray(candidates)) {
    const firstCandidate = asRecord(candidates[0]);
    const content = asRecord(firstCandidate?.content);
    const parts = content?.parts;

    if (Array.isArray(parts)) {
      const firstPart = asRecord(parts[0]);

      if (typeof firstPart?.text === "string") {
        return firstPart.text;
      }
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
