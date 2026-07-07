import {
  createInterviewQuestions,
  handleAiRouteError,
  jsonResponse,
  readJsonBody,
  validateGenerateInterviewQuestionsInput,
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

  const validation = validateGenerateInterviewQuestionsInput(jsonBody.data);

  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }

  try {
    const questions = await createInterviewQuestions(validation.data);

    return jsonResponse(questions);
  } catch (error) {
    return handleAiRouteError(error);
  }
}
