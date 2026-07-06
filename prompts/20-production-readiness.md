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

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Prepare CareerFox AI for production and App Store readiness.

## Required checks

1. TypeScript
   - no `any` unless justified
   - no unused variables
   - no broken imports

2. Navigation
   - auth guards work
   - onboarding flow works
   - setup flow works
   - tabs work
   - back navigation works

3. UI
   - no clipped content on iPhone
   - safe areas respected
   - keyboard does not cover fields
   - bottom tab does not overlap content
   - loading, empty, and error states exist

4. Security
   - no API secrets in frontend
   - no sensitive logs
   - CV/interview data handled carefully
   - env files not committed

5. Store
   - AsyncStorage persistence works
   - reset testing state available in dev only
   - no sensitive CV text persisted by default

6. AI
   - backend routes validate input
   - clear errors shown
   - no guaranteed employment claims

7. App Store
   - app icon
   - splash screen
   - privacy policy link
   - terms link
   - support email
   - screenshots
   - accurate feature claims

## Validation commands

Run available commands:

```bash
npm run lint
npm run typecheck
npm test
npx expo-doctor
```

If a command does not exist, inspect `package.json` and use the closest available script.

## Final output

Report:

- files changed
- features completed
- validation results
- known limitations
- how to test end to end
