import type { SymbolIconName } from "@/components/ui/SymbolIcon";

export type TargetRole = {
  id: string;
  title: string;
  category: "tech" | "product" | "data" | "design" | "business" | "marketing";
  description: string;
  icon: SymbolIconName;
  iconBackground: string;
  iconColor: string;
  popularKeywords: string[];
};

export type ExperienceLevel = {
  id: string;
  label: string;
  years: string;
  description: string;
};

export type CareerMission = {
  id: string;
  title: string;
  description: string;
  category: "interview" | "cv" | "applications" | "skills";
  xp: number;
  completed: boolean;
};

export type InterviewQuestion = {
  id: string;
  roleId: string;
  category: "behavioral" | "technical" | "case" | "hr";
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  guidance: string[];
  expectedStructure: "STAR" | "XYZ" | "freeform";
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export type InterviewCategory = {
  id: InterviewQuestion["category"];
  title: string;
  description: string;
  icon: SymbolIconName;
  iconBackground: string;
  iconColor: string;
};

export type InterviewQuestionBankCount = {
  base: number;
  byExperienceLevel: Partial<Record<string, number>>;
  roleCategoryBonus?: Partial<Record<TargetRole["category"], number>>;
};

export type CvTip = {
  id: string;
  title: string;
  category: "impact" | "format" | "keywords" | "experience" | "proofreading";
  description: string;
  example: string;
};

export type LearningCategoryDestination =
  | "applications"
  | "cv"
  | "detail"
  | "interview";

export type LearningCategory = {
  id: string;
  title: string;
  description: string;
  icon: SymbolIconName;
  iconBackground: string;
  iconColor: string;
  destination: LearningCategoryDestination;
};
