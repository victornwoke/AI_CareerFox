# CareerFox AI — Product Requirements Document (PRD)

## 1. Product Name

**CareerFox AI**

## 2. One-Line Description

CareerFox AI is a playful AI career coach that helps job seekers practise interviews, improve their CV, track applications, and build daily job-search confidence through missions, XP, streaks, and personalised feedback.

## 3. Product Vision

CareerFox AI should feel like a personal career coach in the user’s pocket.

The app should help users move from uncertainty to confident job-search action by giving them a simple daily plan, realistic interview practice, CV improvement guidance, and structured application tracking.

The product must not feel like a generic chatbot. It should feel like a structured career training app with AI features built into clear workflows.

## 4. Problem Statement

Many job seekers struggle with:

- knowing what to do every day during a job search
- explaining their experience clearly
- writing strong CV bullet points
- preparing for interviews
- tracking applications and follow-ups
- staying confident after rejection
- converting scattered advice into consistent action

CareerFox AI solves this by turning career preparation into a guided daily system.

## 5. Target Users

### Primary Users

- graduates
- entry-level job seekers
- career changers
- junior tech candidates
- immigrant job seekers
- professionals returning to work
- users preparing for interviews
- users who lack confidence explaining their experience

### Secondary Users

- mid-level professionals changing roles
- freelancers moving into full-time work
- bootcamp graduates
- self-taught tech learners
- people applying for remote roles

## 6. Core Value Proposition

CareerFox AI helps users:

1. practise realistic interview questions
2. improve CV bullets and keyword alignment
3. track job applications and next actions
4. build confidence through daily missions
5. measure progress with XP, streaks, readiness score, and achievements

## 7. Product Positioning

CareerFox AI should be positioned as:

- Duolingo-style career preparation
- a private AI interview coach
- a daily job-search confidence trainer
- a structured alternative to random ChatGPT prompts

CareerFox AI should not be positioned as:

- a job board
- a LinkedIn clone
- a generic CV builder
- a guaranteed job placement app
- a recruitment agency

## 8. Business Goals

### MVP Goals

- validate that users want guided AI career coaching
- help users complete interview and CV practice flows
- test whether users return for daily missions
- create a foundation for subscription monetisation

### Production Goals

- increase daily active usage through missions and streaks
- convert power users to a paid plan
- build strong App Store screenshots and onboarding
- create differentiated AI career coaching workflows
- collect privacy-safe analytics for product improvement

## 9. Success Metrics

### Activation Metrics

- onboarding completion rate
- account creation rate
- goal setup completion rate
- first mission completion rate

### Engagement Metrics

- daily mission completion rate
- interview practice sessions per user
- CV analysis completions
- application tracker entries created
- streak retention

### Quality Metrics

- average interview feedback score improvement
- CV score improvement after suggestions
- percentage of users completing at least 3 missions
- user feedback rating after AI coaching session

### Monetisation Metrics

- paywall view rate
- free-to-paid conversion rate
- trial start rate
- subscription renewal rate

## 10. Non-Goals

The MVP must not include:

- job scraping
- video calls
- complex social features
- community feeds
- employer/recruiter portal
- full CRM
- multi-device sync
- complex AI voice agents
- guaranteed job claims
- visa/legal/employment advice

## 11. MVP Scope

The MVP must include:

1. onboarding
2. authentication
3. goal setup
4. home dashboard
5. daily missions
6. interview practice
7. text-based AI feedback
8. CV paste analysis
9. application tracker
10. local progress persistence
11. profile/settings screen

## 12. Product Architecture

### Required App Sections

```txt
Onboarding
Authentication
Goal Setup
Home Dashboard
Learn / Career Categories
AI Coach / Interview Practice
CV Coach
Application Tracker
Profile
```

### Recommended Route Structure

```txt
app/
  (auth)/
    sign-up.tsx
    sign-in.tsx
  (onboarding)/
    onboarding.tsx
    target-role.tsx
    experience-level.tsx
  (tabs)/
    home.tsx
    learn.tsx
    coach.tsx
    applications.tsx
    profile.tsx
  interview/
    index.tsx
    behavioral.tsx
    lesson-intro.tsx
    question.tsx
    voice.tsx
  cv/
    index.tsx
    results.tsx
  applications/
    new.tsx
    [id].tsx
```

## Required Tools and Official Documentation

The project should use the following tools/docs where relevant:

| Tool / Docs | Use |
|---|---|
| `https://docs.expo.dev` | Expo, Expo Router, EAS Build, app configuration, iOS production builds |
| `https://app.coderabbit.ai` | AI code review and GitHub pull request review workflow |
| `https://posthog.com/docs` | Analytics, event capture, user identification, funnels |
| `https://clerk.com/docs` | Authentication, email verification, protected routes, user sessions |
| `https://zustand.docs.pmnd.rs` | Zustand state stores and persistence |
| `https://www.nativewind.dev` | NativeWind setup and styling |
| `https://docs.visionagents.ai` | Vision Agents implementation when realtime AI coach is added |
| `https://getstream.io` | Stream audio/video infrastructure when realtime calling is added |
| `https://ai.google.dev/gemini-api/docs` | Gemini API and AI/realtime model integration |

Implementation must follow official documentation and the installed package versions.

## 13. User Journey

### First-Time User Flow

1. User opens app.
2. User sees onboarding.
3. User taps Get Started.
4. User creates account.
5. User verifies email.
6. User selects target role.
7. User selects experience level.
8. User lands on Home Dashboard.
9. User completes first daily mission.
10. User receives XP and progress feedback.

### Returning User Flow

1. User opens app.
2. User lands on Home Dashboard.
3. User sees today’s mission.
4. User practises an interview question or improves CV.
5. User updates application tracker.
6. User sees progress and streak update.

## 14. Core Screens and Requirements

### 14.1 Onboarding Screen

Reference file:

```txt
prompt_material/02_onboarding.png
```

Requirements:

- show CareerFox AI brand
- show mascot
- explain career coaching value
- include pagination dots
- primary CTA: Get Started
- navigate to Sign Up

### 14.2 Sign Up Screen

Reference file:

```txt
prompt_material/03_sign_up.png
```

Requirements:

- email input
- password input
- social auth buttons
- clear errors
- loading state
- link to Sign In

### 14.3 Sign In Screen

Reference file:

```txt
prompt_material/04_sign_in.png
```

Requirements:

- email input
- password input
- social auth buttons
- clear errors
- loading state
- link to Sign Up

### 14.4 Email Verification Screen / Modal

Reference file:

```txt
prompt_material/05_email_verification.png
```

Requirements:

- 6-digit OTP
- number keyboard
- resend code action
- auto-submit when six digits entered
- clear error and loading states

### 14.5 Target Role Setup

Reference file:

```txt
prompt_material/06_target_role_setup.png
```

Requirements:

- search target roles
- show popular roles
- allow role selection
- save selected role
- continue to experience level

### 14.6 Experience Level Setup

Reference file:

```txt
prompt_material/07_experience_level_setup.png
```

Requirements:

- show experience level cards
- allow single selection
- persist selection
- mark setup as complete
- navigate to Home

### 14.7 Home Dashboard

Reference files:

```txt
prompt_material/08_home_dashboard.png
prompt_material/09_progress_dashboard.png
prompt_material/10_achievements.png
```

Requirements:

- greeting
- selected target role
- streak
- XP
- readiness score
- daily mission
- today’s plan
- next action
- achievements summary

### 14.8 Learn / Career Categories

Reference file:

```txt
prompt_material/11_learning_categories.png
```

Requirements:

- show categories for interview, CV, skills, and job search
- show progress per category
- navigate to relevant feature screens

### 14.9 Interview Practice

Reference files:

```txt
prompt_material/12_interview_practice.png
prompt_material/13_behavioural_questions.png
prompt_material/14_lesson_intro.png
```

Requirements:

- show interview modules
- show behavioural questions
- show lesson intro
- allow user to start question
- capture answer
- provide feedback after submission

### 14.10 Voice Answer / AI Coach

Reference file:

```txt
prompt_material/15_voice_answer.png
```

Requirements:

- show AI coach screen
- show question
- show recording/listening state
- provide text fallback
- show feedback when answer submitted
- no real video call in MVP

### 14.11 CV Coach

Requirements:

- allow user to paste CV text
- select/confirm target role
- send for AI analysis through backend
- show score
- show weak bullet points
- show improved bullet suggestions
- show keyword gaps
- show next actions

### 14.12 Application Tracker

Requirements:

- add application
- edit application
- delete application with confirmation
- track status
- track next action
- store locally in MVP

### 14.13 Profile

Requirements:

- show user details
- show selected role
- show XP/streak
- show settings
- logout
- show subscription placeholder only if payments are not implemented

## 15. Functional Requirements

### Authentication

- Clerk must handle authentication.
- User must be redirected based on auth/setup state.
- Secrets must not be exposed in the app.

### State Management

Persist using Zustand + AsyncStorage:

- selected target role
- selected experience level
- setup status
- XP
- streak
- completed missions
- applications
- interview progress
- achievements

### AI Feedback

AI calls must use backend/API routes only.

Required endpoints:

```txt
/api/interview-feedback
/api/cv-feedback
/api/generate-practice-question
```

AI must return structured JSON.

AI must not guarantee employment outcomes.

### Analytics

Track privacy-safe events only.

Do not track:

- full CV text
- full interview answers
- passwords
- private notes

### Payments

Subscription/paywall can be added after MVP.

The app must not show fake premium access or fake active subscriptions.

## 16. Non-Functional Requirements

### Performance

- app should open quickly
- screens should avoid unnecessary re-renders
- local data should load fast
- large CV input should not freeze UI

### Accessibility

- large touch targets
- readable text
- high contrast
- clear errors
- no colour-only status indicators
- keyboard-safe forms

### Security

- no frontend API secrets
- no sensitive console logs
- no persistent CV storage unless user explicitly saves
- environment variables handled correctly

### Reliability

- graceful loading states
- graceful offline states for local features
- clear AI error messages
- no broken navigation paths

## 17. Data Model

### Target Role

```ts
type TargetRole = {
  id: string;
  title: string;
  category: "tech" | "product" | "data" | "design" | "business" | "marketing";
  description: string;
  popularKeywords: string[];
};
```

### Career Mission

```ts
type CareerMission = {
  id: string;
  title: string;
  description: string;
  category: "interview" | "cv" | "applications" | "skills";
  xp: number;
  completed: boolean;
};
```

### Interview Question

```ts
type InterviewQuestion = {
  id: string;
  roleId: string;
  category: "behavioral" | "technical" | "case" | "hr";
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  guidance: string[];
  expectedStructure: "STAR" | "XYZ" | "freeform";
};
```

### Job Application

```ts
type JobApplication = {
  id: string;
  company: string;
  roleTitle: string;
  jobLink?: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  deadline?: string;
  notes?: string;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 18. MVP Milestones

### Milestone 1 — Foundation

- Expo project setup
- NativeWind setup
- design system
- routing
- reusable components

### Milestone 2 — Onboarding and Auth

- onboarding
- sign up
- sign in
- email verification
- Clerk integration

### Milestone 3 — Personalisation

- target role setup
- experience level setup
- Zustand persistence

### Milestone 4 — Core Dashboard

- bottom tabs
- home dashboard
- daily missions
- XP/streak

### Milestone 5 — Core Career Features

- interview practice
- CV coach
- application tracker

### Milestone 6 — AI Feedback

- backend AI endpoints
- interview feedback
- CV feedback

### Milestone 7 — Production Polish

- analytics
- paywall placeholder or real subscription
- App Store assets
- privacy policy
- QA/testing

## 19. App Store Readiness

Before submission, ensure:

- app icon exists
- splash screen exists
- privacy policy exists
- terms of service exists
- support email exists
- subscription terms exist if payments are enabled
- screenshots match real app functionality
- onboarding does not claim unavailable features
- no copied third-party branding
- no fake social login buttons if not configured

## 20. Risks and Mitigations

### Risk: App feels like a generic ChatGPT wrapper

Mitigation:

- use structured missions
- use role setup
- use progress tracking
- use category-based flows
- keep AI inside guided workflows

### Risk: Users do not return daily

Mitigation:

- daily missions
- streaks
- clear next actions
- short practice sessions
- achievements

### Risk: AI feedback is too generic

Mitigation:

- require role, level, question, and answer context
- return structured feedback
- use STAR/XYZ criteria
- ask AI for specific examples

### Risk: Privacy concerns

Mitigation:

- explain when CV text is sent
- do not persist sensitive text by default
- do not log CV or answer content
- provide clear privacy policy

## 21. Acceptance Criteria

The MVP is complete when:

- a new user can sign up and verify email
- a user can select target role and experience level
- a user can land on Home and see personalised progress
- a user can complete a daily mission
- a user can practise an interview question
- a user can receive AI feedback through backend
- a user can paste CV and receive analysis
- a user can add and update a job application
- app state persists after closing and reopening
- navigation works without dead ends
- no secrets are exposed in the frontend
- UI matches the provided screen references closely

## 22. Relationship to AGENTS.md and Prompts

Use this PRD to define **what the product is**.

Use `AGENTS.md` to define **how the AI coding agent must behave**.

Use the numbered prompt files to define **what to implement step by step**.

Recommended order:

```txt
PRD.md
AGENTS.md
01-nativewind.md
02-design-theme.md
03-onboarding-ui.md
...
20-production-readiness.md
```
