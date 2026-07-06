import type { ExperienceLevel } from "@/types/career";

export const experienceLevels: ExperienceLevel[] = [
  {
    id: "entry",
    label: "Entry Level",
    years: "0-1 years",
    description: "You are building core skills, preparing for first roles, internships, apprenticeships, or junior positions.",
  },
  {
    id: "junior",
    label: "Junior",
    years: "1-3 years",
    description: "You can contribute independently with guidance and want sharper examples, stronger confidence, and better role fit.",
  },
  {
    id: "mid",
    label: "Mid Level",
    years: "3-6 years",
    description: "You own meaningful work, collaborate across teams, and need to show measurable impact and judgment.",
  },
  {
    id: "senior",
    label: "Senior",
    years: "6+ years",
    description: "You lead complex work, influence others, and need evidence of strategy, tradeoffs, mentoring, and business value.",
  },
];
