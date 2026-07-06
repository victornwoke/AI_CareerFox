## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/08_home_dashboard.png`
- `prompt_material/09_progress_dashboard.png`
- `prompt_material/10_achievements.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI Home screen exactly from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Route

```txt
app/(tabs)/home.tsx
```

## Required sections

1. Header
   - greeting with Clerk user name
   - notification icon
   - small avatar/mascot
   - streak or flame counter

2. Daily Mission card
   - title: `Daily Mission`
   - mission title from `data/missions.ts`
   - XP reward
   - progress bar
   - trophy/chest/award visual

3. Stats cards
   - Streak
   - Total XP
   - CV Score / Readiness score

4. Today’s Plan
   - Mock Interview
   - Improve CV
   - Job Search
   - completion circles/checks
   - `View all` link

5. Next Up card
   - next interview or CV mission
   - CTA button

## Data

Use:

- Clerk user
- Zustand selected role
- Zustand progress
- hardcoded missions

## UI Rules

- Match the Figma card spacing, rounded corners, shadows, and purple gradient.
- Use `ScrollView` with safe content padding.
- Keep bottom tab visible and not overlapped.
- Add loading and empty states.
