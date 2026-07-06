## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/15_voice_answer.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

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
