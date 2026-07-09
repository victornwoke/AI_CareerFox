import {
    AiProviderError,
    getAiProvider,
    getCvAiProvider,
} from "@/lib/ai/aiProvider";
import {
    careerCoachRules,
    cvCoachRules,
    formatAiContext,
} from "@/lib/ai/prompts";
import type { JsonSchema } from "@/lib/ai/schemas";
import {
    AI_TEXT_LIMITS,
    type AiPracticeMode,
    validateBasicAiRequestQuota as checkBasicAiRequestQuota,
    validateAiPracticeMode,
} from "@/lib/ai/validators";
import { Buffer } from "node:buffer";
import { inflateSync } from "node:zlib";

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
  cloudProvider?: string;
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
  nextPracticeSuggestion: string;
};

export type CvFeedbackInput = {
  cvFile?: UploadedFileInput;
  cvText?: string;
  cloudProvider?: string;
  experienceLevel?: string;
  jobDescriptionFile?: UploadedFileInput;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

type ResolvedCvFeedbackInput = CvFeedbackInput & {
  cvText: string;
};

type UploadedFileInput = {
  base64: string;
  mimeType?: string;
  name: string;
};

export type CvFeedbackOutput = {
  score: number;
  summary: string;
  weakBullets: string[];
  improvedBullets: string[];
  keywordGaps: string[];
  nextActions: string[];
  categories: {
    clarity: number;
    impact: number;
    relevance: number;
    atsReadability: number;
    roleAlignment: number;
  };
};

export type GeneratePracticeQuestionInput = {
  category: InterviewCategory;
  difficulty?: PracticeQuestionDifficulty;
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  previousQuestions?: string[];
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type GeneratePracticeQuestionOutput = {
  answerTips: string[];
  category: InterviewCategory;
  difficulty: PracticeQuestionDifficulty;
  expectedStructure: PracticeQuestionStructure;
  question: string;
  whyThisQuestionMatters: string;
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

export type RoleLearningModuleType =
  | "learn"
  | "practice"
  | "mock_interview"
  | "cv";

export type RoleLearningPlanModule = {
  description: string;
  estimatedMinutes: number;
  id: string;
  title: string;
  type: RoleLearningModuleType;
  xp: number;
};

export type GenerateRoleLearningPlanInput = {
  experienceLevel: string;
  jobDescription?: string;
  practiceMode?: AiPracticeMode;
  selectedCareerPath?: string;
  targetRole: string;
  userId: string;
};

export type GenerateRoleLearningPlanOutput = {
  modules: RoleLearningPlanModule[];
  summary: string;
  title: string;
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

const maxRequestBytes = 8_000_000;
const maxUserIdLength = 120;
const maxTargetRoleLength = 120;
const maxExperienceLevelLength = 80;
const maxQuestionLength = 800;
const maxAnswerLength = AI_TEXT_LIMITS.answer;
const maxCvTextLength = AI_TEXT_LIMITS.cvText;
const maxJobDescriptionLength = AI_TEXT_LIMITS.jobDescription;
const maxFileNameLength = 260;
const maxMimeTypeLength = 120;
const maxCategoryTitleLength = 120;
const maxCurrentCategoryLength = 120;
const maxCurrentCategories = 12;
const maxGeneratedQuestions = 6;
const maxLessonTitleLength = 160;
const maxPreviousQuestionLength = 300;
const maxPreviousQuestions = 8;
const maxSelectedCareerPathLength = 120;
const maxCloudProviderLength = 40;

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

const roleLearningModuleTypes: readonly RoleLearningModuleType[] = [
  "learn",
  "practice",
  "mock_interview",
  "cv",
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
    nextPracticeSuggestion: {
      description: "One specific next interview practice task for the user.",
      type: "string",
    },
  },
  required: [
    "score",
    "summary",
    "strengths",
    "improvements",
    "improvedAnswer",
    "categories",
    "nextPracticeSuggestion",
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
      description:
        "Up to three weak or generic CV bullets copied only when short.",
      items: { type: "string" },
      type: "array",
    },
    improvedBullets: {
      description:
        "Sharper replacement bullets with action, scope, and measurable impact.",
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
    categories: {
      additionalProperties: false,
      description: "Five CV quality sub-scores from 0 to 100.",
      properties: {
        clarity: {
          description:
            "How clearly the CV communicates experience and outcomes.",
          maximum: 100,
          minimum: 0,
          type: "integer",
        },
        impact: {
          description: "Strength of measurable impact and results shown.",
          maximum: 100,
          minimum: 0,
          type: "integer",
        },
        relevance: {
          description:
            "Match between the CV and the target role or job description.",
          maximum: 100,
          minimum: 0,
          type: "integer",
        },
        atsReadability: {
          description:
            "How well the CV parses and reads for applicant tracking systems.",
          maximum: 100,
          minimum: 0,
          type: "integer",
        },
        roleAlignment: {
          description:
            "How strongly the CV aligns with the chosen target role.",
          maximum: 100,
          minimum: 0,
          type: "integer",
        },
      },
      required: [
        "clarity",
        "impact",
        "relevance",
        "atsReadability",
        "roleAlignment",
      ],
      type: "object",
    },
  },
  required: [
    "score",
    "summary",
    "weakBullets",
    "improvedBullets",
    "keywordGaps",
    "nextActions",
    "categories",
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
    whyThisQuestionMatters: {
      description:
        "One sentence on why this question helps the candidate prepare.",
      type: "string",
    },
    answerTips: {
      description:
        "Exactly three short, practical tips for answering the question well.",
      items: { type: "string" },
      type: "array",
    },
  },
  required: [
    "question",
    "category",
    "difficulty",
    "expectedStructure",
    "whyThisQuestionMatters",
    "answerTips",
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

const roleLearningPlanSchema: JsonSchema = {
  additionalProperties: false,
  properties: {
    title: {
      description: "A concise title for the role learning plan.",
      type: "string",
    },
    summary: {
      description: "A short, practical one or two sentence plan summary.",
      type: "string",
    },
    modules: {
      description: "A short, practical list of 4 to 6 learning modules.",
      items: {
        additionalProperties: false,
        properties: {
          id: {
            description: "A short kebab-case module identifier.",
            type: "string",
          },
          title: {
            description: "A concise module title.",
            type: "string",
          },
          description: {
            description: "A practical one-sentence module description.",
            type: "string",
          },
          estimatedMinutes: {
            description: "Estimated minutes to complete, from 3 to 60.",
            maximum: 60,
            minimum: 3,
            type: "integer",
          },
          xp: {
            description: "XP reward for completing the module, from 10 to 100.",
            maximum: 100,
            minimum: 10,
            type: "integer",
          },
          type: {
            description: "The module type.",
            enum: ["learn", "practice", "mock_interview", "cv"],
            type: "string",
          },
        },
        required: [
          "id",
          "title",
          "description",
          "estimatedMinutes",
          "xp",
          "type",
        ],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["title", "summary", "modules"],
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
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function validateRequestSize(
  request: Request,
): ApiValidationResult<null> {
  const contentLength = request.headers.get("content-length");
  const byteLength = contentLength ? Number(contentLength) : null;

  if (
    byteLength !== null &&
    Number.isFinite(byteLength) &&
    byteLength > maxRequestBytes
  ) {
    return {
      error: "Request body is too large.",
      ok: false,
    };
  }

  return { data: null, ok: true };
}

export async function readJsonBody(
  request: Request,
): Promise<ApiValidationResult<unknown>> {
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
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const question = getRequiredString(record, "question", maxQuestionLength);
  const answer = getRequiredString(record, "answer", maxAnswerLength);
  const category = getCategory(record.category);
  const cloudProvider = getOptionalString(
    record,
    "cloudProvider",
    maxCloudProviderLength,
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

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!question.ok) return question;
  if (!answer.ok) return answer;
  if (!category.ok) return category;
  if (!cloudProvider.ok) return cloudProvider;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;

  return {
    data: {
      answer: answer.data,
      category: category.data,
      cloudProvider: cloudProvider.data,
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
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
  const experienceLevel = getOptionalString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const cvText = getOptionalTrimmedString(record, "cvText", maxCvTextLength);
  const cvFile = validateUploadedFile(record.cvFile, "cvFile");
  const cloudProvider = getOptionalString(
    record,
    "cloudProvider",
    maxCloudProviderLength,
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
  const jobDescriptionFile = validateUploadedFile(
    record.jobDescriptionFile,
    "jobDescriptionFile",
  );
  const practiceMode = validateAiPracticeMode(record.practiceMode);

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!cvText.ok) return cvText;
  if (!cvFile.ok) return cvFile;
  if (!cloudProvider.ok) return cloudProvider;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!jobDescriptionFile.ok) return jobDescriptionFile;
  if (!practiceMode.ok) return practiceMode;

  if (!cvText.data && !cvFile.data) {
    return invalid("cvText or cvFile is required.");
  }

  return {
    data: {
      cloudProvider: cloudProvider.data,
      cvFile: cvFile.data,
      cvText: cvText.data,
      experienceLevel: experienceLevel.data,
      jobDescriptionFile: jobDescriptionFile.data,
      jobDescription: jobDescription.data,
      practiceMode: practiceMode.data,
      selectedCareerPath: selectedCareerPath.data,
      targetRole: targetRole.data,
      userId: userId.data,
    },
    ok: true,
  };
}

function validateDifficulty(
  value: unknown,
): ApiValidationResult<PracticeQuestionDifficulty | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  if (
    typeof value === "string" &&
    practiceQuestionDifficulties.includes(value as PracticeQuestionDifficulty)
  ) {
    return {
      data: value as PracticeQuestionDifficulty,
      ok: true,
    };
  }

  return {
    error: "difficulty must be beginner, intermediate, or advanced.",
    ok: false,
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
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
  const experienceLevel = getRequiredString(
    record,
    "experienceLevel",
    maxExperienceLevelLength,
  );
  const category = getCategory(record.category);
  const difficulty = validateDifficulty(record.difficulty);
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
  if (!difficulty.ok) return difficulty;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;
  if (!previousQuestions.ok) return previousQuestions;

  return {
    data: {
      category: category.data,
      difficulty: difficulty.data,
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

export function validateGenerateRoleLearningPlanInput(
  body: unknown,
): ApiValidationResult<GenerateRoleLearningPlanInput> {
  const record = asRecord(body);

  if (!record) {
    return invalid("Request body must be a JSON object.");
  }

  const userId = getRequiredString(record, "userId", maxUserIdLength);
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
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

  if (!userId.ok) return userId;
  if (!targetRole.ok) return targetRole;
  if (!experienceLevel.ok) return experienceLevel;
  if (!selectedCareerPath.ok) return selectedCareerPath;
  if (!jobDescription.ok) return jobDescription;
  if (!practiceMode.ok) return practiceMode;

  return {
    data: {
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

export function validateGenerateInterviewQuestionsInput(
  body: unknown,
): ApiValidationResult<GenerateInterviewQuestionsInput> {
  const baseValidation = validateGeneratePracticeQuestionInput(body);

  if (!baseValidation.ok) {
    return baseValidation;
  }

  const record = asRecord(body);
  const count = getOptionalInteger(
    record?.count,
    "count",
    1,
    maxGeneratedQuestions,
  );

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
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
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
  const targetRole = getRequiredString(
    record,
    "targetRole",
    maxTargetRoleLength,
  );
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
    "You are CareerFox AI, a supportive but honest interview coach.",
    `Rules:\n${careerCoachRules}`,
    "Evaluate the answer and return concise JSON only.",
    formatAiContext(input),
    `Question category: ${input.category}`,
    `Question: ${input.question}`,
    `Answer: ${input.answer}`,
    "Explain the score clearly in summary.",
    "Use exactly two strengths and two improvements.",
    "Avoid vague advice; name the wording, structure, evidence, or result to improve.",
    "Keep improvedAnswer under 100 words and use STAR or XYZ where suitable.",
    "Make nextPracticeSuggestion one specific drill.",
  ].join("\n");

  try {
    const response = await fetchGeminiStructuredJson(
      prompt,
      interviewFeedbackSchema,
    );

    return normalizeInterviewFeedback(response);
  } catch (error) {
    throw error;
  }
}

export async function createCvFeedback(
  input: CvFeedbackInput,
): Promise<CvFeedbackOutput> {
  const resolvedCvText = input.cvText?.trim()
    ? input.cvText.trim()
    : input.cvFile
      ? await extractTextFromUploadedFile(input.cvFile)
      : null;

  // When text extraction fails but we have the raw file, send it directly
  // to OpenRouter's vision model — it reads PDFs and DOCX natively.
  const cvInlineFile: { data: string; mimeType: string } | null =
    !resolvedCvText && input.cvFile
      ? {
          data: input.cvFile.base64.replace(/^data:[^;]+;base64,/, ""),
          mimeType: input.cvFile.mimeType ?? "application/pdf",
        }
      : null;

  if (!resolvedCvText && !input.cvFile) {
    throw new PublicApiError(
      "Please upload your CV so CareerFox can review it.",
      422,
    );
  }

  const resolvedJobDescription = input.jobDescription?.trim()
    ? input.jobDescription.trim()
    : input.jobDescriptionFile
      ? await extractTextFromUploadedFile(input.jobDescriptionFile)
      : undefined;

  const jdInlineFile: { data: string; mimeType: string } | null =
    !resolvedJobDescription && input.jobDescriptionFile
      ? {
          data: input.jobDescriptionFile.base64.replace(
            /^data:[^;]+;base64,/,
            "",
          ),
          mimeType: input.jobDescriptionFile.mimeType ?? "application/pdf",
        }
      : null;

  const inlineFiles = [cvInlineFile, jdInlineFile].filter(
    (file): file is { data: string; mimeType: string } => file !== null,
  );

  const resolvedInput: ResolvedCvFeedbackInput = {
    ...input,
    cvText: resolvedCvText ?? "(CV provided as an attached document)",
    jobDescription: resolvedJobDescription ?? undefined,
  };

  const cvSection = resolvedCvText
    ? `CV text:\n${resolvedCvText}`
    : "CV: read directly from the attached document.";

  const jdInlineNote =
    !resolvedJobDescription && input.jobDescriptionFile
      ? "Job description: read directly from the second attached document."
      : "";

  const prompt = [
    "You are CareerFox AI, a premium career coach for CV improvement.",
    "",
    "Rules:",
    `${cvCoachRules}`,
    "",
    "Review this CV for the target role.",
    formatAiContext(resolvedInput),
    cvSection,
    jdInlineNote,
    "",
    "Return concise JSON only. Focus on honest keyword gaps, weak bullets, stronger replacements, and next actions.",
    "Score five sub-categories from 0 to 100: clarity, impact, relevance, atsReadability, roleAlignment.",
    "Never invent companies, metrics, tools, dates, or responsibilities. Mark suggested metrics as placeholders.",
    "Improve weak bullets using XYZ style and stronger action verbs where honest.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetchCvStructuredJson(
      prompt,
      cvFeedbackSchema,
      inlineFiles.length > 0 ? inlineFiles : undefined,
    );

    return normalizeCvFeedback(response);
  } catch (error) {
    let finalError: unknown = error;

    // If the optional JD inline file appears to be causing provider issues,
    // retry once with CV-only context so analysis still succeeds.
    if (jdInlineFile) {
      try {
        const retryInlineFiles = cvInlineFile ? [cvInlineFile] : undefined;
        const retryResponse = await fetchCvStructuredJson(
          prompt,
          cvFeedbackSchema,
          retryInlineFiles,
        );

        return normalizeCvFeedback(retryResponse);
      } catch (retryError) {
        finalError = retryError;
      }
    }

    throw finalError;
  }
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
    `${careerCoachRules}`,
    "",
    "Generate one original interview practice question.",
    formatAiContext(input),
    input.difficulty ? `Preferred difficulty: ${input.difficulty}.` : "",
    `Question category: ${input.category}`,
    "Avoid repeating these previous questions:",
    previousQuestions,
    "",
    "The question must be realistic for the selected role and level.",
    "If a job description is supplied, base the question on its responsibilities, skills, and requirements.",
    "Do not invent company-specific facts.",
    "Return concise JSON only.",
    "Include whyThisQuestionMatters: one sentence on why this question helps the candidate prepare.",
    "Include answerTips: exactly three short, practical tips for answering the question well.",
  ].join("\n");

  try {
    const response = await fetchGeminiStructuredJson(
      prompt,
      practiceQuestionSchema,
    );

    return normalizePracticeQuestion(response, input.category);
  } catch (error) {
    throw error;
  }
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
    `${careerCoachRules}`,
    "",
    `Generate ${count} original interview practice questions.`,
    formatAiContext(input),
    `Question category: ${input.category}`,
    "Avoid repeating these previous questions:",
    previousQuestions,
    "",
    "Return concise JSON only. Each question needs exactly three answerTips and a one-sentence whyThisQuestionMatters.",
  ].join("\n");

  try {
    const response = await fetchGeminiStructuredJson(
      prompt,
      interviewQuestionsSchema,
    );

    return normalizeInterviewQuestions(response, input.category, count);
  } catch (error) {
    throw error;
  }
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
    `${careerCoachRules}`,
    "",
    "Generate learning categories for the Learn screen.",
    formatAiContext(input),
    "Existing categories to respect or extend:",
    currentCategories,
    "",
    "Return concise JSON only. Cover interview practice, CV improvement, job search, skills, and career guidance where useful. Do not create more than eight categories.",
  ].join("\n");

  try {
    const response = await fetchGeminiStructuredJson(
      prompt,
      learningCategoriesSchema,
    );

    return normalizeLearningCategories(response);
  } catch (error) {
    throw error;
  }
}

export async function createRoleLearningPlan(
  input: GenerateRoleLearningPlanInput,
): Promise<GenerateRoleLearningPlanOutput> {
  const prompt = [
    "You are CareerFox AI, designing a short, practical role learning plan.",
    "",
    "Rules:",
    `${careerCoachRules}`,
    "",
    "Create a concise learning plan for the selected target role and experience level.",
    formatAiContext(input),
    "Keep the plan short and practical. Do not create a massive curriculum.",
    "Return concise JSON only with 4 to 6 modules covering learn, practice, mock interview, and cv where relevant.",
    "Each module needs id (kebab-case), title, description, estimatedMinutes (3 to 60), xp (10 to 100), and type (learn, practice, mock_interview, or cv).",
  ].join("\n");

  try {
    const response = await fetchGeminiStructuredJson(
      prompt,
      roleLearningPlanSchema,
    );

    return normalizeRoleLearningPlan(response);
  } catch (error) {
    throw error;
  }
}

export async function createLesson(
  input: GenerateLessonInput,
): Promise<GenerateLessonOutput> {
  const prompt = [
    "You are CareerFox AI, creating a short teachable career lesson.",
    "",
    "Rules:",
    `${careerCoachRules}`,
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

  try {
    const response = await fetchGeminiStructuredJson(prompt, lessonSchema);

    return normalizeLesson(response);
  } catch (error) {
    throw error;
  }
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

function getOptionalTrimmedString(
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

  if (trimmedValue.length > maxLength) {
    return invalid(`${key} must be ${maxLength} characters or fewer.`);
  }

  return {
    data: trimmedValue.length > 0 ? trimmedValue : undefined,
    ok: true,
  };
}

function validateUploadedFile(
  value: unknown,
  key: string,
): ApiValidationResult<UploadedFileInput | undefined> {
  if (value === undefined) {
    return {
      data: undefined,
      ok: true,
    };
  }

  const record = asRecord(value);

  if (!record) {
    return invalid(`${key} must be an object.`);
  }

  const name = getRequiredString(record, "name", maxFileNameLength);
  const base64 = getRequiredString(record, "base64", maxRequestBytes);
  const mimeType = getOptionalTrimmedString(
    record,
    "mimeType",
    maxMimeTypeLength,
  );

  if (!name.ok) return name;
  if (!base64.ok) return base64;
  if (!mimeType.ok) return mimeType;

  return {
    data: {
      base64: base64.data,
      mimeType: mimeType.data,
      name: name.data,
    },
    ok: true,
  };
}

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function decodePdfStringToken(value: string): string {
  let decoded = "";

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];

    if (current !== "\\") {
      decoded += current;
      continue;
    }

    const next = value[index + 1];

    if (!next) {
      break;
    }

    index += 1;

    switch (next) {
      case "n":
        decoded += "\n";
        break;
      case "r":
        decoded += "\r";
        break;
      case "t":
        decoded += "\t";
        break;
      case "b":
        decoded += "\b";
        break;
      case "f":
        decoded += "\f";
        break;
      case "(":
      case ")":
      case "\\":
        decoded += next;
        break;
      default: {
        if (/[0-7]/.test(next)) {
          let octal = next;
          let octalCount = 1;

          while (
            octalCount < 3 &&
            index + 1 < value.length &&
            /[0-7]/.test(value[index + 1] ?? "")
          ) {
            octal += value[index + 1];
            index += 1;
            octalCount += 1;
          }

          decoded += String.fromCharCode(parseInt(octal, 8));
          break;
        }

        decoded += next;
      }
    }
  }

  return decoded;
}

function extractPdfTextFromContent(content: string): string[] {
  const segments: string[] = [];

  const tjMatches = content.matchAll(/\((?:\\.|[^\\()])*\)\s*Tj/g);
  for (const match of tjMatches) {
    const tokenMatch = match[0].match(/^\(((?:\\.|[^\\()])*)\)\s*Tj$/);
    if (!tokenMatch?.[1]) {
      continue;
    }

    const decoded = decodePdfStringToken(tokenMatch[1]).trim();
    if (decoded.length > 0) {
      segments.push(decoded);
    }
  }

  const tjArrayMatches = content.matchAll(/\[(.*?)\]\s*TJ/gs);
  for (const match of tjArrayMatches) {
    const payload = match[1] ?? "";
    const stringTokens = payload.match(/\((?:\\.|[^\\()])*\)/g) ?? [];

    for (const token of stringTokens) {
      const raw = token.slice(1, -1);
      const decoded = decodePdfStringToken(raw).trim();

      if (decoded.length > 0) {
        segments.push(decoded);
      }
    }
  }

  return segments;
}

function tryLightweightPdfTextExtraction(buffer: Buffer): string | null {
  const source = buffer.toString("latin1");
  const segments: string[] = [];

  const streamMatches = source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g);

  for (const match of streamMatches) {
    const streamBody = match[1] ?? "";

    if (streamBody.length === 0) {
      continue;
    }

    const streamBuffer = Buffer.from(streamBody, "latin1");
    const candidates: string[] = [streamBody];

    try {
      const inflated = inflateSync(streamBuffer).toString("latin1");
      candidates.push(inflated);
    } catch {
      // Stream is not Flate-compressed; ignore.
    }

    for (const candidate of candidates) {
      segments.push(...extractPdfTextFromContent(candidate));
    }
  }

  if (segments.length === 0) {
    segments.push(...extractPdfTextFromContent(source));
  }

  const normalized = segments.join(" ").replace(/\s+/g, " ").trim();

  return normalized.length >= 20 ? normalized : null;
}

export async function extractTextFromUploadedFile(
  file: UploadedFileInput,
): Promise<string | null> {
  let buffer: Buffer;

  try {
    const cleanBase64 = file.base64.replace(/^data:[^;]+;base64,/, "");
    buffer = Buffer.from(cleanBase64, "base64");
  } catch {
    return null;
  }

  if (buffer.length === 0) {
    return null;
  }

  const mimeType = file.mimeType ?? "";
  const extension = getFileExtension(file.name);

  if (extension === "pdf" || mimeType === "application/pdf") {
    try {
      const pdfParse = await import("pdf-parse");
      const parseFn = pdfParse.default || pdfParse;
      const data = await parseFn(buffer);
      const text = typeof data.text === "string" ? data.text.trim() : "";

      return text.length > 0 ? text : null;
    } catch {
      return tryLightweightPdfTextExtraction(buffer);
    }
  }

  if (
    extension === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = Uint8Array.from(buffer).buffer;
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value?.trim() ?? "";

      return text.length > 0 ? text : null;
    } catch {
      return null;
    }
  }

  if (
    extension === "txt" ||
    extension === "rtf" ||
    mimeType.startsWith("text/")
  ) {
    const text = buffer.toString("utf8").trim();

    return text.length > 0 ? text : null;
  }

  const fallbackText = buffer.toString("utf8").trim();

  return fallbackText.length > 0 ? fallbackText : null;
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
  if (
    typeof value === "string" &&
    lessonFocuses.includes(value as LessonFocus)
  ) {
    return {
      data: value as LessonFocus,
      ok: true,
    };
  }

  return invalid(
    "focus must be applications, career-guidance, cv, interview, or skills.",
  );
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
  inlineFiles?: { data: string; mimeType: string }[],
): Promise<unknown> {
  return getAiProvider().generateJson({
    inlineFiles,
    prompt,
    schema,
  });
}

/**
 * CV-specific fetch helper.
 * Routes to OpenRouter with support for both text and vision models.
 * Text-only requests use text models for better performance.
 * Requests with inline files use vision models for PDF/DOCX analysis.
 */
async function fetchCvStructuredJson(
  prompt: string,
  schema: JsonSchema,
  inlineFiles?: { data: string; mimeType: string }[],
): Promise<unknown> {
  return getCvAiProvider().generateJson({ prompt, schema, inlineFiles });
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
    improvedAnswer: requireString(
      record.improvedAnswer,
      "improvedAnswer",
      1_200,
    ),
    improvements: requireStringList(
      record.improvements,
      "improvements",
      4,
      220,
    ),
    nextPracticeSuggestion: requireString(
      record.nextPracticeSuggestion,
      "nextPracticeSuggestion",
      280,
    ),
    score: requireScore(record.score, "score"),
    strengths: requireStringList(record.strengths, "strengths", 4, 220),
    summary: requireString(record.summary, "summary", 360),
  };
}

function normalizeCvFeedback(value: unknown): CvFeedbackOutput {
  const record = requireRecord(value, "CV feedback");
  const categoriesRecord = requireRecord(record.categories, "CV categories");

  return {
    categories: {
      atsReadability: requireScore(
        categoriesRecord.atsReadability,
        "atsReadability",
      ),
      clarity: requireScore(categoriesRecord.clarity, "clarity"),
      impact: requireScore(categoriesRecord.impact, "impact"),
      relevance: requireScore(categoriesRecord.relevance, "relevance"),
      roleAlignment: requireScore(
        categoriesRecord.roleAlignment,
        "roleAlignment",
      ),
    },
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
    answerTips: requireStringList(record.answerTips, "answerTips", 3, 140),
    category,
    difficulty: requireDifficulty(record.difficulty),
    expectedStructure: requireStructure(record.expectedStructure),
    question: requireString(record.question, "question", 500),
    whyThisQuestionMatters: requireString(
      record.whyThisQuestionMatters,
      "whyThisQuestionMatters",
      280,
    ),
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
      .map((question) =>
        normalizePracticeQuestion(question, requestedCategory),
      ),
  };
}

function normalizeLearningCategories(
  value: unknown,
): GenerateLearningCategoriesOutput {
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
    coachingSteps: requireStringList(
      record.coachingSteps,
      "coachingSteps",
      5,
      220,
    ),
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

function requireString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
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

function requireLearningDestination(
  value: unknown,
): LearningCategoryDestination {
  if (
    typeof value === "string" &&
    learningDestinations.includes(value as LearningCategoryDestination)
  ) {
    return value as LearningCategoryDestination;
  }

  throw new Error(
    "destination must be applications, cv, detail, or interview.",
  );
}

function requireDifficulty(value: unknown): PracticeQuestionDifficulty {
  if (
    typeof value === "string" &&
    practiceQuestionDifficulties.includes(value as PracticeQuestionDifficulty)
  ) {
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

function requireModuleType(value: unknown): RoleLearningModuleType {
  if (
    typeof value === "string" &&
    roleLearningModuleTypes.includes(value as RoleLearningModuleType)
  ) {
    return value as RoleLearningModuleType;
  }

  throw new Error("type must be learn, practice, mock_interview, or cv.");
}

function normalizeRoleLearningPlan(
  value: unknown,
): GenerateRoleLearningPlanOutput {
  const record = requireRecord(value, "role learning plan");
  const modulesValue = record.modules;

  if (!Array.isArray(modulesValue)) {
    throw new Error("modules must be an array.");
  }

  return {
    modules: modulesValue.slice(0, 6).map((module) => {
      const moduleRecord = requireRecord(module, "learning module");

      return {
        description: requireString(
          moduleRecord.description,
          "description",
          220,
        ),
        estimatedMinutes: requireInteger(
          moduleRecord.estimatedMinutes,
          "estimatedMinutes",
          3,
          60,
        ),
        id: sanitizeKebabId(requireString(moduleRecord.id, "id", 80)),
        title: requireString(moduleRecord.title, "title", 80),
        type: requireModuleType(moduleRecord.type),
        xp: requireInteger(moduleRecord.xp, "xp", 10, 100),
      };
    }),
    summary: requireString(record.summary, "summary", 360),
    title: requireString(record.title, "title", 120),
  };
}

function sanitizeKebabId(value: string) {
  const kebabId = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return kebabId || "generated-category";
}

export function validateBasicAiRequestQuota(
  request: Request,
): ApiValidationResult<null> {
  return checkBasicAiRequestQuota(request);
}

export function enforceAiQuota(request: Request): Response | null {
  const quotaValidation = validateBasicAiRequestQuota(request);

  if (!quotaValidation.ok) {
    return jsonResponse({ error: quotaValidation.error }, { status: 429 });
  }

  return null;
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
