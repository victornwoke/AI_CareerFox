<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into CareerFox AI. The SDK (`posthog-react-native`) was installed alongside all required peer dependencies (`expo-file-system`, `expo-application`, `expo-device`, `expo-localization`, `react-native-svg`). A PostHog client was configured in `src/config/posthog.ts` using `expo-constants` to read the token and host from `app.config.js` extras (which in turn read from environment variables). `PostHogProvider` and a screen tracker were added to the root layout (`src/app/_layout.tsx`), enabling automatic touch autocapture and manual screen tracking across all Expo Router routes. User identification via `posthog.identify()` was wired into both the email and social auth sign-in/sign-up flows in Clerk. Nine business-critical events are now tracked across the auth, onboarding, interview, CV, and applications flows.

| Event name | Description | File |
|---|---|---|
| `user_signed_up` | User successfully completes email registration and verification. | `src/app/(auth)/sign-up.tsx` |
| `user_signed_in` | User successfully signs in with email/password or social provider. | `src/app/(auth)/sign-in.tsx` |
| `onboarding_target_role_selected` | User selects a target role during onboarding setup. | `src/app/(onboarding)/target-role.tsx` |
| `onboarding_completed` | User finishes onboarding by selecting an experience level and reaching the home screen. | `src/app/(onboarding)/experience-level.tsx` |
| `interview_practice_started` | User begins a behavioral interview practice session. | `src/app/interview/lesson-intro.tsx` |
| `interview_answer_submitted` | User submits or skips a behavioral interview question answer. | `src/app/interview/question.tsx` |
| `cv_analysis_started` | User taps Analyse CV to kick off a CV review session. | `src/app/cv/index.tsx` |
| `application_created` | User saves a new job application to their tracker. | `src/app/applications/new.tsx` |
| `learning_category_viewed` | User opens a learning category detail screen. | `src/app/learn/[categoryId].tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) Dashboard](https://eu.posthog.com/project/217798/dashboard/798949)
- [Sign-ups and Sign-ins (last 30 days)](https://eu.posthog.com/project/217798/insights/mWCImZGO)
- [Onboarding Conversion Funnel](https://eu.posthog.com/project/217798/insights/KCisWEg5)
- [Interview Practice Activity](https://eu.posthog.com/project/217798/insights/OVJT43xH)
- [CV Analyses Started](https://eu.posthog.com/project/217798/insights/ij9wqnwo)
- [Applications Created](https://eu.posthog.com/project/217798/insights/MbdyByrP)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs. Currently `identify` is called on `completeSignIn`/`completeSignUp`; verify that users who reopen the app while already authenticated are also identified (consider adding `identify` in `CareerFoxStorageSync` or an auth listener that fires on app resume).

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
