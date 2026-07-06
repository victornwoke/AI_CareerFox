import type { CvTip } from "@/types/career";

export const cvTips: CvTip[] = [
  {
    id: "lead-with-target-role",
    title: "Lead with your target role",
    category: "format",
    description: "Make the first third of your CV clearly match the role you want next.",
    example: "Software engineer with React, TypeScript, and API experience building user-facing product features.",
  },
  {
    id: "turn-duties-into-impact",
    title: "Turn duties into impact",
    category: "impact",
    description: "Replace task-only bullets with action, scope, and outcome.",
    example: "Improved onboarding completion by 18 percent by simplifying form validation and error states.",
  },
  {
    id: "mirror-relevant-keywords",
    title: "Mirror relevant keywords",
    category: "keywords",
    description: "Use honest keywords from the job description where they match your real experience.",
    example: "If the job asks for SQL dashboards, include SQL dashboards in a project or experience bullet.",
  },
  {
    id: "prioritize-recent-proof",
    title: "Prioritize recent proof",
    category: "experience",
    description: "Give more space to recent, relevant projects and less space to older unrelated work.",
    example: "Keep a part-time job to two bullets if your portfolio project better proves the target role.",
  },
  {
    id: "use-specific-tools",
    title: "Name specific tools",
    category: "keywords",
    description: "List tools in context so they feel credible instead of decorative.",
    example: "Analyzed retention cohorts in SQL and visualized weekly activation trends in Power BI.",
  },
  {
    id: "proofread-backwards",
    title: "Proofread backwards",
    category: "proofreading",
    description: "Read bullets from bottom to top to catch typos, tense changes, and repeated wording.",
    example: "Check verbs first: built, led, analyzed, improved, shipped, reduced.",
  },
  {
    id: "keep-bullets-tight",
    title: "Keep bullets tight",
    category: "format",
    description: "Aim for concise bullets that a recruiter can scan quickly.",
    example: "Built a dashboard tracking 12 KPIs for weekly leadership reviews.",
  },
  {
    id: "show-collaboration",
    title: "Show collaboration",
    category: "experience",
    description: "Many roles require working with others, so include cross-functional proof where relevant.",
    example: "Partnered with design and support to reduce repeated customer onboarding issues.",
  },
];
