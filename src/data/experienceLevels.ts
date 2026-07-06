import type { ExperienceLevel } from "@/types/career";

export const experienceLevels: ExperienceLevel[] = [
  {
    id: "entry",
    label: "Entry Level",
    years: "0-2 years experience",
    description: "You are building core skills and preparing for internships, apprenticeships, junior roles, or your first career move.",
  },
  {
    id: "mid",
    label: "Mid Level",
    years: "3-6 years experience",
    description: "You own meaningful work, collaborate across teams, and need to show measurable impact and judgment.",
  },
  {
    id: "senior",
    label: "Senior",
    years: "6-10 years experience",
    description: "You lead complex work, influence others, and need evidence of strategy, tradeoffs, mentoring, and business value.",
  },
  {
    id: "lead-principal",
    label: "Lead / Principal",
    years: "10+ years experience",
    description: "You shape direction across teams and need to show leadership, systems thinking, influence, and durable business outcomes.",
  },
];
