## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/00_brand_and_colors.png`
- `prompt_material/01_typography.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the full CareerFox AI design system from this Figma source:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

Use the Figma design as the visual source of truth.

Create a production-ready design system for the app.

## Required tokens

Create or update:

```txt
constants/colors.ts
constants/theme.ts
constants/images.ts
global.css
```

## Brand

App name: CareerFox AI  
Mascot: friendly professional fox career coach  
Style: playful, premium, supportive, career-focused

## Colours

Use these design tokens unless the Figma file gives a more exact value:

```ts
primary: "#6C4EF5"
deepPurple: "#5B38F6"
blue: "#4D8BFF"
success: "#21C16B"
warning: "#FFC800"
energy: "#FF8A00"
error: "#FF4D4F"
accent: "#FF5DA8"
textPrimary: "#0D132B"
textSecondary: "#6B7280"
border: "#E5E7EB"
surface: "#F6F7FB"
background: "#FFFFFF"
```

## Typography

Use Poppins if available. If not installed, use the project’s existing font setup and create a clear font-loading task.

Type scale:

- H1: 32px, Bold
- H2: 24px, SemiBold
- H3: 20px, SemiBold
- H4: 16px, Medium
- Body Large: 16px, Regular
- Body: 14px, Regular
- Caption: 12px, Regular

## Reusable utilities

Add global utilities for:

- screen container
- card
- primary button
- secondary button
- gradient surfaces
- status badges
- progress bars
- pill tabs
- bottom tab item
- input fields

## Rules

- Use NativeWind classes by default.
- Use StyleSheet only where NativeWind cannot support the React Native prop.
- Do not hardcode random colours inside screens.
- Extract reusable design tokens.
- Keep the UI consistent with the Figma design.
