## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/08_home_dashboard.png`
- `prompt_material/09_progress_dashboard.png`
- `prompt_material/10_achievements.png`
- `prompt_material/11_learning_categories.png`
- `prompt_material/12_interview_practice.png`
- `prompt_material/15_voice_answer.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI bottom tab navigation from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Tabs

Create tab routes:

```txt
app/(tabs)/home.tsx
app/(tabs)/learn.tsx
app/(tabs)/coach.tsx
app/(tabs)/applications.tsx
app/(tabs)/profile.tsx
```

## Tab labels

- Home
- Learn
- Coach
- Applications
- Profile

## Icons

Use the existing icon library if installed. Recommended:

- Home: home icon
- Learn: book/open book
- Coach: mic or AI/brain icon
- Applications: briefcase/list icon
- Profile: user icon

## Custom tab bar

Build a polished custom tab bar:

- white floating pill container
- soft top shadow
- active purple icon/label
- inactive grey icon/label
- large touch targets
- safe-area aware bottom spacing
- no clipped content on iPhone

## Rules

- Do not implement full screen UI yet.
- Add simple placeholders only.
- Keep routing production-ready.
