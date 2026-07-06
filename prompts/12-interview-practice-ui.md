## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/12_interview_practice.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the Interview Practice screen from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Route

```txt
app/interview/index.tsx
```

## Required sections

- header: `Interview Practice`
- subtitle: `Practice with AI and build real confidence.`
- hero card with career/interview illustration
- modules list:
  - Behavioral Questions
  - Technical Fundamentals
  - HR Interviews
  - Case Interviews
- status:
  - completed
  - in progress
  - locked/future
- time estimate per module
- progress percentage

## Behaviour

- Tapping Behavioral Questions opens `app/interview/behavioral.tsx`.
- Tapping Voice Practice opens `app/interview/voice.tsx`.
- Do not lock modules in MVP; lock icons can be visual only.

## UI Rules

- Use hardcoded question data.
- Use selected target role and experience level to filter questions when possible.
- Preserve Figma spacing and card style.
