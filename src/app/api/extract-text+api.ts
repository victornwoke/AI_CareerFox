import { validateRouteQuota } from "@/lib/ai/validators";
import {
    extractTextFromUploadedFile,
    jsonResponse,
} from "@/lib/server/aiFeedback";

const maxRequestBytes = 8_000_000;
const maxBase64Chars = 10_500_000;
const maxFileNameLength = 260;
const maxExtractedTextLength = 60_000;
const extractTextRateLimitWindowMs = 60_000;
const extractTextMaxRequestsPerWindow = 12;

type ExtractTextRequest = {
  base64?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
};

function normalizeFileName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxFileNameLength);
}

function getGlobalBuffer(): {
  from: (value: string, encoding?: string) => Uint8Array;
} | null {
  const maybeBuffer = (globalThis as { Buffer?: unknown }).Buffer;

  if (
    maybeBuffer &&
    typeof maybeBuffer === "object" &&
    "from" in maybeBuffer &&
    typeof (maybeBuffer as { from?: unknown }).from === "function"
  ) {
    return maybeBuffer as {
      from: (value: string, encoding?: string) => Uint8Array;
    };
  }

  return null;
}

function decodeBase64Payload(base64: string): Uint8Array | null {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "").trim();
  const buffer = getGlobalBuffer();

  if (
    !buffer ||
    cleanBase64.length === 0 ||
    cleanBase64.length > maxBase64Chars
  ) {
    return null;
  }

  try {
    return buffer.from(cleanBase64, "base64");
  } catch {
    return null;
  }
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
    maxRequestsPerWindow: extractTextMaxRequestsPerWindow,
    scope: "extract-text",
    windowMs: extractTextRateLimitWindowMs,
  });

  if (!quotaValidation.ok) {
    return jsonResponse({ error: quotaValidation.error }, { status: 429 });
  }

  try {
    const body = (await request.json()) as ExtractTextRequest;
    const base64 = typeof body.base64 === "string" ? body.base64 : "";
    const fileNameRaw = typeof body.fileName === "string" ? body.fileName : "";
    const fileName = normalizeFileName(fileNameRaw);
    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.trim().length > 0
        ? body.mimeType.trim().slice(0, 120)
        : undefined;

    if (!base64 || !fileName) {
      return jsonResponse(
        { error: "Missing file data. Upload the file again." },
        { status: 400 },
      );
    }

    const buffer = decodeBase64Payload(base64);

    if (!buffer) {
      return jsonResponse(
        { error: "Invalid file payload. Please upload the file again." },
        { status: 422 },
      );
    }

    if (buffer.length === 0) {
      return jsonResponse(
        { error: "The file is empty. Try another file." },
        { status: 422 },
      );
    }

    const text =
      (await extractTextFromUploadedFile({
        base64,
        ...(mimeType ? { mimeType } : {}),
        name: fileName,
      })) ?? "";

    if (text.length === 0) {
      return jsonResponse(
        {
          error:
            "No text could be extracted from this file. Try a text-based PDF, DOCX, TXT, or RTF file.",
        },
        { status: 422 },
      );
    }

    if (text.length > maxExtractedTextLength) {
      return jsonResponse(
        {
          error:
            "This file has too much text for one request. Please upload a shorter version.",
        },
        { status: 413 },
      );
    }

    return jsonResponse({ text });
  } catch {
    return jsonResponse(
      { error: "CareerFox could not extract text from this file right now." },
      { status: 500 },
    );
  }
}
