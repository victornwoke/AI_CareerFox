## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/11_learning_categories.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI Learn/Categories screen from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Route

```txt
app/(tabs)/learn.tsx
```

## Required content

Show career improvement categories:

- Interview Practice
- Resume & CV
- Skills & Knowledge
- Career Guidance
- Job Search
- HR Interviews
- Technical Interviews
- Case Interviews

Each category card must show:

- icon
- title
- short description
- progress/completion where applicable
- chevron or tap affordance

## Behaviour

- Tapping Interview Practice opens `app/interview/index.tsx`.
- Tapping Resume & CV opens `app/cv/index.tsx`.
- Tapping Job Search opens `app/applications/index.tsx`.
- Other categories can navigate to placeholder detail screens.

## UI Rules

- Match Figma style.
- Use search input at the top.
- Use typed data from `data/interviewCategories.ts`.
