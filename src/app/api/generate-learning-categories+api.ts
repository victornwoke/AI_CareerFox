import {
  createLearningCategories,
  enforceAiQuota,
  handleAiRouteError,
  jsonResponse,
  readJsonBody,
  validateGenerateLearningCategoriesInput,
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

  const validation = validateGenerateLearningCategoriesInput(jsonBody.data);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  const quotaResponse = enforceAiQuota(request);

  if (quotaResponse) {
    return quotaResponse;
  }

  try {
    const categories = await createLearningCategories(validation.data);

    return jsonResponse(categories);
  } catch (error) {
    return handleAiRouteError(error);
  }
}
