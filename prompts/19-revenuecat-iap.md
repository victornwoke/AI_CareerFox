## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/08_home_dashboard.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Prepare the subscription/paywall structure for CareerFox AI.

Do not show a real paywall until in-app purchases are correctly configured.

## Subscription positioning

Free plan:

- limited daily interview practice
- limited CV analysis
- local application tracker
- basic missions

Pro plan:

- unlimited mock interviews
- full CV analysis
- role-specific interview packs
- detailed feedback history
- advanced progress insights

## Routes/components

Create placeholders only if payment is not configured:

```txt
app/paywall.tsx
components/paywall/PlanCard.tsx
components/paywall/FeatureComparison.tsx
lib/purchases.ts
```

## Rules

- Use RevenueCat or Apple IAP only when configured.
- Do not fake active subscriptions.
- Do not claim premium features work if they do not.
- Add clear restore purchases button when payments are implemented.
- Follow App Store rules for subscriptions.
