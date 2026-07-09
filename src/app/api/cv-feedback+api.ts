import {
    createCvFeedback,
    enforceAiQuota,
    handleAiRouteError,
    jsonResponse,
    readJsonBody,
    validateCvFeedbackInput,
    validateRequestSize,
} from "@/lib/server/aiFeedback";

export async function POST(request: Request) {
  const sizeValidation = validateRequestSize(request);

  if (!sizeValidation.ok) {
    return jsonResponse({ error: sizeValidation.error }, { status: 413 });
  }

  const quotaResponse = enforceAiQuota(request);

  if (quotaResponse) {
    return quotaResponse;
  }

  const jsonBody = await readJsonBody(request);

  if (!jsonBody.ok) {
    return jsonResponse({ error: jsonBody.error }, { status: 400 });
  }

  const validation = validateCvFeedbackInput(jsonBody.data);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  try {
    const feedback = await createCvFeedback(validation.data);

    return jsonResponse(feedback);
  } catch (error) {
    return handleAiRouteError(error);
  }
}
