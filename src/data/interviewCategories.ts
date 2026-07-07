import { colors } from "@/constants/colors";
import type {
  InterviewCategory,
  InterviewQuestionBankCount,
  LearningCategory,
} from "@/types/career";

export const interviewCategories: InterviewCategory[] = [
  {
    id: "behavioral",
    title: "Behavioral Interviews",
    description: "Questions about past experience, teamwork, conflict, ownership, learning, and communication.",
    icon: "person.crop.circle.fill",
    iconBackground: colors.softSuccess,
    iconColor: colors.success,
  },
  {
    id: "technical",
    title: "Technical Interviews",
    description: "Role-specific questions that test practical skills, tools, concepts, and tradeoffs.",
    icon: "chevron.left.forwardslash.chevron.right",
    iconBackground: colors.mutedPurple,
    iconColor: colors.primary,
  },
  {
    id: "case",
    title: "Case Interviews",
    description: "Scenario questions that test structured thinking, prioritization, and problem solving.",
    icon: "chart.bar.xaxis",
    iconBackground: colors.softEnergy,
    iconColor: colors.energy,
  },
  {
    id: "hr",
    title: "HR / Hiring Manager Interviews",
    description: "Motivation, expectations, work style, values, salary framing, and role fit.",
    icon: "person",
    iconBackground: colors.softBlue,
    iconColor: colors.blue,
  },
];

const requiredInterviewCategories = interviewCategories.filter(
  (category) =>
    category.id === "behavioral" ||
    category.id === "hr" ||
    category.id === "technical" ||
    category.id === "case",
);

export const interviewQuestionBankCounts: Record<
  InterviewCategory["id"],
  InterviewQuestionBankCount
> = {
  behavioral: {
    base: 48,
    byExperienceLevel: {
      entry: 42,
      mid: 56,
      senior: 72,
      "lead-principal": 84,
    },
  },
  case: {
    base: 32,
    byExperienceLevel: {
      entry: 24,
      mid: 36,
      senior: 44,
      "lead-principal": 52,
    },
    roleCategoryBonus: {
      business: 16,
      product: 18,
    },
  },
  hr: {
    base: 36,
    byExperienceLevel: {
      entry: 30,
      mid: 40,
      senior: 48,
      "lead-principal": 56,
    },
  },
  technical: {
    base: 54,
    byExperienceLevel: {
      entry: 44,
      mid: 68,
      senior: 88,
      "lead-principal": 104,
    },
    roleCategoryBonus: {
      data: 14,
      design: 8,
      tech: 24,
    },
  },
};

export const learningCategories: LearningCategory[] = [
  {
    id: "interview-practice",
    title: "Interview Practice",
    description: "Mock questions, answer drills, and confidence-building sessions.",
    icon: "mic.fill",
    iconBackground: colors.softSuccess,
    iconColor: colors.success,
    destination: "interview",
  },
  {
    id: "resume-cv",
    title: "Resume & CV",
    description: "Improve bullets, structure, keywords, and measurable impact.",
    icon: "doc.text.fill",
    iconBackground: colors.mutedPurple,
    iconColor: colors.primary,
    destination: "cv",
  },
  {
    id: "skills-knowledge",
    title: "Skills & Knowledge",
    description: "Strengthen core concepts and role-specific knowledge gaps.",
    icon: "book.closed",
    iconBackground: colors.softBlue,
    iconColor: colors.blue,
    destination: "detail",
  },
  {
    id: "career-guidance",
    title: "Career Guidance",
    description: "Clarify goals, next steps, positioning, and career direction.",
    icon: "target",
    iconBackground: colors.softEnergy,
    iconColor: colors.energy,
    destination: "detail",
  },
  {
    id: "job-search",
    title: "Job Search",
    description: "Plan applications, follow-ups, outreach, and weekly momentum.",
    icon: "briefcase.fill",
    iconBackground: colors.softAccent,
    iconColor: colors.accent,
    destination: "applications",
  },
  ...requiredInterviewCategories.map(
    (category): LearningCategory => ({
      id: `${category.id}-interviews`,
      title: category.title,
      description: category.description,
      icon: category.icon,
      iconBackground: category.iconBackground,
      iconColor: category.iconColor,
      destination: "detail",
    }),
  ),
];
