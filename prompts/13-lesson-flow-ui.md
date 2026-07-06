## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/13_behavioural_questions.png`
- `prompt_material/14_lesson_intro.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the interview lesson flow from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Routes

```txt
app/interview/behavioral.tsx
app/interview/lesson-intro.tsx
app/interview/question.tsx
```

## Behavioral Questions screen

Show:

- title: `Behavioral Questions`
- progress: e.g. `6 / 12`
- question/lesson list
- completed state
- in-progress state
- current selected question

## Lesson Intro screen

Show:

- lesson title, e.g. `Why do you want this job?`
- lesson number
- illustration
- what user will learn:
  - structure answer clearly
  - avoid generic wording
  - practise with AI feedback
- difficulty
- time estimate
- XP reward
- CTA: `Start Lesson`

## Question screen

Show:

- progress indicator
- question text
- user answer input or voice CTA
- skip button
- next button

## Rules

- Use question data from `data/interviewQuestions.ts`.
- Store progress in Zustand.
- No AI call yet unless connected by later prompt.
