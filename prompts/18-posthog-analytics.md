## Visual Reference Files

No dedicated screen reference is required for this prompt.

Still follow:

- `AGENTS.md`
- the existing app design system
- the Figma source link if available

Read AGENTS.md first and follow it strictly.

Add PostHog event tracking to CareerFox AI.

Use the PostHog instance already initialized in the app if it exists. Do not reinitialize it.

## Identify user

After Clerk authentication completes:

- call `posthog.identify()` with Clerk user ID
- set `$set_once`:
  - signup_date
- update:
  - target_role
  - experience_level

## Events

Capture these custom events:

1. `onboarding_started`
2. `signup_started`
3. `signup_completed`
4. `target_role_selected`
5. `experience_level_selected`
6. `daily_mission_started`
7. `daily_mission_completed`
8. `interview_practice_started`
9. `interview_answer_submitted`
10. `interview_feedback_viewed`
11. `cv_analysis_started`
12. `cv_analysis_completed`
13. `application_added`
14. `subscription_paywall_viewed`
15. `subscription_started`

## Rules

- Do not track sensitive CV content.
- Do not track full interview answers.
- Use IDs, categories, scores, and durations only.
- Add helper functions in `lib/analytics.ts`.
- Do not modify UI unless necessary.
