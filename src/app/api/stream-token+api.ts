import { validateRouteQuota } from "@/lib/ai/validators";
import jwt from "jsonwebtoken";

type StreamTokenRequest = {
  userId?: string;
};

type StreamTokenResponse = {
  apiKey: string;
  token: string;
  userId: string;
};

type ErrorResponse = {
  error: string;
};

const maxTokenRequestBytes = 16_000;
const streamTokenRateLimitWindowMs = 60_000;
const streamTokenMaxRequestsPerWindow = 24;
const streamUserIdPattern = /^[A-Za-z0-9_-]{3,120}$/;

function jsonResponse(body: StreamTokenResponse | ErrorResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = request.headers.get("content-length");
  const byteLength = contentLength ? Number(contentLength) : null;

  if (
    byteLength !== null &&
    Number.isFinite(byteLength) &&
    byteLength > maxTokenRequestBytes
  ) {
    return jsonResponse({ error: "Request body is too large." }, 413);
  }

  const quotaValidation = validateRouteQuota(request, {
    maxRequestsPerWindow: streamTokenMaxRequestsPerWindow,
    scope: "stream-token",
    windowMs: streamTokenRateLimitWindowMs,
  });

  if (!quotaValidation.ok) {
    return jsonResponse({ error: quotaValidation.error }, 429);
  }

  const streamApiKey = process.env.STREAM_API_KEY;
  const streamApiSecret = process.env.STREAM_API_SECRET;

  if (!streamApiKey || !streamApiSecret) {
    console.warn(
      "Stream credentials not configured. Audio will fall back to text.",
    );
    return jsonResponse({ error: "Stream service not configured" }, 503);
  }

  let body: StreamTokenRequest;

  try {
    body = (await request.json()) as StreamTokenRequest;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const userId = body.userId?.trim();

  if (!userId) {
    return jsonResponse({ error: "userId is required" }, 400);
  }

  if (!streamUserIdPattern.test(userId)) {
    return jsonResponse(
      {
        error:
          "userId must be 3-120 characters and use only letters, numbers, _ or -.",
      },
      400,
    );
  }

  try {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60;
    const token = jwt.sign(
      {
        exp,
        iat,
        user_id: userId,
      },
      streamApiSecret,
      { algorithm: "HS256" },
    );

    return jsonResponse({ apiKey: streamApiKey, token, userId });
  } catch {
    return jsonResponse(
      { error: "CareerFox could not create a voice session right now." },
      500,
    );
  }
}
