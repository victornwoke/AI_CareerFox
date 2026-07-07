## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/11_learning_categories.png` -> Learn / career categories
- `prompt_material/12_interview_practice.png` -> Interview Practice
- `prompt_material/13_behavioural_questions.png` -> Behavioural Questions
- `prompt_material/14_lesson_intro.png` -> Lesson Intro / question start
- `prompt_material/15_voice_answer.png` -> Voice Answer / AI Coach

The AI coding agent must open and compare against only the files that affect the screen being implemented. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement backend AI feedback endpoints for CareerFox AI.

## Important

All AI calls must happen through backend/API routes. Never expose API keys in the mobile app.

## API routes

Create backend routes appropriate to the project setup:

```txt
/api/interview-feedback
/api/cv-feedback
/api/generate-practice-question
/api/generate-interview-questions
/api/generate-learning-categories
/api/generate-lesson
```

## Interview feedback input

```ts
{
  userId: string;
  targetRole: string;
  experienceLevel: string;
  question: string;
  answer: string;
  category: "behavioral" | "technical" | "case" | "hr";
}
```

## Interview feedback output

```ts
{
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
}
```

## CV feedback input

```ts
{
  userId: string;
  targetRole: string;
  cvText: string;
}
```

## CV feedback output

```ts
{
  score: number;
  summary: string;
  weakBullets: string[];
  improvedBullets: string[];
  keywordGaps: string[];
  nextActions: string[];
}
```

## Generate practice question input

```ts
{
  userId: string;
  targetRole: string;
  experienceLevel: string;
  category: "behavioral" | "technical" | "case" | "hr";
  previousQuestions?: string[];
}
```

## Generate practice question output

```ts
{
  question: string;
  category: "behavioral" | "technical" | "case" | "hr";
  difficulty: "beginner" | "intermediate" | "advanced";
  expectedStructure: "STAR" | "XYZ" | "freeform";
  guidance: string[];
}
```

## Generate interview questions input

```ts
{
  userId: string;
  targetRole: string;
  experienceLevel: string;
  category: "behavioral" | "technical" | "case" | "hr";
  count?: number;
  previousQuestions?: string[];
}
```

## Generate interview questions output

```ts
{
  questions: {
    question: string;
    category: "behavioral" | "technical" | "case" | "hr";
    difficulty: "beginner" | "intermediate" | "advanced";
    expectedStructure: "STAR" | "XYZ" | "freeform";
    guidance: string[];
  }[];
}
```

## Generate learning categories input

```ts
{
  userId: string;
  targetRole: string;
  experienceLevel: string;
  currentCategories?: string[];
}
```

## Generate learning categories output

```ts
{
  categories: {
    id: string;
    title: string;
    description: string;
    destination: "applications" | "cv" | "detail" | "interview";
    priority: number;
    starterLessonTitle: string;
  }[];
}
```

## Generate lesson input

```ts
{
  userId: string;
  targetRole: string;
  experienceLevel: string;
  focus: "applications" | "career-guidance" | "cv" | "interview" | "skills";
  categoryTitle: string;
  lessonTitle?: string;
  question?: string;
  expectedStructure?: "STAR" | "XYZ" | "freeform";
}
```

## Generate lesson output

```ts
{
  title: string;
  overview: string;
  learningOutcomes: string[];
  coachingSteps: string[];
  practicePrompt: string;
  estimatedMinutes: number;
  xp: number;
}
```

## Prompt rules

AI must:

- be practical and specific
- avoid generic motivational fluff
- use STAR/XYZ where relevant
- suggest measurable impact
- avoid promising jobs or interviews
- be supportive but honest

## Security

- Validate request body.
- Limit response size.
- Add basic error handling.
- Do not log full CV text or full interview answers.
