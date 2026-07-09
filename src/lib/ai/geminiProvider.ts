import {
    type AiGenerateJsonRequest,
    type AiProvider,
} from "@/lib/ai/aiProvider";
import { AiProviderError } from "@/lib/ai/providerErrors";

const geminiApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
const defaultModel = "gemini-2.5-flash-lite";
const fallbackModels = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];
const defaultTimeoutMs = 60_000;
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
  inlineFiles,
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
  const configuredModel = (process.env.GEMINI_MODEL ?? "").trim();
  const candidateModels = [configuredModel, ...fallbackModels].filter(
    (model, index, allModels) =>
      model.length > 0 && allModels.indexOf(model) === index,
  );

  if (candidateModels.length === 0) {
    candidateModels.push(defaultModel);
  }

  try {
    let lastModelError: AiProviderError | null = null;

    for (const model of candidateModels) {
      const response = await fetch(getGenerateContentEndpoint(model), {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...(inlineFiles ?? []).map((file) => ({
                  inlineData: { data: file.data, mimeType: file.mimeType },
                })),
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2_048,
            responseMimeType: "application/json",
            responseSchema: toGeminiGenerateContentSchema(schema),
            temperature: 0.4,
            ...getThinkingConfig(model),
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
        const upstreamMessage = await readGeminiErrorMessage(response);
        const providerError = mapGeminiHttpError(
          response.status,
          upstreamMessage,
        );

        if (shouldTryFallbackModel(response.status, upstreamMessage)) {
          lastModelError = providerError;
          continue;
        }

        throw providerError;
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
    }

    if (lastModelError) {
      throw lastModelError;
    }

    throw new AiProviderError("AI feedback service is unavailable.", 502);
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

function shouldTryFallbackModel(status: number, message: string): boolean {
  // Retry on quota exhaustion or temporary unavailability — try the next model.
  if (status === 429 || status === 503) {
    return true;
  }

  if (status !== 400 && status !== 404) {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("model") ||
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("unsupported") ||
    normalizedMessage.includes("invalid argument")
  );
}

async function readGeminiErrorMessage(response: Response): Promise<string> {
  try {
    const responseBody = (await response.json()) as {
      error?: { message?: string };
    };

    const message = responseBody.error?.message?.trim();

    if (message) {
      return message;
    }
  } catch {
    // Ignore malformed upstream error body.
  }

  return "";
}

function mapGeminiHttpError(
  status: number,
  upstreamMessage: string,
): AiProviderError {
  if (status === 401 || status === 403) {
    return new AiProviderError(
      "AI feedback is not configured correctly. Check GEMINI_API_KEY.",
      503,
    );
  }

  if (status === 429) {
    return new AiProviderError(
      "AI feedback service is rate-limited. Please try again shortly.",
      429,
    );
  }

  if (status >= 500) {
    return new AiProviderError("AI feedback service is unavailable.", 502);
  }

  if (status >= 400) {
    return new AiProviderError(
      "CareerFox AI could not process this request right now.",
      400,
    );
  }

  return new AiProviderError("AI feedback service is unavailable.", 502);
}

function getGenerateContentEndpoint(model: string) {
  const modelName = model.startsWith("models/")
    ? model.slice("models/".length)
    : model;

  return `${geminiApiBaseUrl}/models/${encodeURIComponent(modelName)}:generateContent`;
}

function getThinkingConfig(model: string): Record<string, unknown> {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes("gemini-3")) {
    return {
      thinkingConfig: {
        thinkingLevel: "minimal",
      },
    };
  }

  // Lite models do not support thinkingConfig — only apply to the full flash variant.
  if (
    normalizedModel.includes("gemini-2.5-flash") &&
    !normalizedModel.includes("lite")
  ) {
    return {
      thinkingConfig: {
        thinkingBudget: 0,
      },
    };
  }

  return {};
}

function toGeminiGenerateContentSchema(
  schema: AiGenerateJsonRequest["schema"],
): Record<string, unknown> {
  const {
    additionalProperties: _additionalProperties,
    items,
    properties,
    ...rest
  } = schema;

  return {
    ...rest,
    ...(items ? { items: toGeminiGenerateContentSchema(items) } : {}),
    ...(properties
      ? {
          properties: Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [
              key,
              toGeminiGenerateContentSchema(value),
            ]),
          ),
        }
      : {}),
  };
}

function extractGeminiOutputText(responseBody: unknown): string | null {
  const record = asRecord(responseBody);

  if (!record) {
    return null;
  }

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  const steps = record.steps;

  if (Array.isArray(steps)) {
    for (const step of steps) {
      const stepRecord = asRecord(step);

      if (stepRecord?.type !== "model_output") {
        continue;
      }

      const stepOutputText =
        typeof stepRecord.output_text === "string"
          ? stepRecord.output_text
          : extractTextContent(stepRecord.content);

      if (stepOutputText) {
        return stepOutputText;
      }
    }
  }

  const candidates = record.candidates;

  if (Array.isArray(candidates)) {
    const firstCandidate = asRecord(candidates[0]);
    const content = asRecord(firstCandidate?.content);
    const candidateOutputText = extractTextContent(content?.parts);

    if (candidateOutputText) {
      return candidateOutputText;
    }
  }

  return null;
}

function extractTextContent(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  for (const item of value) {
    const itemRecord = asRecord(item);

    if (typeof itemRecord?.text === "string") {
      return itemRecord.text;
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
