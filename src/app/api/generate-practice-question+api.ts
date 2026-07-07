import {
  createPracticeQuestion,
  handleAiRouteError,
  jsonResponse,
  readJsonBody,
  validateBasicAiRequestQuota,
  validateGeneratePracticeQuestionInput,
  validateRequestSize,
} from "@/lib/server/aiFeedback";

export async function POST(request: Request) {
  const sizeValidation = validateRequestSize(request);

  if (!sizeValidation.ok) {
    return jsonResponse({ error: sizeValidation.error }, { status: 413 });
  }

  const jsonBody = await readJsonBody(request);

  if (!jsonBody.ok) {
    return jsonResponse({ error: jsonBody.error }, { status: 400 });
  }

  const validation = validateGeneratePracticeQuestionInput(jsonBody.data);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  const quotaValidation = validateBasicAiRequestQuota(validation.data.userId);

  if (!quotaValidation.ok) {
    return jsonResponse({ error: quotaValidation.error }, { status: 429 });
  }

  try {
    const question = await createPracticeQuestion(validation.data);

    return jsonResponse(question);
  } catch (error) {
    return handleAiRouteError(error);
  }
}
