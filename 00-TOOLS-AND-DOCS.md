# CareerFox AI — Required Tools and Official Documentation

Use this file before implementing any feature that depends on a third-party tool, SDK, service, or framework.

## Primary rule

Before coding a feature, check the official documentation for the exact tool being used. Do not rely on outdated examples, blog snippets, or assumptions.

If the project already has an installed package version, inspect `package.json` first and use the documentation that matches the installed version.

## Required tools and docs

| Area | Tool / Docs | Purpose | When to use |
|---|---|---|---|
| Mobile framework | `https://docs.expo.dev` | Expo, Expo Router, EAS Build, app config, native modules, App Store build process | All Expo setup, routing, builds, app.json/app.config, native permissions |
| Code review | `https://app.coderabbit.ai` | AI code review, PR review, quality checks | When setting up GitHub PR review workflow |
| Product analytics | `https://posthog.com/docs` | Analytics, user identification, events, funnels, feature flags | After MVP core flows exist |
| Authentication | `https://clerk.com/docs` | Sign up, sign in, email verification, protected routes, user sessions | Auth implementation |
| State management | `https://zustand.docs.pmnd.rs` | Zustand stores, persistence middleware, AsyncStorage patterns | Global state and persistence |
| Styling | `https://www.nativewind.dev` | NativeWind setup, Tailwind config, global CSS, React Native styling support | Design system and UI implementation |
| AI voice/video agents | `https://docs.visionagents.ai` or current Vision Agents docs used by the installed SDK | AI agent lifecycle, realtime voice/video agent behaviour | Only after MVP when adding voice AI agent features |
| Realtime audio/video | `https://getstream.io` and Stream official docs | Stream calls, tokens, audio rooms, realtime communication | Only if adding realtime audio/video sessions |
| Gemini API | `https://ai.google.dev/gemini-api/docs` | Gemini API, realtime model behaviour, server-side AI integration | If Gemini is selected for AI responses or realtime voice |
| Apple app release | `https://developer.apple.com/app-store/review/guidelines/` | App Store rules, subscriptions, privacy, metadata | Before production submission |

## Implementation rules

1. Use official docs first.
2. Check installed package versions before writing setup code.
3. Do not install a new package without explaining why and asking for approval.
4. Do not expose API keys or secrets in the mobile app.
5. Server-side APIs must handle:
   - AI calls
   - Stream tokens
   - Gemini keys
   - any provider secret
6. If docs conflict with an old prompt, follow the current official docs and explain the difference.
7. If a tool is not needed for MVP, do not add it early.

## MVP tool usage

Use these in the MVP:

- Expo docs
- NativeWind docs
- Clerk docs
- Zustand docs
- Gemini API or selected AI API docs only when building AI feedback
- PostHog docs only after core flows work

Do not add these at MVP start unless explicitly requested:

- Vision Agents
- GetStream
- CodeRabbit
- RevenueCat/payment tooling
- advanced realtime voice/video

## Recommended agent instruction

Use this when prompting Claude, Codex, Cursor, Windsurf, or Continue:

```txt
Read 00-PRD.md first.
Read 00-TOOLS-AND-DOCS.md.
Read AGENTS.md and follow it strictly.

Before implementing this feature, inspect package.json and use the official docs listed in 00-TOOLS-AND-DOCS.md for the relevant tool.

If the installed version differs from examples in the prompt, follow the installed version and official documentation.

Do not expose secrets.
Do not change unrelated files.
Run lint/typecheck if available.
```
