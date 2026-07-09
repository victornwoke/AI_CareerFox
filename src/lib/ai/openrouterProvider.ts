import { AiProviderError } from "@/lib/ai/providerErrors";
import type { JsonSchema } from "@/lib/ai/schemas";

const openRouterBaseUrl = "https://openrouter.ai/api/v1";
const defaultTimeoutMs = 60_000;
const maxAiResponseBytes = 14_000;

/**
 * Best free text-only models on OpenRouter for structured JSON output.
 * Verified against the OpenRouter API on 2026-07-09.
 * All models confirmed pricing: $0/$0 and support response_format / structured JSON.
 */
const FREE_TEXT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free", // 70B — stable, widely used, 65K context
  "qwen/qwen3-coder:free", // 480B MoE — supports response_format, 1M context
  "google/gemma-4-31b-it:free", // 31B dense — supports response_format, 256K context
  "qwen/qwen3-next-80b-a3b-instruct:free", // 80B MoE — supports response_format + structured_outputs
] as const;

/**
 * Vision models on OpenRouter that can read images, PDFs, and documents.
 * Using models that are confirmed to exist on OpenRouter and support multimodal input.
 * Used when inline file attachments (CV PDFs, images, etc.) are provided.
 */
const VISION_MODELS = [
  "openai/gpt-4o", // Latest GPT-4 with vision — reliable multimodal support
  "google/gemini-2.0-flash", // Google's latest vision model
  "meta-llama/llama-3.2-90b-vision-instruct", // LLaMA with vision capabilities
] as const;

type GenerateJsonRequest = {
  prompt: string;
  schema: JsonSchema;
  timeoutMs?: number;
  inlineFiles?: { data: string; mimeType: string }[];
};

export function createOpenRouterProvider(apiKey: string) {
  return {
    name: "openrouter",
    generateJson: (request: GenerateJsonRequest) =>
      fetchOpenRouterStructuredJson(apiKey, request),
  };
}

async function fetchOpenRouterStructuredJson(
  apiKey: string,
  {
    prompt,
    schema,
    timeoutMs = defaultTimeoutMs,
    inlineFiles,
  }: GenerateJsonRequest,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const schemaInstruction = [
    "Respond with a single valid JSON object that strictly matches this JSON Schema.",
    "Do not include any explanation, markdown fences, or extra text. Return only the JSON object.",
    "",
    JSON.stringify(schema, null, 2),
  ].join("\n");

  try {
    // If inline files are present, use a vision model; otherwise use text model
    if (inlineFiles && inlineFiles.length > 0) {
      return await fetchWithVisionModel(
        apiKey,
        schemaInstruction,
        prompt,
        inlineFiles,
        controller.signal,
      );
    } else {
      return await fetchWithTextModel(
        apiKey,
        schemaInstruction,
        prompt,
        controller.signal,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithTextModel(
  apiKey: string,
  schemaInstruction: string,
  prompt: string,
  signal: AbortSignal,
): Promise<unknown> {
  let lastError: AiProviderError | null = null;

  // Try each text model
  for (const model of FREE_TEXT_MODELS) {
    try {
      const response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: schemaInstruction },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 2048,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://careerfox.ai",
          "X-Title": "CareerFox AI",
        },
        method: "POST",
        signal,
      });

      if (!response.ok) {
        const providerError = await mapOpenRouterHttpError(response);
        if (
          isRetriableStatus(response.status) ||
          (response.status >= 400 && response.status < 500)
        ) {
          lastError = providerError;
          continue;
        }
        throw providerError;
      }

      const body: unknown = await response.json();
      const text = extractMessageContent(body);

      if (!text) {
        lastError = new AiProviderError(
          "OpenRouter returned an empty response.",
          502,
        );
        continue;
      }

      if (text.length > maxAiResponseBytes) {
        lastError = new AiProviderError(
          "OpenRouter response exceeded the maximum allowed size.",
          502,
        );
        continue;
      }

      try {
        return parseJsonOutput(text);
      } catch {
        lastError = new AiProviderError(
          "OpenRouter response was not valid JSON.",
          502,
        );
        continue;
      }
    } catch (err) {
      if (err instanceof AiProviderError) {
        if (
          isRetriableStatus(err.status) ||
          (err.status >= 400 && err.status < 500)
        ) {
          lastError = err;
          continue;
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new AiProviderError("AI feedback service timed out.", 504);
      }

      throw err;
    }
  }

  throw (
    lastError ??
    new AiProviderError(
      "All OpenRouter text models are currently unavailable.",
      502,
    )
  );
}

async function fetchWithVisionModel(
  apiKey: string,
  schemaInstruction: string,
  prompt: string,
  inlineFiles: { data: string; mimeType: string }[],
  signal: AbortSignal,
): Promise<unknown> {
  let lastError: AiProviderError | null = null;

  // Try each vision model
  for (const model of VISION_MODELS) {
    try {
      // Build content array with text and images
      const content: (
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
        | { type: "file"; file: { file_data: string; filename: string } }
      )[] = [{ type: "text", text: prompt }];

      for (const file of inlineFiles) {
        const dataUri = `data:${file.mimeType};base64,${file.data}`;

        if (file.mimeType.startsWith("image/")) {
          content.push({
            type: "image_url",
            image_url: { url: dataUri },
          });
          continue;
        }

        if (file.mimeType === "application/pdf") {
          content.push({
            type: "file",
            file: {
              file_data: dataUri,
              filename: "uploaded-document.pdf",
            },
          });
        }
      }

      const response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: schemaInstruction },
            { role: "user", content },
          ],
          // Vision models don't support response_format constraint
          temperature: 0.4,
          max_tokens: 2048,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://careerfox.ai",
          "X-Title": "CareerFox AI",
        },
        method: "POST",
        signal,
      });

      if (!response.ok) {
        const providerError = await mapOpenRouterHttpError(response);
        if (
          isRetriableStatus(response.status) ||
          (response.status >= 400 && response.status < 500)
        ) {
          lastError = providerError;
          continue;
        }
        throw providerError;
      }

      const body: unknown = await response.json();
      const text = extractMessageContent(body);

      if (!text) {
        lastError = new AiProviderError(
          "OpenRouter returned an empty response.",
          502,
        );
        continue;
      }

      if (text.length > maxAiResponseBytes) {
        lastError = new AiProviderError(
          "OpenRouter response exceeded the maximum allowed size.",
          502,
        );
        continue;
      }

      try {
        return parseJsonOutput(text);
      } catch {
        lastError = new AiProviderError(
          "OpenRouter response was not valid JSON.",
          502,
        );
        continue;
      }
    } catch (err) {
      if (err instanceof AiProviderError) {
        if (
          isRetriableStatus(err.status) ||
          (err.status >= 400 && err.status < 500)
        ) {
          lastError = err;
          continue;
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new AiProviderError("AI feedback service timed out.", 504);
      }

      throw err;
    }
  }

  throw (
    lastError ??
    new AiProviderError(
      "All OpenRouter vision models are currently unavailable.",
      502,
    )
  );
}

function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503;
}

async function mapOpenRouterHttpError(
  response: Response,
): Promise<AiProviderError> {
  let message = "";

  try {
    const body = (await response.json()) as { error?: { message?: string } };
    message = body.error?.message?.trim() ?? "";
  } catch {
    // Ignore malformed error bodies.
  }

  if (response.status === 429) {
    return new AiProviderError(
      "AI feedback service is rate-limited. Please try again shortly.",
      429,
    );
  }

  if (response.status >= 500) {
    return new AiProviderError("AI feedback service is unavailable.", 502);
  }

  return new AiProviderError(
    message || "CareerFox AI could not process this request right now.",
    response.status,
  );
}

function extractMessageContent(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const choices = record.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const first = choices[0];

  if (typeof first !== "object" || first === null) {
    return null;
  }

  const message = (first as Record<string, unknown>).message;

  if (typeof message !== "object" || message === null) {
    return null;
  }

  const content = (message as Record<string, unknown>).content;

  return typeof content === "string" ? content : null;
}

function parseJsonOutput(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to fence stripping.
  }

  // Some models wrap output in markdown code fences despite instructions.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]+?)```\s*$/);

  if (fenceMatch?.[1]) {
    return JSON.parse(fenceMatch[1].trim());
  }

  throw new SyntaxError("No valid JSON found in OpenRouter response.");
}
