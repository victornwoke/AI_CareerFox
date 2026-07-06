## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/03_sign_up.png`
- `prompt_material/04_sign_in.png`
- `prompt_material/05_email_verification.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI authentication UI from the Figma design:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Routes

Create:

```txt
app/(auth)/sign-up.tsx
app/(auth)/sign-in.tsx
components/auth/VerificationModal.tsx
```

## Sign Up screen

Must include:

- back button
- title: `Create your account`
- subtitle: `Start your career journey today ✨`
- mascot image
- email input
- password input
- primary button: `Sign Up`
- divider: `or continue with`
- social buttons:
  - Continue with Google
  - Continue with Apple
  - Continue with LinkedIn
- footer link: `Already have an account? Log in`

## Sign In screen

Must include:

- title: `Welcome back`
- subtitle: `Let’s continue your journey 🚀`
- email input
- password input
- primary button: `Sign In`
- social buttons
- footer link: `Don’t have an account? Sign up`

## Verification modal

When the main button is pressed in mock mode:

- show modal: `Check your email`
- show message: `We sent a 6-digit code`
- show six OTP inputs
- use number keyboard
- keep modal above keyboard
- auto-submit on sixth digit
- navigate to goal setup after success

## UI Rules

- Preserve Figma layout and spacing.
- Use NativeWind by default.
- Use `KeyboardAvoidingView` correctly.
- Add loading and error states.
- No real Clerk logic yet; that comes in the next prompt.
