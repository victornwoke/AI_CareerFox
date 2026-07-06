## Visual Reference Files

No dedicated screen reference is required for this prompt.

Still follow:

- `AGENTS.md`
- the existing app design system
- the Figma source link if available

Read AGENTS.md first and follow it strictly.

Create the hardcoded CareerFox AI content system using TypeScript data.

## Files

Create:

```txt
types/career.ts
data/roles.ts
data/experienceLevels.ts
data/missions.ts
data/interviewCategories.ts
data/interviewQuestions.ts
data/cvTips.ts
data/achievements.ts
```

## Required types

```ts
export type TargetRole = {
  id: string;
  title: string;
  category: "tech" | "product" | "data" | "design" | "business" | "marketing";
  description: string;
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
```

## Sample data

Include sample data for:

- Software Engineer
- Product Manager
- Data Analyst
- UX Designer
- Marketing Manager
- Business Analyst
- Cloud Engineer
- DevOps Engineer

Include at least 30+ interview questions across categories.

## Rules

- Keep data typed.
- Avoid `any`.
- Do not add a database.
- Keep content easy to extend.
