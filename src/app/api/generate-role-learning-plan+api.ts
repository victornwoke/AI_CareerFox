import {
  createRoleLearningPlan,
  enforceAiQuota,
  handleAiRouteError,
  jsonResponse,
  readJsonBody,
  validateGenerateRoleLearningPlanInput,
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

  const validation = validateGenerateRoleLearningPlanInput(jsonBody.data);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  const quotaResponse = enforceAiQuota(request);

  if (quotaResponse) {
    return quotaResponse;
  }

  try {
    const plan = await createRoleLearningPlan(validation.data);

    return jsonResponse(plan);
  } catch (error) {
    return handleAiRouteError(error);
  }
}
