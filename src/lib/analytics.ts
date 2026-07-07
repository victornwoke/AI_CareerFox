import { posthog } from "@/config/posthog";

type AnalyticsValue = boolean | number | string | null;
type AnalyticsProperties = Record<string, AnalyticsValue | undefined>;
type AuthMethod = "apple" | "email" | "google" | "linkedin";

type IdentifyUserInput = {
  experienceLevelId?: string | null;
  signupDate?: string | null;
  targetRoleId?: string | null;
  userId: string;
};

type TargetRoleSelectedInput = {
  roleCategory?: string | null;
  roleId: string;
  roleTitle?: string | null;
};

type ExperienceLevelSelectedInput = {
  experienceLevelId: string;
  experienceLevelLabel?: string | null;
};

type MissionAnalyticsInput = {
  missionCategory?: string | null;
  missionId: string;
  missionXp?: number;
  source?: string;
};

type InterviewPracticeStartedInput = {
  expectedStructure?: string | null;
  lessonId?: string | null;
  lessonNumber?: number | null;
  mode?: "text" | "voice";
  questionCategory?: string | null;
  questionId?: string | null;
  roleId?: string | null;
};

type InterviewAnswerSubmittedInput = {
  answerLength: number;
  durationSeconds?: number | null;
  lessonId?: string | null;
  lessonNumber?: number | null;
  mode?: "text" | "voice";
  questionCategory?: string | null;
  questionId?: string | null;
  readinessScore?: number | null;
  roleId?: string | null;
  skipped?: boolean;
};

type CvAnalysisInput = {
  cvInputType: "file" | "text";
  cvTextLength?: number;
  hasJobDescription: boolean;
  targetRoleId?: string | null;
};

type CvAnalysisCompletedInput = {
  atsKeywordGapCount?: number;
  hasJobDescription: boolean;
  score: number;
  targetRoleId?: string | null;
};

type ApplicationAddedInput = {
  applicationId: string;
  hasDeadline: boolean;
  hasJobUrl: boolean;
  source?: string | null;
  status: string;
};

type SubscriptionInput = {
  planId?: string | null;
  source?: string | null;
};

const cleanProperties = (properties: AnalyticsProperties) => {
  const cleanedProperties: Record<string, AnalyticsValue> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) {
      cleanedProperties[key] = value;
    }
  }

  return cleanedProperties;
};

export function captureAnalyticsEvent(
  eventName: string,
  properties: AnalyticsProperties = {},
) {
  posthog.capture(eventName, cleanProperties(properties));
}

export function identifyAnalyticsUser({
  experienceLevelId,
  signupDate,
  targetRoleId,
  userId,
}: IdentifyUserInput) {
  posthog.identify(userId, {
    $set: cleanProperties({
      experience_level: experienceLevelId ?? null,
      target_role: targetRoleId ?? null,
    }),
    $set_once: cleanProperties({
      signup_date: signupDate ?? null,
    }),
  });
}

export function trackOnboardingStarted() {
  captureAnalyticsEvent("onboarding_started");
}

export function trackSignupStarted(method: AuthMethod) {
  captureAnalyticsEvent("signup_started", { method });
}

export function trackSignupCompleted(method: AuthMethod) {
  captureAnalyticsEvent("signup_completed", { method });
}

export function trackTargetRoleSelected({
  roleCategory,
  roleId,
  roleTitle,
}: TargetRoleSelectedInput) {
  captureAnalyticsEvent("target_role_selected", {
    role_category: roleCategory ?? null,
    role_id: roleId,
    role_title: roleTitle ?? null,
  });
}

export function trackExperienceLevelSelected({
  experienceLevelId,
  experienceLevelLabel,
}: ExperienceLevelSelectedInput) {
  captureAnalyticsEvent("experience_level_selected", {
    experience_level: experienceLevelId,
    experience_level_label: experienceLevelLabel ?? null,
  });
}

export function trackDailyMissionStarted({
  missionCategory,
  missionId,
  missionXp,
  source,
}: MissionAnalyticsInput) {
  captureAnalyticsEvent("daily_mission_started", {
    mission_category: missionCategory ?? null,
    mission_id: missionId,
    mission_xp: missionXp,
    source,
  });
}

export function trackDailyMissionCompleted({
  missionCategory,
  missionId,
  missionXp,
  source,
}: MissionAnalyticsInput) {
  captureAnalyticsEvent("daily_mission_completed", {
    mission_category: missionCategory ?? null,
    mission_id: missionId,
    mission_xp: missionXp,
    source,
  });
}

export function trackInterviewPracticeStarted({
  expectedStructure,
  lessonId,
  lessonNumber,
  mode = "text",
  questionCategory,
  questionId,
  roleId,
}: InterviewPracticeStartedInput) {
  captureAnalyticsEvent("interview_practice_started", {
    expected_structure: expectedStructure ?? null,
    lesson_id: lessonId ?? null,
    lesson_number: lessonNumber ?? null,
    mode,
    question_category: questionCategory ?? null,
    question_id: questionId ?? null,
    role_id: roleId ?? null,
  });
}

export function trackInterviewAnswerSubmitted({
  answerLength,
  durationSeconds,
  lessonId,
  lessonNumber,
  mode = "text",
  questionCategory,
  questionId,
  readinessScore,
  roleId,
  skipped = false,
}: InterviewAnswerSubmittedInput) {
  captureAnalyticsEvent("interview_answer_submitted", {
    answer_length: answerLength,
    duration_seconds: durationSeconds ?? null,
    lesson_id: lessonId ?? null,
    lesson_number: lessonNumber ?? null,
    mode,
    question_category: questionCategory ?? null,
    question_id: questionId ?? null,
    readiness_score: readinessScore ?? null,
    role_id: roleId ?? null,
    skipped,
  });
}

export function trackInterviewFeedbackViewed({
  questionCategory,
  questionId,
  readinessScore,
  roleId,
}: Pick<
  InterviewAnswerSubmittedInput,
  "questionCategory" | "questionId" | "readinessScore" | "roleId"
>) {
  captureAnalyticsEvent("interview_feedback_viewed", {
    question_category: questionCategory ?? null,
    question_id: questionId ?? null,
    readiness_score: readinessScore ?? null,
    role_id: roleId ?? null,
  });
}

export function trackCvAnalysisStarted({
  cvInputType,
  cvTextLength,
  hasJobDescription,
  targetRoleId,
}: CvAnalysisInput) {
  captureAnalyticsEvent("cv_analysis_started", {
    cv_input_type: cvInputType,
    cv_text_length: cvTextLength,
    has_job_description: hasJobDescription,
    target_role_id: targetRoleId ?? null,
  });
}

export function trackCvAnalysisCompleted({
  atsKeywordGapCount,
  hasJobDescription,
  score,
  targetRoleId,
}: CvAnalysisCompletedInput) {
  captureAnalyticsEvent("cv_analysis_completed", {
    ats_keyword_gap_count: atsKeywordGapCount,
    has_job_description: hasJobDescription,
    score,
    target_role_id: targetRoleId ?? null,
  });
}

export function trackApplicationAdded({
  applicationId,
  hasDeadline,
  hasJobUrl,
  source,
  status,
}: ApplicationAddedInput) {
  captureAnalyticsEvent("application_added", {
    application_id: applicationId,
    has_deadline: hasDeadline,
    has_job_url: hasJobUrl,
    source: source ?? "not_specified",
    status,
  });
}

export function trackSubscriptionPaywallViewed({
  planId,
  source,
}: SubscriptionInput = {}) {
  captureAnalyticsEvent("subscription_paywall_viewed", {
    plan_id: planId ?? null,
    source: source ?? null,
  });
}

export function trackSubscriptionStarted({
  planId,
  source,
}: SubscriptionInput = {}) {
  captureAnalyticsEvent("subscription_started", {
    plan_id: planId ?? null,
    source: source ?? null,
  });
}
