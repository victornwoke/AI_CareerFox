## Visual Reference Files

No dedicated screen reference is required for this prompt.

Still follow:

- `AGENTS.md`
- the existing app design system
- the Figma source link if available

Read AGENTS.md first and follow it strictly.

Set up global state with Zustand and AsyncStorage persistence.

## Files

Create:

```txt
store/useCareerStore.ts
store/useApplicationStore.ts
store/useInterviewStore.ts
store/useProgressStore.ts
```

## Career store

Persist:

- selectedTargetRole
- selectedExperienceLevel
- setupCompleted
- preferredPracticeMode

## Progress store

Persist:

- xp
- streak
- coins
- readinessScore
- completedMissionIds
- unlockedAchievementIds

## Interview store

Persist:

- completedQuestionIds
- activeQuestionId
- practiceHistory
- lastFeedbackSummary

## Application store

Persist:

- applications
- activeApplicationId

## Rules

- Use `@react-native-async-storage/async-storage`.
- Use Zustand middleware persistence.
- Keep types strict.
- Add actions for update, reset, and clear testing state.
- Do not persist sensitive CV text unless the user explicitly saves it.
