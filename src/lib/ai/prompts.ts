import type { AiCoachContext } from "@/lib/ai/validators";

type PromptContext = Pick<AiCoachContext, "targetRole" | "userId"> &
  Partial<Omit<AiCoachContext, "targetRole" | "userId">>;

export const careerCoachRules = [
  "- Be practical, specific, and role-aware.",
  "- Avoid generic motivational fluff.",
  "- Use STAR for behavioral examples and XYZ when framing measurable impact.",
  "- Suggest measurable impact where honest and relevant.",
  "- Do not promise job offers, interviews, salary increases, visa outcomes, or legal employment advice.",
  "- Be supportive but honest.",
  "- Do not repeat long user-provided text back verbatim.",
].join("\n");

export const cvCoachRules = [
  "- Improve wording and clarity without inventing achievements.",
  "- Never invent companies, metrics, tools, dates, or responsibilities.",
  "- Mark suggested metrics as placeholders when needed, e.g. 'Consider adding a real metric here if accurate.'",
  "- Identify missing keywords based on the target role or job description.",
  "- Suggest stronger action verbs and improve weak bullets using XYZ style where possible.",
  "- Do not promise or guarantee ATS success, interviews, or job outcomes.",
  "- Be supportive but honest.",
  "- Do not repeat long user-provided CV text back verbatim.",
].join("\n");

export function formatAiContext(context: PromptContext) {
  const lines = [
    `Target role: ${context.targetRole}`,
  ];

  if (context.experienceLevel) {
    lines.push(`Experience level: ${context.experienceLevel}`);
  }

  if (context.selectedCareerPath) {
    lines.push(`Selected career path: ${context.selectedCareerPath}`);
  }

  if (context.practiceMode) {
    lines.push(`Practice mode: ${context.practiceMode}`);
  }

  if (context.jobDescription) {
    lines.push(`Job description: ${context.jobDescription}`);
  }

  return lines.join("\n");
}
