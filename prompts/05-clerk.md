## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/03_sign_up.png`
- `prompt_material/04_sign_in.png`
- `prompt_material/05_email_verification.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Replace the mocked authentication flow with real Clerk authentication while keeping the existing CareerFox AI UI exactly the same.

## Requirements

Use Clerk for:

- email sign up
- email sign in
- email verification code
- sign out
- auth guards
- social auth placeholders where configured

## Setup

1. Install required packages using Expo-compatible install commands if missing:
   - `@clerk/expo`
   - `expo-secure-store`

2. Add:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

3. Wrap the app in `ClerkProvider` in the root layout.
4. Use `tokenCache` from `@clerk/expo/token-cache`.

## Routes

Auth route group:

```txt
app/(auth)/_layout.tsx
app/(auth)/sign-up.tsx
app/(auth)/sign-in.tsx
```

Protected app route group:

```txt
app/(tabs)/_layout.tsx
```

## Behaviour

- If user is signed out, route them to onboarding/sign-in.
- If user signs up successfully, verify email, then continue to goal setup.
- If user is signed in but has not completed goal setup, route to target role setup.
- If user is signed in and setup is complete, route to Home.
- Keep all existing UI unchanged.

## Security

- Never expose Clerk secret keys.
- Do not log auth tokens.
- Show friendly auth error messages.
