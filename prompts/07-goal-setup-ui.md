## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/06_target_role_setup.png`
- `prompt_material/07_experience_level_setup.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI goal setup flow from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Routes

Create:

```txt
app/(onboarding)/target-role.tsx
app/(onboarding)/experience-level.tsx
```

## Target Role screen

Must include:

- title: `Select your target role`
- subtitle: `This helps us personalize your coaching for you.`
- search input
- popular roles list
- role cards with icon, role title, learner/user count text, and chevron
- selected role state
- primary CTA: `Continue`

Roles come from `data/roles.ts`.

## Experience Level screen

Must include:

- title: `Select experience level`
- subtitle: `Choose the option that best describes you.`
- three to five cards:
  - Entry Level
  - Mid Level
  - Senior Level
  - Lead / Principal
- selected state with purple border/check
- primary CTA: `Continue`

## Behaviour

- Save selected role and experience level to Zustand.
- Persist selections with AsyncStorage.
- After completion, navigate to `(tabs)/home`.

## UI Rules

- Match Figma spacing and visual style.
- Use accessible radio/card selection states.
- Do not add AI calls here.
