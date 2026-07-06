import type { InterviewCategory } from "@/types/career";

export const interviewCategories: InterviewCategory[] = [
  {
    id: "behavioral",
    title: "Behavioral",
    description: "Questions about past experience, teamwork, conflict, ownership, learning, and communication.",
  },
  {
    id: "technical",
    title: "Technical",
    description: "Role-specific questions that test practical skills, tools, concepts, and tradeoffs.",
  },
  {
    id: "case",
    title: "Case",
    description: "Scenario questions that test structured thinking, prioritization, and problem solving.",
  },
  {
    id: "hr",
    title: "HR",
    description: "Motivation, expectations, work style, values, salary framing, and role fit.",
  },
];
