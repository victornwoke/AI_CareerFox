# CareerFox AI Prompt Pack — Screen-Referenced Version

Use these prompts in order. They convert the Figma Make design into a production-ready Expo + React Native app.

Figma source:
https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1


## PRD

Start with:

1. `00-PRD.md`
2. `00-TOOLS-AND-DOCS.md`
3. `00-AGENTS.md`
3. then the numbered implementation prompts

The PRD defines the product, users, MVP scope, user flows, requirements, milestones, risks, and acceptance criteria. The AGENTS file defines how the AI coding agent must behave. The implementation prompts define each coding task.

## Important

This updated prompt pack now explicitly names the exact PNG screen reference files each `.md` prompt should use.

Place the screen images in your project like this:

```txt
your-app/
  AGENTS.md
  prompts/
  prompt_material/
    00_brand_and_colors.png
    01_typography.png
    02_onboarding.png
    03_sign_up.png
    04_sign_in.png
    05_email_verification.png
    06_target_role_setup.png
    07_experience_level_setup.png
    08_home_dashboard.png
    09_progress_dashboard.png
    10_achievements.png
    11_learning_categories.png
    12_interview_practice.png
    13_behavioural_questions.png
    14_lesson_intro.png
    15_voice_answer.png
```

## Recommended order

1. `00-AGENTS.md`
2. `01-nativewind.md`
3. `02-design-theme.md`
4. `03-onboarding-ui.md`
5. `04-authentication-ui.md`
6. `05-clerk.md`
7. `06-career-content-system.md`
8. `07-goal-setup-ui.md`
9. `08-zustand.md`
10. `09-bottom-tab-nav.md`
11. `10-home-ui.md`
12. `11-learning-categories-ui.md`
13. `12-interview-practice-ui.md`
14. `13-lesson-flow-ui.md`
15. `14-voice-answer-ui.md`
16. `15-cv-coach-ui.md`
17. `16-application-tracker-ui.md`
18. `17-ai-feedback-backend.md`
19. `18-posthog-analytics.md`
20. `19-revenuecat-iap.md`
21. `20-production-readiness.md`

## Prompt-to-screen map

| Prompt | Required visual reference files |
|---|---|
| `00-AGENTS.md` | `prompt_material/00_brand_and_colors.png`<br>`prompt_material/01_typography.png`<br>`prompt_material/02_onboarding.png`<br>`prompt_material/03_sign_up.png`<br>`prompt_material/04_sign_in.png`<br>`prompt_material/05_email_verification.png`<br>`prompt_material/06_target_role_setup.png`<br>`prompt_material/07_experience_level_setup.png`<br>`prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png`<br>`prompt_material/10_achievements.png`<br>`prompt_material/11_learning_categories.png`<br>`prompt_material/12_interview_practice.png`<br>`prompt_material/13_behavioural_questions.png`<br>`prompt_material/14_lesson_intro.png`<br>`prompt_material/15_voice_answer.png` |
| `01-nativewind.md` | No dedicated screen image |
| `02-design-theme.md` | `prompt_material/00_brand_and_colors.png`<br>`prompt_material/01_typography.png` |
| `03-onboarding-ui.md` | `prompt_material/02_onboarding.png` |
| `04-authentication-ui.md` | `prompt_material/03_sign_up.png`<br>`prompt_material/04_sign_in.png`<br>`prompt_material/05_email_verification.png` |
| `05-clerk.md` | `prompt_material/03_sign_up.png`<br>`prompt_material/04_sign_in.png`<br>`prompt_material/05_email_verification.png` |
| `06-career-content-system.md` | No dedicated screen image |
| `07-goal-setup-ui.md` | `prompt_material/06_target_role_setup.png`<br>`prompt_material/07_experience_level_setup.png` |
| `08-zustand.md` | No dedicated screen image |
| `09-bottom-tab-nav.md` | `prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png`<br>`prompt_material/10_achievements.png`<br>`prompt_material/11_learning_categories.png`<br>`prompt_material/12_interview_practice.png`<br>`prompt_material/15_voice_answer.png` |
| `10-home-ui.md` | `prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png`<br>`prompt_material/10_achievements.png` |
| `11-learning-categories-ui.md` | `prompt_material/11_learning_categories.png` |
| `12-interview-practice-ui.md` | `prompt_material/12_interview_practice.png` |
| `13-lesson-flow-ui.md` | `prompt_material/13_behavioural_questions.png`<br>`prompt_material/14_lesson_intro.png` |
| `14-voice-answer-ui.md` | `prompt_material/15_voice_answer.png` |
| `15-cv-coach-ui.md` | `prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png` |
| `16-application-tracker-ui.md` | `prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png` |
| `17-ai-feedback-backend.md` | `prompt_material/15_voice_answer.png` |
| `18-posthog-analytics.md` | No dedicated screen image |
| `19-revenuecat-iap.md` | `prompt_material/08_home_dashboard.png` |
| `20-production-readiness.md` | `prompt_material/00_brand_and_colors.png`<br>`prompt_material/01_typography.png`<br>`prompt_material/02_onboarding.png`<br>`prompt_material/03_sign_up.png`<br>`prompt_material/04_sign_in.png`<br>`prompt_material/05_email_verification.png`<br>`prompt_material/06_target_role_setup.png`<br>`prompt_material/07_experience_level_setup.png`<br>`prompt_material/08_home_dashboard.png`<br>`prompt_material/09_progress_dashboard.png`<br>`prompt_material/10_achievements.png`<br>`prompt_material/11_learning_categories.png`<br>`prompt_material/12_interview_practice.png`<br>`prompt_material/13_behavioural_questions.png`<br>`prompt_material/14_lesson_intro.png`<br>`prompt_material/15_voice_answer.png` |

## Best agent instruction format

Use this format each time:

```txt
Read AGENTS.md first and follow it strictly.

Task:
Implement prompts/[PROMPT_FILE_NAME].

Visual reference:
Open the PNG files named inside the prompt under "Visual Reference Files" and use them as the exact UI reference.

Rules:
- Do not change unrelated files.
- Keep the existing design system.
- Use TypeScript strictly.
- Use NativeWind unless AGENTS.md says otherwise.
- Use centralized image imports.
- Do not expose secrets.
- Run lint/typecheck if available.
- At the end, tell me what changed, which files changed, how to test, and any limitations.
```

## Tools and Docs

`00-TOOLS-AND-DOCS.md` lists the required official documentation sources for Expo, CodeRabbit, PostHog, Clerk, Zustand, NativeWind, Vision Agents, GetStream, and Gemini API.
