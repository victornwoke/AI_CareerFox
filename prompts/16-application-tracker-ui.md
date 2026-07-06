## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/08_home_dashboard.png`
- `prompt_material/09_progress_dashboard.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the CareerFox AI Application Tracker feature using the Figma design language:

https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1

## Routes

```txt
app/(tabs)/applications.tsx
app/applications/new.tsx
app/applications/[id].tsx
```

## Application list screen

Show:

- header: `Applications`
- summary cards:
  - Saved
  - Applied
  - Interview
  - Offer
- list of applications
- empty state
- floating or primary button: `Add application`

## New application screen

Fields:

- company
- role title
- job link
- status
- deadline
- notes
- next action

## Detail screen

Show:

- company
- role
- status timeline
- notes
- next action
- update status button

## Data

Use Zustand + AsyncStorage.

## Rules

- No backend database in MVP.
- Keep editing and deletion safe with confirmation.
- Do not scrape job sites.
