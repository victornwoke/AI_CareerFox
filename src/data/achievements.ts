import type { Achievement } from "@/types/career";

export const achievements: Achievement[] = [
  {
    id: "first-step",
    title: "First Step",
    description: "Complete your first CareerFox mission.",
    icon: "spark",
    unlocked: false,
  },
  {
    id: "interview-warmup",
    title: "Interview Warmup",
    description: "Answer three interview practice questions.",
    icon: "microphone",
    unlocked: false,
  },
  {
    id: "star-builder",
    title: "STAR Builder",
    description: "Create five structured STAR answers.",
    icon: "star",
    unlocked: false,
  },
  {
    id: "cv-polish",
    title: "CV Polish",
    description: "Improve five CV bullets with clearer evidence.",
    icon: "document",
    unlocked: false,
  },
  {
    id: "application-sprint",
    title: "Application Sprint",
    description: "Prepare three tailored applications.",
    icon: "send",
    unlocked: false,
  },
  {
    id: "confidence-streak",
    title: "Confidence Streak",
    description: "Complete career practice three days in a row.",
    icon: "flame",
    unlocked: false,
  },
  {
    id: "role-ready",
    title: "Role Ready",
    description: "Finish a full practice set for your target role.",
    icon: "target",
    unlocked: false,
  },
  {
    id: "career-fox-pro",
    title: "CareerFox Pro",
    description: "Earn 500 XP through focused career practice.",
    icon: "trophy",
    unlocked: false,
  },
];
