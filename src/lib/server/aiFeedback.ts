import {
  AiProviderError,
  getAiProvider,
} from "@/lib/ai/aiProvider";
import { careerCoachRules, formatAiContext } from "@/lib/ai/prompts";
import type { JsonSchema } from "@/lib/ai/schemas";
import {
  AI_TEXT_LIMITS,
  type AiPracticeMode,
  validateAiPracticeMode,
  validateBasicAiRequestQuota as checkBasicAiRequestQuota,
} from "@/lib/ai/validators";

type InterviewCategory = "behavioral" | "technical" | "case" | "hr";
type LearningCategoryDestination =
  | "applications"
  | "cv"
  | "detail"
  | "interview";
type LessonFocus =
  | "applications"
  | "career-guidance"
  | "cv"
  | "interview"
  | "skills";
type PracticeQuestionDifficulty = "beginner" | "intermediate" | "advanced";
type PracticeQuestionStructure = "STAR" | "XYZ" | "freeform";

export type InterviewFeedbackInput = {
  answer: string;
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  question: string;
  category: InterviewCategory;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type InterviewFeedbackOutput = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  categories: {
    structure: number;
    relevance: number;
    clarity: number;
    confidence: number;
    starQuality: number;
  };
};

export type CvFeedbackInput = {
  cvText: string;
  experienceLevel?: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type CvFeedbackOutput = {
  score: number;
  summary: string;
  weakBullets: string[];
  improvedBullets: string[];
  keywordGaps: string[];
  nextActions: string[];
};

export type GeneratePracticeQuestionInput = {
  category: InterviewCategory;
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  previousQuestions?: string[];
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type GeneratePracticeQuestionOutput = {
  question: string;
  category: InterviewCategory;
  difficulty: PracticeQuestionDifficulty;
  expectedStructure: PracticeQuestionStructure;
  guidance: string[];
};

export type GenerateInterviewQuestionsInput = GeneratePracticeQuestionInput & {
  count?: number;
};

export type GenerateInterviewQuestionsOutput = {
  questions: GeneratePracticeQuestionOutput[];
};

export type GenerateLearningCategoriesInput = {
  currentCategories?: string[];
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type GeneratedLearningCategory = {
  id: string;
  title: string;
  description: string;
  destination: LearningCategoryDestination;
  priority: number;
  starterLessonTitle: string;
};

export type GenerateLearningCategoriesOutput = {
  categories: GeneratedLearningCategory[];
};

export type GenerateLessonInput = {
  focus: LessonFocus;
  categoryTitle: string;
  experienceLevel: string;
  jobDescription?: string;
  lessonTitle?: string;
  practiceMode?: AiPracticeMode;
  question?: string;
  expectedStructure?: PracticeQuestionStructure;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type GenerateLessonOutput = {
  title: string;
  overview: string;
  learningOutcomes: string[];
  coachingSteps: string[];
  practicePrompt: string;
  estimatedMinutes: number;
  xp: number;
};

type ApiValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

const maxRequestBytes = 45_000;
const maxUserIdLength = 120;
const maxTargetRoleLength = 120;
const maxExperienceLevelLength = 80;
const maxQuestionLength = 800;
const maxAnswerLength = AI_TEXT_LIMITS.answer;
const maxCvTextLength = AI_TEXT_LIMITS.cvText;
const maxJobDescriptionLength = AI_TEXT_LIMITS.jobDescription;
const maxCategoryTitleLength = 120;
const maxCurrentCategoryLength = 120;
const maxCurrentCategories = 12;
const maxGeneratedQuestions = 6;
const maxLessonTitleLength = 160;
const maxPreviousQuestionLength = 300;
const maxPreviousQuestions = 8;
const maxSelectedCareerPathLength = 120;

const interviewCategories: readonly InterviewCategory[] = [
  "behavioral",
  "technical",
  "case",
  "hr",
];

const learningDestinations: readonly LearningCategoryDestination[] = [
  "applications",
  "cv",
  "detail",
  "interview",
];

const lessonFocuses: readonly LessonFocus[] = [
  "applications",
  "career-guidance",
  "cv",
  "interview",
  "skills",
];

const practiceQuestionDifficulties: readonly PracticeQuestionDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const practiceQuestionStructures: readonly PracticeQuestionStructure[] = [
  "STAR",
  "XYZ",
  "freeform",
];

const interviewFeedbackSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    score: {
      description: "Overall answer quality score from 0 to 100.",
      maximum: 100,
      minimum: 0,
      type: "integer",
    },
    summary: {
      description: "One concise, specific feedback summary.",
      type: "string",
    },
    strengths: {
      description: "Two or three concrete strengths from the answer.",
      items: { type: "string" },
      type: "array",
    },
    improvements: {
      description: "Two or three practical improvements.",
      items: { type: "string" },
      type: "array",
    },
    improvedAnswer: {
      description: "A stronger sample answer using STAR or XYZ where relevant.",
      type: "string",
    },
    categories: {
      additionalProperties: false,
      properties: {
        structure: { maximum: 100, minimum: 0, type: "integer" },
        relevance: { maximum: 100, minimum: 0, type: "integer" },
        clarity: { maximum: 100, minimum: 0, type: "integer" },
        confidence: { maximum: 100, minimum: 0, type: "integer" },
        starQuality: { maximum: 100, minimum: 0, type: "integer" },
      },
      required: [
        "structure",
        "relevance",
        "clarity",
        "confidence",
        "starQuality",
      ],
      type: "object",
    },
  },
  required: [
    "score",
    "summary",
    "strengths",
    "improvements",
    "improvedAnswer",
    "categories",
  ],
  type: "object",
};

const cvFeedbackSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    score: {
      description: "Overall CV quality score from 0 to 100.",
      maximum: 100,
      minimum: 0,
      type: "integer",
    },
    summary: {
      description: "One concise summary of the CV's fit and main gap.",
      type: "string",
    },
    weakBullets: {
      description: "Up to three weak or generic CV bullets copied only when short.",
      items: { type: "string" },
      type: "array",
    },
    improvedBullets: {
      description: "Sharper replacement bullets with action, scope, and measurable impact.",
      items: { type: "string" },
      type: "array",
    },
    keywordGaps: {
      description: "Important honest keyword gaps for the target role.",
      items: { type: "string" },
      type: "array",
    },
    nextActions: {
      description: "Three concrete next actions for improving the CV.",
      items: { type: "string" },
      type: "array",
    },
  },
  required: [
    "score",
    "summary",
    "weakBullets",
    "improvedBullets",
    "keywordGaps",
    "nextActions",
  ],
  type: "object",
};

const practiceQuestionSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    question: {
      description: "One interview practice question.",
      type: "string",
    },
    category: {
      enum: interviewCategories,
      type: "string",
    },
    difficulty: {
      enum: ["beginner", "intermediate", "advanced"],
      type: "string",
    },
    expectedStructure: {
      enum: ["STAR", "XYZ", "freeform"],
      type: "string",
    },
    guidance: {
      description: "Three short coaching prompts for answering well.",
      items: { type: "string" },
      type: "array",
    },
  },
  required: [
    "question",
    "category",
    "difficulty",
    "expectedStructure",
    "guidance",
  ],
  type: "object",
};

const interviewQuestionsSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    questions: {
      description: "A list of original interview practice questions.",
      items: practiceQuestionSchema,
      type: "array",
    },
  },
  required: ["questions"],
  type: "object",
};

const learningCategoriesSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    categories: {
      description: "A personalized list of learning categories or paths.",
      items: {
        additionalProperties: false,
        properties: {
          id: {
            description: "A short kebab-case identifier.",
            type: "string",
          },
          title: {
            description: "A concise user-facing category title.",
            type: "string",
          },
          description: {
            description: "A practical one-sentence category description.",
            type: "string",
          },
          destination: {
            enum: learningDestinations,
            type: "string",
          },
          priority: {
            description: "Priority from 1 to 5, where 1 is most important.",
            maximum: 5,
            minimum: 1,
            type: "integer",
          },
          starterLessonTitle: {
            description: "The first lesson to show inside this category.",
            type: "string",
          },
        },
        required: [
          "id",
          "title",
          "description",
          "destination",
          "priority",
          "starterLessonTitle",
        ],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["categories"],
  type: "object",
};

const lessonSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    title: {
      description: "A concise lesson title.",
      type: "string",
    },
    overview: {
      description: "A short practical overview for the lesson intro screen.",
      type: "string",
    },
    learningOutcomes: {
      description: "Three short outcomes the user will learn.",
      items: { type: "string" },
      type: "array",
    },
    coachingSteps: {
      description: "Three to five teachable coaching steps.",
      items: { type: "string" },
      type: "array",
    },
    practicePrompt: {
      description: "One concrete practice task or question.",
      type: "string",
    },
    estimatedMinutes: {
      maximum: 20,
      minimum: 3,
      type: "integer",
    },
    xp: {
      maximum: 100,
      minimum: 10,
      type: "integer",
    },
  },
  required: [
    "title",
    "overview",
    "learningOutcomes",
    "coachingSteps",
    "practicePrompt",
    "estimatedMinutes",
    "xp",
  ],
  type: "object",
};

export function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export function validateRequestSize(request: Request): ApiValidationResult<null> {
  const contentLength = request.headers.get("content-length");
  const byteLength = contentLength ? Number(contentLength) : null;

  if (byteLength !== null && Number.isFinite(byteLength) && byteLength > maxRequestBytes) {
    return {
      error: "Request body is too large.",
      ok: false,
    };
  }

  return { data: null, ok: true };
}

export async function readJsonBody(request: Request): Promise<ApiValidationResult<unknown>> {
  try {
    return {
      data: await request.json(),
      ok: true,
    };
  } catch {
    return {
      error: "Request body must be valid JSON.",
      ok: false,
    };
  }
}

export function validateInterviewFeedbackInput(
  body: unknown,
): ApiValidationResult<InterviewFeedbackInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(record, "targetRole", maxTargetRoleLength);
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const question = getRequiredString(record, "question", maxQuestionLength);
  const answer = getRequiredString(record, "answer", maxAnswerLength);
  const category = getCategory(record.category);
  const selectedCareerPath = getOptionalString(
    record,
    "selectedCareerPath",
    maxSelectedCareerPathLength,
  );
  const jobDescription = getOptionalString(
    record,
    "jobDescription",
    maxJobDescriptionLength,
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!question.ok) return question;
  if (!answer.ok) return answer;
  if (!category.ok) return category;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;

  return {
    data: {
      answer: answer.data,
      category: category.data,
      experienceLevel: experienceLevel.data,
      jobDescription: jobDescription.data,
      practiceMode: practiceMode.data,
      question: question.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

export function validateCvFeedbackInput(
  body: unknown,
): ApiValidationResult<CvFeedbackInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(record, "targetRole", maxTargetRoleLength);
  const experienceLevel = getOptionalString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const cvText = getRequiredString(record, "cvText", maxCvTextLength);
  const selectedCareerPath = getOptionalString(
    record,
    "selectedCareerPath",
    maxSelectedCareerPathLength,
  );
  const jobDescription = getOptionalString(
    record,
    "jobDescription",
    maxJobDescriptionLength,
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!cvText.ok) return cvText;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;

  return {
    data: {
      cvText: cvText.data,
      experienceLevel: experienceLevel.data,
      jobDescription: jobDescription.data,
      practiceMode: practiceMode.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

export function validateGeneratePracticeQuestionInput(
  body: unknown,
): ApiValidationResult<GeneratePracticeQuestionInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(record, "targetRole", maxTargetRoleLength);
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const category = getCategory(record.category);
  const selectedCareerPath = getOptionalString(
    record,
    "selectedCareerPath",
    maxSelectedCareerPathLength,
  );
  const jobDescription = getOptionalString(
    record,
    "jobDescription",
    maxJobDescriptionLength,
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);
  const previousQuestions = getOptionalStringArray(
    record.previousQuestions,
    maxPreviousQuestions,
    maxPreviousQuestionLength,
  );

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!category.ok) return category;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;
  if (!previousQuestions.ok) return previousQuestions;

  return {
    data: {
      category: category.data,
      experienceLevel: experienceLevel.data,
      jobDescription: jobDescription.data,
      practiceMode: practiceMode.data,
      previousQuestions: previousQuestions.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

export function validateGenerateInterviewQuestionsInput(
  body: unknown,
): ApiValidationResult<GenerateInterviewQuestionsInput> {
  const baseValidation = validateGeneratePracticeQuestionInput(body);

  if (!baseValidation.ok) {
    return baseValidation;
  }

  const record = asRecord(body);
  const count = getOptionalInteger(record?.count, "count", 1, maxGeneratedQuestions);

  if (!count.ok) {
    return count;
  }

  return {
    data: {
      ...baseValidation.data,
      count: count.data,
    },
    ok: true,
  };
}

export function validateGenerateLearningCategoriesInput(
  body: unknown,
): ApiValidationResult<GenerateLearningCategoriesInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(record, "targetRole", maxTargetRoleLength);
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const selectedCareerPath = getOptionalString(
    record,
    "selectedCareerPath",
    maxSelectedCareerPathLength,
  );
  const jobDescription = getOptionalString(
    record,
    "jobDescription",
    maxJobDescriptionLength,
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);
  const currentCategories = getOptionalStringArray(
    record.currentCategories,
    maxCurrentCategories,
    maxCurrentCategoryLength,
    "currentCategories",
  );

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;
  if (!currentCategories.ok) return currentCategories;

  return {
    data: {
      currentCategories: currentCategories.data,
      experienceLevel: experienceLevel.data,
      jobDescription: jobDescription.data,
      practiceMode: practiceMode.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

export function validateGenerateLessonInput(
  body: unknown,
): ApiValidationResult<GenerateLessonInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(record, "targetRole", maxTargetRoleLength);
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const focus = getLessonFocus(record.focus);
  const categoryTitle = getRequiredString(
    record,
    "categoryTitle",
    maxCategoryTitleLength,
  );
  const lessonTitle = getOptionalString(
    record,
    "lessonTitle",
    maxLessonTitleLength,
  );
  const selectedCareerPath = getOptionalString(
    record,
    "selectedCareerPath",
    maxSelectedCareerPathLength,
  );
  const jobDescription = getOptionalString(
    record,
    "jobDescription",
    maxJobDescriptionLength,
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);
  const question = getOptionalString(record, "question", maxQuestionLength);
  const expectedStructure = getOptionalStructure(record.expectedStructure);

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!focus.ok) return focus;
  if (!categoryTitle.ok) return categoryTitle;
  if (!lessonTitle.ok) return lessonTitle;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;
  if (!question.ok) return question;
  if (!expectedStructure.ok) return expectedStructure;

  return {
    data: {
      categoryTitle: categoryTitle.data,
      expectedStructure: expectedStructure.data,
      experienceLevel: experienceLevel.data,
      focus: focus.data,
      jobDescription: jobDescription.data,
      lessonTitle: lessonTitle.data,
      practiceMode: practiceMode.data,
      question: question.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

export async function createInterviewFeedback(
  input: InterviewFeedbackInput,
): Promise<InterviewFeedbackOutput> {
  const prompt = [
    "You are CareerFox AI, a premium career coach for interview practice.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    "Evaluate this interview answer.",
    formatAiContext(input),
    `Question category: ${input.category}`,
    `Question: ${input.question}`,
    `Answer: ${input.answer}`,
    "",
    "Return concise JSON only. Keep improvedAnswer under 140 words.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, interviewFeedbackSchema);

  return normalizeInterviewFeedback(response);
}

export async function createCvFeedback(
  input: CvFeedbackInput,
): Promise<CvFeedbackOutput> {
  const prompt = [
    "You are CareerFox AI, a premium career coach for CV improvement.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    "Review this CV for the target role.",
    formatAiContext(input),
    `CV text: ${input.cvText}`,
    "",
    "Return concise JSON only. Focus on honest keyword gaps, weak bullets, stronger replacements, and next actions.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, cvFeedbackSchema);

  return normalizeCvFeedback(response);
}

export async function createPracticeQuestion(
  input: GeneratePracticeQuestionInput,
): Promise<GeneratePracticeQuestionOutput> {
  const previousQuestions =
    input.previousQuestions && input.previousQuestions.length > 0
      ? input.previousQuestions.map((question) => `- ${question}`).join("\n")
      : "- None supplied";
  const prompt = [
    "You are CareerFox AI, a practical interview coach.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    "Generate one original interview practice question.",
    formatAiContext(input),
    `Question category: ${input.category}`,
    "Avoid repeating these previous questions:",
    previousQuestions,
    "",
    "Return concise JSON only. Guidance should contain exactly three short prompts.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, practiceQuestionSchema);

  return normalizePracticeQuestion(response, input.category);
}

export async function createInterviewQuestions(
  input: GenerateInterviewQuestionsInput,
): Promise<GenerateInterviewQuestionsOutput> {
  const count = input.count ?? 4;
  const previousQuestions =
    input.previousQuestions && input.previousQuestions.length > 0
      ? input.previousQuestions.map((question) => `- ${question}`).join("\n")
      : "- None supplied";
  const prompt = [
    "You are CareerFox AI, a practical interview coach.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    `Generate ${count} original interview practice questions.`,
    formatAiContext(input),
    `Question category: ${input.category}`,
    "Avoid repeating these previous questions:",
    previousQuestions,
    "",
    "Return concise JSON only. Each question needs exactly three guidance prompts.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, interviewQuestionsSchema);

  return normalizeInterviewQuestions(response, input.category, count);
}

export async function createLearningCategories(
  input: GenerateLearningCategoriesInput,
): Promise<GenerateLearningCategoriesOutput> {
  const currentCategories =
    input.currentCategories && input.currentCategories.length > 0
      ? input.currentCategories.map((category) => `- ${category}`).join("\n")
      : "- None supplied";
  const prompt = [
    "You are CareerFox AI, designing structured career learning paths.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    "Generate learning categories for the Learn screen.",
    formatAiContext(input),
    "Existing categories to respect or extend:",
    currentCategories,
    "",
    "Return concise JSON only. Cover interview practice, CV improvement, job search, skills, and career guidance where useful. Do not create more than eight categories.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, learningCategoriesSchema);

  return normalizeLearningCategories(response);
}

export async function createLesson(
  input: GenerateLessonInput,
): Promise<GenerateLessonOutput> {
  const prompt = [
    "You are CareerFox AI, creating a short teachable career lesson.",
    "",
    "Rules:",
    `- ${careerCoachRules}`,
    "",
    "Generate lesson content for a mobile learning or interview question-start screen.",
    formatAiContext(input),
    `Lesson focus: ${input.focus}`,
    `Category: ${input.categoryTitle}`,
    `Lesson title: ${input.lessonTitle ?? "Choose the best title"}`,
    `Interview question: ${input.question ?? "No specific question supplied"}`,
    `Expected answer structure: ${input.expectedStructure ?? "Choose the best structure"}`,
    "",
    "Return concise JSON only. Make the lesson practical enough that a user can complete it immediately.",
  ].join("\n");

  const response = await fetchGeminiStructuredJson(prompt, lessonSchema);

  return normalizeLesson(response);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function invalid<T>(error: string): ApiValidationResult<T> {
  return {
    error,
    ok: false,
  };
}

function getRequiredString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): ApiValidationResult<string> {
  const value = record[key];

  if (typeof value !== "string") {
    return invalid(`${key} must be a string.`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return invalid(`${key} is required.`);
  }

  if (trimmedValue.length > maxLength) {
    return invalid(`${key} must be ${maxLength} characters or fewer.`);
  }

  return {
    data: trimmedValue,
    ok: true,
  };
}

function getCategory(value: unknown): ApiValidationResult<InterviewCategory> {
  if (
    typeof value === "string" &&
    interviewCategories.includes(value as InterviewCategory)
  ) {
    return {
      data: value as InterviewCategory,
      ok: true,
    };
  }

  return invalid("category must be behavioral, technical, case, or hr.");
}

function getOptionalStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number,
  label = "previousQuestions",
): ApiValidationResult<string[] | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (!Array.isArray(value)) {
    return invalid(`${label} must be an array of strings.`);
  }

  if (value.length > maxItems) {
    return invalid(`${label} must contain ${maxItems} items or fewer.`);
  }

  const questions: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return invalid(`${label} must contain only strings.`);
    }

    const trimmedItem = item.trim();

    if (trimmedItem.length > maxItemLength) {
      return invalid(
        `${label} items must be ${maxItemLength} characters or fewer.`,
      );
    }

    if (trimmedItem.length > 0) {
      questions.push(trimmedItem);
    }
  }

  return {
    data: questions,
    ok: true,
  };
}

function getOptionalInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): ApiValidationResult<number | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return invalid(`${label} must be an integer.`);
  }

  if (value < minimum || value > maximum) {
    return invalid(`${label} must be between ${minimum} and ${maximum}.`);
  }

  return {
    data: value,
    ok: true,
  };
}

function getOptionalString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): ApiValidationResult<string | undefined> {
  const value = record[key];

  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (typeof value !== "string") {
    return invalid(`${key} must be a string.`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (trimmedValue.length > maxLength) {
    return invalid(`${key} must be ${maxLength} characters or fewer.`);
  }

  return {
    data: trimmedValue,
    ok: true,
  };
}

function getLessonFocus(value: unknown): ApiValidationResult<LessonFocus> {
  if (typeof value === "string" && lessonFocuses.includes(value as LessonFocus)) {
    return {
      data: value as LessonFocus,
      ok: true,
    };
  }

  return invalid("focus must be applications, career-guidance, cv, interview, or skills.");
}

function getOptionalStructure(
  value: unknown,
): ApiValidationResult<PracticeQuestionStructure | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (
    typeof value === "string" &&
    practiceQuestionStructures.includes(value as PracticeQuestionStructure)
  ) {
    return {
      data: value as PracticeQuestionStructure,
      ok: true,
    };
  }

  return invalid("expectedStructure must be STAR, XYZ, or freeform.");
}

async function fetchGeminiStructuredJson(
  prompt: string,
  schema: JsonSchema,
): Promise<unknown> {
  return getAiProvider().generateJson({
    prompt,
    schema,
  });
}

function normalizeInterviewFeedback(value: unknown): InterviewFeedbackOutput {
  const record = requireRecord(value, "interview feedback");
  const categories = requireRecord(record.categories, "interview categories");

  return {
    categories: {
      clarity: requireScore(categories.clarity, "clarity"),
      confidence: requireScore(categories.confidence, "confidence"),
      relevance: requireScore(categories.relevance, "relevance"),
      starQuality: requireScore(categories.starQuality, "starQuality"),
      structure: requireScore(categories.structure, "structure"),
    },
    improvedAnswer: requireString(record.improvedAnswer, "improvedAnswer", 1_200),
    improvements: requireStringList(record.improvements, "improvements", 4, 220),
    score: requireScore(record.score, "score"),
    strengths: requireStringList(record.strengths, "strengths", 4, 220),
    summary: requireString(record.summary, "summary", 360),
  };
}

function normalizeCvFeedback(value: unknown): CvFeedbackOutput {
  const record = requireRecord(value, "CV feedback");

  return {
    improvedBullets: requireStringList(
      record.improvedBullets,
      "improvedBullets",
      5,
      280,
    ),
    keywordGaps: requireStringList(record.keywordGaps, "keywordGaps", 8, 80),
    nextActions: requireStringList(record.nextActions, "nextActions", 5, 220),
    score: requireScore(record.score, "score"),
    summary: requireString(record.summary, "summary", 360),
    weakBullets: requireStringList(record.weakBullets, "weakBullets", 5, 220),
  };
}

function normalizePracticeQuestion(
  value: unknown,
  requestedCategory: InterviewCategory,
): GeneratePracticeQuestionOutput {
  const record = requireRecord(value, "practice question");
  const category =
    typeof record.category === "string" &&
    interviewCategories.includes(record.category as InterviewCategory)
      ? (record.category as InterviewCategory)
      : requestedCategory;

  return {
    category,
    difficulty: requireDifficulty(record.difficulty),
    expectedStructure: requireStructure(record.expectedStructure),
    guidance: requireStringList(record.guidance, "guidance", 3, 140),
    question: requireString(record.question, "question", 500),
  };
}

function normalizeInterviewQuestions(
  value: unknown,
  requestedCategory: InterviewCategory,
  requestedCount: number,
): GenerateInterviewQuestionsOutput {
  const record = requireRecord(value, "interview questions");
  const questionsValue = record.questions;

  if (!Array.isArray(questionsValue)) {
    throw new Error("questions must be an array.");
  }

  return {
    questions: questionsValue
      .slice(0, requestedCount)
      .map((question) => normalizePracticeQuestion(question, requestedCategory)),
  };
}

function normalizeLearningCategories(value: unknown): GenerateLearningCategoriesOutput {
  const record = requireRecord(value, "learning categories");
  const categoriesValue = record.categories;

  if (!Array.isArray(categoriesValue)) {
    throw new Error("categories must be an array.");
  }

  return {
    categories: categoriesValue
      .slice(0, 8)
      .map((category) => normalizeLearningCategory(category)),
  };
}

function normalizeLearningCategory(value: unknown): GeneratedLearningCategory {
  const record = requireRecord(value, "learning category");

  return {
    description: requireString(record.description, "description", 220),
    destination: requireLearningDestination(record.destination),
    id: sanitizeKebabId(requireString(record.id, "id", 80)),
    priority: requireInteger(record.priority, "priority", 1, 5),
    starterLessonTitle: requireString(
      record.starterLessonTitle,
      "starterLessonTitle",
      120,
    ),
    title: requireString(record.title, "title", 80),
  };
}

function normalizeLesson(value: unknown): GenerateLessonOutput {
  const record = requireRecord(value, "lesson");

  return {
    coachingSteps: requireStringList(record.coachingSteps, "coachingSteps", 5, 220),
    estimatedMinutes: requireInteger(
      record.estimatedMinutes,
      "estimatedMinutes",
      3,
      20,
    ),
    learningOutcomes: requireStringList(
      record.learningOutcomes,
      "learningOutcomes",
      4,
      120,
    ),
    overview: requireString(record.overview, "overview", 500),
    practicePrompt: requireString(record.practicePrompt, "practicePrompt", 500),
    title: requireString(record.title, "title", 120),
    xp: requireInteger(record.xp, "xp", 10, 100),
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  const record = asRecord(value);

  if (!record) {
    throw new Error(`Invalid ${label} response.`);
  }

  return record;
}

function requireInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }

  return Math.max(minimum, Math.min(maximum, value));
}

function requireScore(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a number.`);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function requireString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${label} cannot be empty.`);
  }

  return trimmedValue.slice(0, maxLength);
}

function requireStringList(
  value: unknown,
  label: string,
  maxItems: number,
  maxItemLength: number,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength));
}

function requireLearningDestination(value: unknown): LearningCategoryDestination {
  if (
    typeof value === "string" &&
    learningDestinations.includes(value as LearningCategoryDestination)
  ) {
    return value as LearningCategoryDestination;
  }

  throw new Error("destination must be applications, cv, detail, or interview.");
}

function requireDifficulty(value: unknown): PracticeQuestionDifficulty {
  if (typeof value === "string" && practiceQuestionDifficulties.includes(value as PracticeQuestionDifficulty)) {
    return value as PracticeQuestionDifficulty;
  }

  throw new Error("difficulty must be beginner, intermediate, or advanced.");
}

function requireStructure(value: unknown): PracticeQuestionStructure {
  if (
    typeof value === "string" &&
    practiceQuestionStructures.includes(value as PracticeQuestionStructure)
  ) {
    return value as PracticeQuestionStructure;
  }

  throw new Error("expectedStructure must be STAR, XYZ, or freeform.");
}

function sanitizeKebabId(value: string) {
  const kebabId = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return kebabId || "generated-category";
}

export function validateBasicAiRequestQuota(
  userId: string,
): ApiValidationResult<null> {
  return checkBasicAiRequestQuota(userId);
}

export class PublicApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

export function handleAiRouteError(error: unknown) {
  if (error instanceof PublicApiError) {
    return jsonResponse({ error: error.message }, { status: error.status });
  }

  if (error instanceof AiProviderError) {
    return jsonResponse({ error: error.message }, { status: error.status });
  }

  console.error(
    "CareerFox AI route error:",
    error instanceof Error ? error.message : "Unknown error",
  );

  return jsonResponse(
    { error: "CareerFox AI could not generate feedback right now." },
    { status: 500 },
  );
}
