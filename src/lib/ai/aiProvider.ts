import { createGeminiProvider } from "@/lib/ai/geminiProvider";
import { createOpenRouterProvider } from "@/lib/ai/openrouterProvider";
import { AiProviderError } from "@/lib/ai/providerErrors";
import type { JsonSchema } from "@/lib/ai/schemas";

export { AiProviderError } from "@/lib/ai/providerErrors";

export type AiGenerateJsonRequest = {
  prompt: string;
  schema: JsonSchema;
  timeoutMs?: number;
  inlineFiles?: { data: string; mimeType: string }[];
};

export type AiProvider = {
  generateJson: (request: AiGenerateJsonRequest) => Promise<unknown>;
  name: string;
};

function isRetriableProviderError(error: unknown): boolean {
  return (
    error instanceof AiProviderError &&
    (error.status === 429 || error.status === 502 || error.status === 504)
  );
}

/**
 * CV analysis provider — routes ONLY to OpenRouter (text models).
 * Gemini is never used for CV analysis.
 * Requires OPENROUTER_API_KEY to be configured.
 */
export function getCvAiProvider(): AiProvider {
  const openRouterApiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  if (!openRouterApiKey) {
    throw new Error(
      "CV analysis requires OPENROUTER_API_KEY to be configured in .env. " +
        "Get a free key at https://openrouter.ai/keys",
    );
  }
  return createOpenRouterProvider(openRouterApiKey);
}

/**
 * General-purpose provider for all features (interview, lessons, practice, etc.).
 * Gemini is primary (reliable); OpenRouter is fallback when Gemini is
 * rate-limited or temporarily unavailable. Falls back to Gemini-only if no OpenRouter key.
 * Voice (Python agent) already uses Gemini directly.
 */
export function getAiProvider(): AiProvider {
  const gemini = createGeminiProvider();
  const openRouterApiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();

  if (!openRouterApiKey) {
    // OpenRouter not configured — use Gemini only.
    return gemini;
  }

  const openRouter = createOpenRouterProvider(openRouterApiKey);

  return {
    name: "gemini+openrouter",
    generateJson: async (request) => {
      try {
        // Gemini is primary for all non-CV features.
        // inlineFiles are supported by Gemini natively.
        return await gemini.generateJson(request);
      } catch (primaryError) {
        if (!isRetriableProviderError(primaryError)) {
          throw primaryError;
        }

        // Gemini is rate-limited or temporarily unavailable.
        // Fall back to OpenRouter free models.
        // OpenRouter text models do not support inlineFiles; this request may fail,
        // but it's a last resort anyway.
        return openRouter.generateJson(request);
      }
    },
  };
}
