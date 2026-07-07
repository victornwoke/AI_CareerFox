## Visual Reference Files

Use these exact files from the `prompt_material/` folder:

- `prompt_material/15_voice_answer.png`

The AI coding agent must open and compare against these files before implementation. The Figma link is useful for extra context, but these PNG files are the required screen references.

Read AGENTS.md first and follow it strictly.

Implement the Voice Answer / AI Interview Coach screen from the Figma design:

<https://www.figma.com/make/NURw8HrKJTKdj2HV7DtffN/Mobile-App-Interface-Design?t=HwV0Gi3ZDNDmbpwy-1>

## Route

```txt
app/interview/voice.tsx
```

## Required UI

- top back button
- title: `AI Interview Coach`
- status: `Recording...`, `Listening...`, or `Ready`
- main coach/mascot visual panel
- question bubble
- waveform placeholder
- controls:
  - Mute
  - Camera placeholder
  - End
  - Notes
- feedback summary area after answer

## MVP

- no real video call
- no real camera
- use voice UI as a local practice screen
- allow text fallback if speech is unavailable
- keep UI production-ready

## Later integration hooks

Prepare clean function placeholders for:

- startRecording()
- stopRecording()
- submitAnswerForFeedback()
- endSession()

Do not expose AI secrets.

## Rules

- Keep the screen accessible.
- Include loading, recording, submitted, feedback, and error states.
