# AGENTS.md — CareerFox AI Production Rules

## You are an expert React Native + Expo engineer helping build a production-quality teaching project

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this app is used to teach developers how to build feature by feature.

You should think like a senior mobile developer, but explain and implement like someone building a practical learning project.

## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/00_brand_and_colors.png`
- `prompt_material/01_typography.png`
- `prompt_material/02_onboarding.png`
- `prompt_material/03_sign_up.png`
- `prompt_material/04_sign_in.png`
- `prompt_material/05_email_verification.png`
- `prompt_material/06_target_role_setup.png`
- `prompt_material/07_experience_level_setup.png`
- `prompt_material/08_home_dashboard.png`
- `prompt_material/09_progress_dashboard.png`
- `prompt_material/10_achievements.png`
- `prompt_material/11_learning_categories.png`
- `prompt_material/12_interview_practice.png`
- `prompt_material/13_behavioural_questions.png`
- `prompt_material/14_lesson_intro.png`
- `prompt_material/15_voice_answer.png`

When the user provides a design image:

You MUST:

- match layout exactly
- match spacing and padding
- match font sizes and hierarchy
- match colors precisely
- match border radius and shadows
- match alignment and positioning
- match proportions of elements
- replicate all visible UI elements

Do not approximate. Do not simplify unless explicitly asked.
The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, and these PNG files are the required screen references if the figma is not available.

You are an expert React Native + Expo engineer building a production-quality iPhone app called **CareerFox AI**.

Use the Figma Make design as the single visual reference:
<https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1>

## Required Tools and Documentation

Before implementing a feature, consult `00-TOOLS-AND-DOCS.md`.

Use these official documentation sources:

- Expo: `https://docs.expo.dev`
- CodeRabbit: `https://app.coderabbit.ai`
- PostHog: `https://posthog.com/docs`
- Clerk: `https://clerk.com/docs`
- Zustand: `https://zustand.docs.pmnd.rs`
- NativeWind: `https://www.nativewind.dev`
- Vision Agents: `https://docs.visionagents.ai` or the current official Vision Agents docs for the installed SDK
- GetStream: `https://getstream.io`
- Gemini API: `https://ai.google.dev/gemini-api/docs`

Rules:

- Check `package.json` before using a tool.
- Use the official docs for the installed version.
- Do not use outdated setup steps.
- Do not add advanced tools before the MVP needs them.
- Never expose provider secrets in the mobile app.

## Product Overview

CareerFox AI is a playful, premium AI career coach that helps users:

- practise mock interviews
- improve CV/resume content
- prepare STAR/XYZ answers
- track job applications
- build daily career confidence
- earn XP, streaks, achievements, and progress scores

This is not a generic chatbot wrapper. It is a structured career improvement app with AI features inside it.

## Tech Stack

Use:

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- Zustand
- AsyncStorage
- Clerk for authentication
- backend/API routes for AI calls and secrets
- PostHog for analytics if already configured
- RevenueCat or Apple IAP only when subscription flow is implemented properly

Do not introduce new major libraries without asking.

## Project Structure

Use this structure in the figman and below or unless there is a strong reason to change it:

```txt
app/
  (auth)/
  (onboarding)/
  (tabs)/
  interview/
  cv/
  applications/
components/
constants/
data/
hooks/
lib/
store/
types/
assets/
```

## UI Quality Rules

Match the Figma design closely:

- mobile-first iPhone layout
- white background with soft purple surfaces
- rounded cards
- large touch targets
- gradient primary buttons
- friendly fox mascot
- premium career-coach feel
- clean Poppins-style typography
- soft shadows
- clear hierarchy

Do not copy the Duolingo product concept. Use the Figma design as the CareerFox AI source of truth.

## Safe Area and Scroll Spacing Rules

Avoid artificial whitespace at the top or bottom of screens.

- Do not add separate spacer views above custom headers.
- For custom full-bleed headers, set `automaticallyAdjustContentInsets={false}` and `contentInsetAdjustmentBehavior="never"` on the `ScrollView`.
- Use compact safe-area top padding for custom headers: `Math.max(insets.top - 8, 24)` unless a specific design requires a different value.
- Use modest bottom scroll padding, usually `insets.bottom + 24`.
- Do not stack `contentInsetAdjustmentBehavior="automatic"` with manual `paddingTop: insets.top + ...`; that creates double top spacing.
- If a tab bar is present, only add extra bottom space when content is actually hidden behind the tab bar.

## Implementation Rules

For every feature:

1. Read this file first.
2. Check the Figma design.
3. Identify files to change.
4. Keep changes focused.
5. Use TypeScript strictly.
6. Avoid `any`.
7. Use NativeWind by default.
8. Use StyleSheet only for React Native edge cases.
9. Use centralized assets through `constants/images.ts`.
10. Use Zustand for shared state.
11. Persist important user progress with AsyncStorage.
12. Never expose API secrets in the mobile app.
13. Run lint/typecheck before finishing.

## Feature Implementation Rules

When the user asks to build a feature:

1. Read this file first.
2. Identify files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Ensure feature works end-to-end.
7. Fix errors before finishing.

## TypeScript Rules

Use TypeScript strictly.

Avoid `any`.

Keep types simple and readable.

## State Management Rules

Use Zustand for global client state.

Use local state for temporary UI state.

Persist using AsyncStorage when needed.

## AI Safety Rules

AI must not guarantee:

- job offers
- interview success
- salary increases
- visa outcomes
- legal employment advice

AI feedback must be practical, supportive, role-aware, and specific.

## Clerk Rules

Use Clerk for authentication.

Do not build custom auth.

Never expose secrets in the frontend.

## Image Generation Rules

If the user enables image generation:

- Generate images that are **visually identical or extremely close** to the provided UI reference
- Do not change style, colors, or composition
- Keep consistency with the design system

After generating images:

- Place them inside the `assets/` folder
- Use clear and organized naming:

## Communication Style

Be concise.

Explain what changed and how to test.

## Linting and Validation

Run:

```bash
npm run lint
npm run typecheck
```

Fix errors.

## Component Creation Rule

Only create reusable components when necessary.

Ask if unsure.

## Code Simplicity Rules

Avoid overengineering.

Refactor only when needed.

## Lesson Content Rules

Use hardcoded JSON/TS

Do not introduce a database unless explicitly requested.

## Important Constraints

No database for this version.

Use:

- JSON for content
- Zustand for state
- AsyncStorage for persistence
- backend only for secure operations

## Final Rule

Build real product value before visual extras. Every screen should help the user move closer to a better job.

Before every feature implementation:

- Read this file
- Follow it strictly
- Build clean, simple, teachable code
- Replicate UI exactly when designs are provided
