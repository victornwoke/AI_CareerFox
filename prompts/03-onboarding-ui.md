## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/02_onboarding.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI onboarding flow exactly from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Route

Create:

```txt
app/(onboarding)/onboarding.tsx
```

or use the existing Expo Router convention in the project.

## Screens

Build a swipe-ready onboarding layout with 3 to 4 steps:

1. **Your AI Career Coach**
   - headline: `Your AI Career Coach.`
   - supporting text: `Personalized guidance, real practice, and smart feedback to help you land your dream job.`
   - mascot illustration
   - primary CTA: `Get Started`

2. **Practice Interviews**
   - headline: `Practice interviews.`
   - supporting text: `Train with realistic questions for your target role.`

3. **Boost Your CV**
   - headline: `Boost your CV.`
   - supporting text: `Find weak bullets, missing keywords, and stronger ways to show impact.`

4. **Track Progress**
   - headline: `Land your dream role.`
   - supporting text: `Stay consistent with missions, XP, streaks, and application tracking.`

## UI Rules

- Match the Figma spacing, rounded corners, soft shadows, and purple gradient button.
- Use mascot assets through `constants/images.ts`.
- Include pagination dots.
- Use large touch targets.
- `Get Started` navigates to Sign Up.
- Keep the design clean and App Store-ready.

## Do not

- Do not mention Duolingo.
- Do not copy any language-learning wording.
- Do not add backend logic yet.
