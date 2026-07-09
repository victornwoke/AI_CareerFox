import { createGeminiProvider } from "@/lib/ai/geminiProvider";
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

export function getAiProvider(): AiProvider {
  return createGeminiProvider();
}
