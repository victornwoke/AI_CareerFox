import type { GeneratePracticeQuestionOutput } from "@/lib/server/aiFeedback";

export type GeneratedPracticeQuestion = {
  createdAt: string;
  id: string;
  question: GeneratePracticeQuestionOutput;
};

export function createGeneratedPracticeQuestionId() {
  return `ai-generated-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function getEstimatedMinutesForDifficulty(
  difficulty: GeneratePracticeQuestionOutput["difficulty"],
) {
  if (difficulty === "advanced") {
    return 12;
  }

  if (difficulty === "intermediate") {
    return 8;
  }

  return 5;
}

export function getXpForDifficulty(
  difficulty: GeneratePracticeQuestionOutput["difficulty"],
) {
  if (difficulty === "advanced") {
    return 60;
  }

  if (difficulty === "intermediate") {
    return 45;
  }

  return 30;
}
