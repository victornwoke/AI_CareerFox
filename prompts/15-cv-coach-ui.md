## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/08_home_dashboard.png`
- `prompt_material/09_progress_dashboard.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI CV Coach feature using the same Figma design language:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Routes

```txt
app/cv/index.tsx
app/cv/results.tsx
```

## CV Coach input screen

Must include:

- title: `CV Coach`
- subtitle: `Paste your CV and get practical feedback.`
- text area for CV content
- optional target role selector from Zustand
- CTA: `Analyse CV`
- privacy note: `Your CV is only sent for analysis when you tap Analyse.`

## CV Results screen

Must show:

- overall CV score
- ATS keyword gaps
- weak bullet points
- improved bullet suggestions
- summary quality
- impact score
- clarity score
- recommended next actions

## Rules

- MVP can use mock analysis first.
- Later prompt connects backend AI.
- Do not promise guaranteed interviews.
- Do not store CV text permanently unless user explicitly saves it.
