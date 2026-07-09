import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { experienceLevels } from "@/data/experienceLevels";
import { interviewQuestions } from "@/data/interviewQuestions";
import { targetRoles } from "@/data/roles";
import {
    trackInterviewAnswerSubmitted,
    trackInterviewFeedbackViewed,
    trackInterviewPracticeStarted,
} from "@/lib/analytics";
import { postInterviewFeedback } from "@/lib/api";
import type { InterviewFeedbackOutput } from "@/lib/server/aiFeedback";
import {
    fetchStreamSessionBootstrap,
    generateCallId,
    startAiCoachSession,
    stopAiCoachSession,
    STREAM_CALL_TYPE,
    type StreamConnectionState,
} from "@/lib/stream/streamUtils";
import { useCareerStore } from "@/store/useCareerStore";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";
import type { InterviewCategory } from "@/types/career";
import {
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
    type Call,
} from "@stream-io/video-react-native-sdk";

type SessionPhase = "ready" | "recording" | "listening" | "feedback";

type CoachMode = "practice" | "mock_interview";

type FeedbackState = "idle" | "loading" | "success" | "error";

type ControlButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: SymbolIconName;
  isDanger?: boolean;
  isSelected?: boolean;
  label: string;
  onPress: () => void;
};

const darkBackground = "#2B2769";
const questionSurface = "#49457E";
const voiceFallbackMessage =
  "Voice coach is unavailable right now. You can still practise by typing your answer.";
const streamUnavailableMessage =
  "Live voice is unavailable right now. You can still type your answer and get feedback.";
const waveformBars = [
  16, 20, 23, 18, 25, 21, 27, 22, 19, 26, 22, 28, 24, 20, 25, 18, 22, 27, 23,
  25, 18, 22, 26, 21,
];

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatCoachModeLabel(mode: CoachMode) {
  return mode === "mock_interview" ? "Mock Interview" : "Practice";
}

function formatCategoryLabel(category: InterviewCategory["id"]) {
  if (category === "hr") {
    return "HR";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function ControlButton({
  accessibilityLabel,
  disabled = false,
  icon,
  isDanger = false,
  isSelected = false,
  label,
  onPress,
}: ControlButtonProps) {
  const backgroundColor = isDanger
    ? "#FF5A6E"
    : isSelected
      ? "#6F5BFF"
      : "#464078";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-[64px] flex-1 items-center justify-center rounded-[20px]"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor,
        borderCurve: "continuous",
        opacity: disabled ? 0.58 : 1,
      }}
    >
      <SymbolIcon
        accessibilityLabel={label}
        color={colors.white}
        name={icon}
        size={22}
      />
      <Text
        adjustsFontSizeToFit
        className="mt-1 text-center text-[11px] font-bold leading-[14px] text-white"
        minimumFontScale={0.78}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function VoicePracticeScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isCompactLayout = width < 370 || height < 760;
  const isTablet = width >= 768;
  const contentMaxWidth = isTablet ? 760 : undefined;
  const coachRingSize = isCompactLayout ? 116 : 132;
  const coachImageWidth = isCompactLayout ? 86 : 98;
  const coachImageHeight = isCompactLayout ? 98 : 110;
  const sideControlSize = isCompactLayout ? 58 : 66;
  const primaryControlSize = isCompactLayout ? 92 : 106;
  const waveformBarWidth = isCompactLayout ? 6 : 7;
  const primaryMicIconSize = isCompactLayout ? 38 : 44;
  const sideControlIconSize = isCompactLayout ? 24 : 28;
  const notesIconSize = isCompactLayout ? 24 : 27;
  const elapsedTextSize = isCompactLayout ? 40 : 48;
  const elapsedLineHeight = isCompactLayout ? 46 : 54;
  const hasTrackedPracticeStartRef = useRef(false);
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const selectedExperienceLevelId = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const activeQuestionId = useInterviewStore((state) => state.activeQuestionId);
  const answerDraftsByQuestionId = useInterviewStore(
    (state) => state.answerDraftsByQuestionId,
  );
  const addPracticeHistoryItem = useInterviewStore(
    (state) => state.addPracticeHistoryItem,
  );
  const markQuestionCompleted = useInterviewStore(
    (state) => state.markQuestionCompleted,
  );
  const setActiveQuestionId = useInterviewStore(
    (state) => state.setActiveQuestionId,
  );
  const setAnswerDraft = useInterviewStore((state) => state.setAnswerDraft);
  const setReadinessScore = useProgressStore(
    (state) => state.setReadinessScore,
  );
  const latestJobDescription = useCvAnalysisStore(
    (state) => state.request?.jobDescription,
  );
  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRoleId,
  );
  const selectedExperienceLevel = experienceLevels.find(
    (level) => level.id === selectedExperienceLevelId,
  );

  const seededActiveQuestion =
    interviewQuestions.find((question) => question.id === activeQuestionId) ??
    null;
  const selectedQuestionCategory =
    seededActiveQuestion?.category ?? "behavioral";

  const roleQuestions = useMemo(
    () =>
      interviewQuestions.filter(
        (question) =>
          (selectedRole ? question.roleId === selectedRole.id : true) &&
          question.category === selectedQuestionCategory,
      ),
    [selectedRole, selectedQuestionCategory],
  );
  const activeQuestion =
    roleQuestions.find((question) => question.id === activeQuestionId) ??
    roleQuestions[0] ??
    null;
  const questionId = activeQuestion?.id ?? "voice-practice-fallback";
  const roleTitle = selectedRole?.title ?? "Career";
  const experienceLabel = selectedExperienceLevel?.label ?? "Not set";
  const voiceCoachAvailable =
    process.env.EXPO_PUBLIC_ENABLE_VOICE_COACH === "true";

  const [phase, setPhase] = useState<SessionPhase>("ready");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  // Push-to-talk: start muted so the AI coach greets first.
  const [isMuted, setIsMuted] = useState(true);
  const [coachMode, setCoachMode] = useState<CoachMode>("practice");
  const [showNotes, setShowNotes] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<string | null>(null);
  const [interviewFeedback, setInterviewFeedback] =
    useState<InterviewFeedbackOutput | null>(null);
  const [streamConnectionState, setStreamConnectionState] =
    useState<StreamConnectionState>("idle");
  const streamClientRef = useRef<StreamVideoClient | null>(null);
  const streamCallRef = useRef<Call | null>(null);
  const aiCoachSessionIdRef = useRef<string | null>(null);
  // Provider state so StreamVideo/StreamCall re-render when set.
  const [activeStreamClient, setActiveStreamClient] =
    useState<StreamVideoClient | null>(null);
  const [activeStreamCall, setActiveStreamCall] = useState<Call | null>(null);
  const answerText = answerDraftsByQuestionId[questionId] ?? "";
  const isRecording = phase === "recording";
  const isSubmitting = phase === "listening" || feedbackState === "loading";
  const coachConnectionStatus = useMemo(() => {
    switch (streamConnectionState) {
      case "creating":
        return "Creating";
      case "connecting":
        return "Connecting";
      case "connected":
        return "Connected";
      case "failed":
        return "Failed";
      case "ended":
        return "Ended";
      default:
        return voiceCoachAvailable ? "Ready" : "Unavailable";
    }
  }, [streamConnectionState, voiceCoachAvailable]);

  const statusLabel =
    phase === "recording"
      ? "Recording..."
      : isSubmitting
        ? "Loading..."
        : isSessionActive && streamConnectionState === "connected"
          ? isMuted
            ? "Coach Talking"
            : "Your Turn"
          : isSessionActive
            ? "Session Live"
            : "Ready";

  const instruction = !voiceCoachAvailable
    ? "Text fallback available"
    : isSessionActive && streamConnectionState === "connected"
      ? isMuted
        ? "Coach is speaking \u2014 tap mic when ready to answer"
        : "You\u2019re speaking \u2014 tap mic when finished"
      : phase === "recording"
        ? "Tap to stop recording"
        : isSubmitting
          ? "Scoring your answer"
          : phase === "feedback"
            ? "Feedback ready"
            : "Tap Start Session to begin";

  const canSubmitTypedAnswer =
    !isSubmitting &&
    streamConnectionState !== "creating" &&
    streamConnectionState !== "connecting";

  useEffect(() => {
    const isLive = isSessionActive && streamConnectionState === "connected";
    if (!isRecording && !isLive) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRecording, isSessionActive, streamConnectionState]);

  useEffect(() => {
    return () => {
      const callRef = streamCallRef.current;
      const clientRef = streamClientRef.current;
      const aiCoachSessionId = aiCoachSessionIdRef.current;

      streamCallRef.current = null;
      streamClientRef.current = null;
      aiCoachSessionIdRef.current = null;

      if (callRef && callRef.state.callingState !== CallingState.LEFT) {
        callRef.leave().catch((error) => {
          console.warn("Error leaving stream call on unmount:", error);
        });
      }
      if (clientRef) {
        clientRef.disconnectUser().catch((error) => {
          console.warn("Error disconnecting Stream client on unmount:", error);
        });
      }

      if (aiCoachSessionId) {
        stopAiCoachSession({ sessionId: aiCoachSessionId }).catch((error) => {
          console.warn("Error stopping AI coach session on unmount:", error);
        });
      }
    };
  }, []);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/interview");
  };

  const moveToNextQuestion = () => {
    if (!activeQuestion || roleQuestions.length === 0) {
      return;
    }

    const currentQuestionIndex = roleQuestions.findIndex(
      (question) => question.id === activeQuestion.id,
    );

    const nextQuestion =
      roleQuestions[currentQuestionIndex + 1] ?? roleQuestions[0] ?? null;

    if (!nextQuestion) {
      return;
    }

    setActiveQuestionId(nextQuestion.id);
    setFeedbackState("idle");
    setFeedbackError(null);
    setFeedbackSummary(null);
    setInterviewFeedback(null);
    setElapsedSeconds(0);
    setPhase("ready");
    setShowNotes(true);
  };

  const submitAnswerForFeedback = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedAnswer = answerText.trim();

    if (!trimmedAnswer) {
      setFeedbackState("error");
      setFeedbackError("Type an answer before submitting for feedback.");
      return;
    }

    if (!activeQuestion) {
      setFeedbackState("error");
      setFeedbackError(
        "CareerFox could not find the active question. Please try next question.",
      );
      return;
    }

    if (!userId) {
      setFeedbackState("error");
      setFeedbackError("Please sign in to get AI interview feedback.");
      return;
    }

    if (!hasTrackedPracticeStartRef.current) {
      trackInterviewPracticeStarted({
        mode: "voice",
        questionCategory: activeQuestion?.category ?? null,
        questionId,
        roleId: selectedTargetRoleId,
      });
      hasTrackedPracticeStartRef.current = true;
    }

    const submittedAnswerLength = trimmedAnswer.length;

    trackInterviewAnswerSubmitted({
      answerLength: submittedAnswerLength,
      durationSeconds: elapsedSeconds,
      mode: "voice",
      questionCategory: activeQuestion?.category ?? null,
      questionId,
      roleId: selectedTargetRoleId,
      skipped: false,
    });

    setPhase("listening");
    setFeedbackState("loading");
    setFeedbackError(null);

    try {
      const feedback = await postInterviewFeedback({
        answer: trimmedAnswer,
        category: activeQuestion.category,
        experienceLevel: experienceLabel,
        question: activeQuestion.question,
        targetRole: roleTitle,
        userId,
      });
      const shortSummary = feedback.summary.trim().slice(0, 220);

      setInterviewFeedback(feedback);
      setFeedbackSummary(shortSummary.length > 0 ? shortSummary : null);
      setReadinessScore(feedback.score);
      setAnswerDraft(questionId, trimmedAnswer);
      markQuestionCompleted(questionId);
      addPracticeHistoryItem({
        category: activeQuestion.category,
        categoryScores: feedback.categories,
        feedbackSummary: shortSummary,
        id: `voice-${questionId}-${Date.now()}`,
        mode: "voice",
        practicedAt: new Date().toISOString(),
        questionId,
        readinessScore: feedback.score,
      });
      trackInterviewFeedbackViewed({
        questionCategory: activeQuestion.category,
        questionId,
        readinessScore: feedback.score,
        roleId: selectedTargetRoleId,
      });

      setFeedbackState("success");
      setPhase("feedback");
    } catch (caughtError) {
      setFeedbackState("error");
      setPhase("ready");

      const baseErrorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "CareerFox could not score your answer right now.";

      setFeedbackError(
        voiceCoachAvailable ? baseErrorMessage : voiceFallbackMessage,
      );
    }
  };

  const startRecording = () => {
    if (phase === "recording" || isSubmitting || !isSessionActive) {
      return;
    }

    if (!voiceCoachAvailable) {
      setShowNotes(true);
      setFeedbackState("error");
      setFeedbackError(voiceFallbackMessage);
      return;
    }

    setElapsedSeconds(0);
    setPhase("recording");
  };

  const stopRecording = () => {
    if (phase !== "recording") {
      return;
    }

    void submitAnswerForFeedback();
  };

  const retryCurrentQuestion = () => {
    setFeedbackState("idle");
    setFeedbackError(null);
    setFeedbackSummary(null);
    setInterviewFeedback(null);
    setElapsedSeconds(0);
    setPhase("ready");
    setShowNotes(true);
  };

  const handlePrimaryRecordingPress = () => {
    if (isSessionActive && streamConnectionState === "connected") {
      void toggleMute();
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  };

  const updateAnswerText = (value: string) => {
    setAnswerDraft(questionId, value);
  };

  const cleanupStreamSession = async () => {
    const callRef = streamCallRef.current;
    const clientRef = streamClientRef.current;

    streamCallRef.current = null;
    streamClientRef.current = null;
    setActiveStreamClient(null);
    setActiveStreamCall(null);

    if (callRef && callRef.state.callingState !== CallingState.LEFT) {
      try {
        await callRef.leave();
      } catch (error) {
        console.warn("Error leaving Stream call:", error);
      }
    }

    if (clientRef) {
      try {
        await clientRef.disconnectUser();
      } catch (error) {
        console.warn("Error disconnecting Stream client:", error);
      }
    }
  };

  const cleanupAiCoachSession = async () => {
    const aiCoachSessionId = aiCoachSessionIdRef.current;
    aiCoachSessionIdRef.current = null;

    if (!aiCoachSessionId) {
      return;
    }

    await stopAiCoachSession({ sessionId: aiCoachSessionId });
  };

  const toggleMute = async () => {
    const callRef = streamCallRef.current;

    if (!callRef || streamConnectionState !== "connected") {
      setSessionError(streamUnavailableMessage);
      setShowNotes(true);
      return;
    }

    try {
      await callRef.microphone.toggle();
      setIsMuted((currentValue) => !currentValue);
    } catch (error) {
      console.warn("Failed to toggle Stream microphone:", error);
      setSessionError(
        "CareerFox could not change the microphone state right now.",
      );
    }
  };

  const startSession = async () => {
    if (
      streamConnectionState === "creating" ||
      streamConnectionState === "connecting" ||
      streamConnectionState === "connected"
    ) {
      return;
    }

    if (!userId) {
      setStreamConnectionState("failed");
      setSessionError("Please sign in to start a live voice session.");
      setShowNotes(true);
      return;
    }

    setFeedbackState("idle");
    setFeedbackError(null);
    setFeedbackSummary(null);
    setInterviewFeedback(null);
    setElapsedSeconds(0);
    setIsMuted(true);
    setSessionError(null);
    setStreamConnectionState("creating");
    aiCoachSessionIdRef.current = null;

    try {
      const bootstrap = await fetchStreamSessionBootstrap(userId);

      if (!bootstrap) {
        setStreamConnectionState("failed");
        setSessionError(streamUnavailableMessage);
        setShowNotes(true);
        return;
      }

      setStreamConnectionState("connecting");

      const callId = generateCallId(userId, questionId);

      const aiCoachSession = await startAiCoachSession({
        callId,
        callType: STREAM_CALL_TYPE,
        context: {
          currentQuestion: activeQuestion?.question,
          experienceLevel: experienceLabel,
          jobDescription: latestJobDescription ?? null,
          practiceMode: coachMode,
          questionCategory: activeQuestion?.category,
          selectedCareerPath: selectedRole?.title ?? null,
          targetRole: roleTitle,
          userId,
        },
      });

      if (!aiCoachSession) {
        setStreamConnectionState("failed");
        setSessionError(streamUnavailableMessage);
        setShowNotes(true);
        return;
      }

      aiCoachSessionIdRef.current = aiCoachSession.sessionId;

      const client = new StreamVideoClient({
        apiKey: bootstrap.apiKey,
        token: bootstrap.token,
        user: { id: userId },
      });

      const callRef = client.call(STREAM_CALL_TYPE, callId);

      streamClientRef.current = client;
      streamCallRef.current = callRef;

      await callRef.join({
        create: true,
        data: {
          custom: {
            experienceLevel: experienceLabel,
            jobDescription: latestJobDescription ?? null,
            mode: coachMode,
            questionCategory: activeQuestion?.category,
            questionId,
            roleId: selectedTargetRoleId,
            roleTitle,
          },
        },
      });

      // Push-to-talk: disable mic so coach speaks first.
      try {
        await callRef.microphone.disable();
        setIsMuted(true);
      } catch (micError) {
        console.warn(
          "Could not disable microphone on session start:",
          micError,
        );
      }

      setIsSessionActive(true);
      setStreamConnectionState("connected");
      setShowNotes(false);
      setActiveStreamClient(client);
      setActiveStreamCall(callRef);

      if (!hasTrackedPracticeStartRef.current) {
        trackInterviewPracticeStarted({
          mode: "voice",
          questionCategory: activeQuestion?.category ?? null,
          questionId,
          roleId: selectedTargetRoleId,
        });
        hasTrackedPracticeStartRef.current = true;
      }
    } catch (error) {
      console.error("Stream session failed:", error);
      setIsSessionActive(false);
      setStreamConnectionState("failed");
      setSessionError(
        error instanceof Error ? error.message : streamUnavailableMessage,
      );
      setShowNotes(true);
      await cleanupStreamSession();
      await cleanupAiCoachSession();
    }
  };

  const endSession = async () => {
    await cleanupStreamSession();
    await cleanupAiCoachSession();
    setIsSessionActive(false);
    setPhase("ready");
    setFeedbackState("idle");
    setFeedbackError(null);
    setFeedbackSummary(null);
    setInterviewFeedback(null);
    setElapsedSeconds(0);
    setStreamConnectionState("ended");
    setSessionError(null);
    setShowNotes(false);
    hasTrackedPracticeStartRef.current = false;
  };

  const screenContent = (
    <View className="flex-1 bg-[#201D50]">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          alignSelf: "center",
          backgroundColor: darkBackground,
          maxWidth: contentMaxWidth,
          minHeight: height,
          paddingBottom: Math.max(insets.bottom + 16, 28),
          paddingHorizontal: 18,
          paddingTop: Math.max(insets.top - 8, 20),
          width: "100%",
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[48px] flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Back to interview practice"
            accessibilityRole="button"
            className="h-[44px] w-[44px] items-center justify-center rounded-full bg-white/10"
            onPress={goBack}
          >
            <SymbolIcon
              accessibilityLabel="Back"
              color={colors.white}
              name="chevron.left"
              size={25}
            />
          </Pressable>

          <Text
            adjustsFontSizeToFit
            className="flex-1 text-center text-[20px] font-bold leading-[25px] text-white"
            minimumFontScale={0.72}
            numberOfLines={1}
          >
            AI Interview Coach
          </Text>

          <View className="min-w-[78px] rounded-full bg-white/14 px-3 py-2">
            <Text
              adjustsFontSizeToFit
              className="text-center text-[13px] font-bold uppercase leading-[17px] text-[#D6D1FF]"
              minimumFontScale={0.72}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View
          className="mt-4 rounded-[24px] bg-white/10 p-4"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[12px] font-bold uppercase leading-[16px] text-[#C7C2EA]">
            Session details
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <View className="rounded-full bg-white/14 px-3 py-2">
              <Text className="text-[12px] font-bold leading-[16px] text-white">
                Role: {roleTitle}
              </Text>
            </View>
            <View className="rounded-full bg-white/14 px-3 py-2">
              <Text className="text-[12px] font-bold leading-[16px] text-white">
                Level: {experienceLabel}
              </Text>
            </View>
            <View className="rounded-full bg-white/14 px-3 py-2">
              <Text className="text-[12px] font-bold leading-[16px] text-white">
                Coach: {coachConnectionStatus}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <View className="rounded-full bg-[#4A467E] px-3 py-[9px]">
              <Text className="text-[12px] font-bold leading-[16px] text-[#B8AEFF]">
                {formatCategoryLabel(
                  activeQuestion?.category ?? selectedQuestionCategory,
                )}
              </Text>
            </View>
            {(["practice", "mock_interview"] as const).map((mode) => {
              const isSelected = coachMode === mode;

              return (
                <Pressable
                  accessibilityLabel={`Set mode to ${formatCoachModeLabel(mode)}`}
                  accessibilityRole="button"
                  className="h-[34px] items-center justify-center rounded-full px-4"
                  key={mode}
                  onPress={() => setCoachMode(mode)}
                  style={{
                    backgroundColor: isSelected ? "#7A68FF" : "#4A467E",
                  }}
                >
                  <Text
                    adjustsFontSizeToFit
                    className="text-[12px] font-bold leading-[16px] text-white"
                    minimumFontScale={0.78}
                    numberOfLines={1}
                  >
                    {formatCoachModeLabel(mode)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          className="mt-5 rounded-[24px] px-5 py-5"
          style={{
            backgroundColor: questionSurface,
            borderCurve: "continuous",
          }}
        >
          <Text className="text-[13px] font-bold uppercase leading-[17px] text-[#C7C2EA]">
            Question
          </Text>
          <Text
            adjustsFontSizeToFit
            className="mt-3 text-[21px] font-semibold leading-[30px] text-white"
            minimumFontScale={0.82}
            numberOfLines={4}
          >
            {activeQuestion?.question ??
              "Tell me about a time you had to lead a team through a challenging project under a tight deadline."}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            accessibilityLabel="Start coach session"
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-[18px] bg-[#7A68FF]"
            disabled={
              streamConnectionState === "creating" ||
              streamConnectionState === "connecting" ||
              streamConnectionState === "connected"
            }
            onPress={() => {
              void startSession();
            }}
            style={{
              opacity:
                streamConnectionState === "creating" ||
                streamConnectionState === "connecting" ||
                streamConnectionState === "connected"
                  ? 0.65
                  : 1,
            }}
          >
            <Text className="text-[16px] font-bold leading-[20px] text-white">
              Start Session
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="End coach session"
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-[18px] bg-[#FF5A6E]"
            disabled={!isSessionActive}
            onPress={() => {
              void endSession();
            }}
            style={{ opacity: !isSessionActive ? 0.65 : 1 }}
          >
            <Text className="text-[16px] font-bold leading-[20px] text-white">
              End Session
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center py-6">
          <View
            className="items-center justify-end rounded-full bg-white/12"
            style={{ height: coachRingSize, width: coachRingSize }}
          >
            <Image
              accessibilityLabel="CareerFox AI interview coach"
              contentFit="contain"
              source={images.careerFoxCoach}
              style={{ height: coachImageHeight, width: coachImageWidth }}
            />
          </View>

          <View
            accessibilityLabel="Voice waveform"
            className="mt-7 h-[30px] w-full flex-row items-center justify-center gap-1.5"
          >
            {waveformBars.map((barHeight, index) => {
              const isLiveAndUnmuted =
                isSessionActive &&
                streamConnectionState === "connected" &&
                !isMuted;
              const isLiveAndMuted =
                isSessionActive &&
                streamConnectionState === "connected" &&
                isMuted;
              const waveformActive = isRecording || isLiveAndUnmuted;
              const waveformCoach = isLiveAndMuted;

              return (
                <View
                  className="rounded-full"
                  key={`${barHeight}-${index}`}
                  style={{
                    backgroundColor: waveformActive
                      ? index % 3 === elapsedSeconds % 3
                        ? "#30D158"
                        : "#FFFFFF"
                      : waveformCoach
                        ? index % 5 === elapsedSeconds % 4
                          ? "#C7C2EA"
                          : "#5B5698"
                        : "#716BA0",
                    height: waveformActive
                      ? barHeight
                      : waveformCoach
                        ? Math.round(barHeight * 0.6)
                        : 21,
                    opacity: waveformActive
                      ? 0.88
                      : waveformCoach
                        ? 0.65
                        : 0.45,
                    width: waveformBarWidth,
                  }}
                />
              );
            })}
          </View>

          <Text
            accessibilityLabel={`Elapsed recording time ${formatElapsedTime(elapsedSeconds)}`}
            className="mt-7 text-[48px] font-bold leading-[54px] text-white"
            style={{
              fontSize: elapsedTextSize,
              fontVariant: ["tabular-nums"],
              lineHeight: elapsedLineHeight,
            }}
          >
            {formatElapsedTime(elapsedSeconds)}
          </Text>
          <Text className="mt-1 text-[17px] font-bold leading-[22px] text-[#AAA5D0]">
            {instruction}
          </Text>

          <View className="mt-6 w-full flex-row items-center justify-center gap-4">
            <Pressable
              accessibilityLabel={
                isMuted
                  ? "Tap to speak your answer"
                  : "Tap when finished speaking"
              }
              accessibilityRole="button"
              className="items-center justify-center rounded-full bg-white/10"
              disabled={streamConnectionState !== "connected"}
              onPress={() => {
                void toggleMute();
              }}
              style={{
                height: sideControlSize,
                opacity: streamConnectionState !== "connected" ? 0.62 : 1,
                width: sideControlSize,
              }}
            >
              <SymbolIcon
                accessibilityLabel={isMuted ? "Muted" : "Unmuted"}
                color="#D6D1FF"
                name={isMuted ? "mic.slash.fill" : "mic.fill"}
                size={sideControlIconSize}
              />
            </Pressable>

            <Pressable
              accessibilityLabel={
                isSessionActive && streamConnectionState === "connected"
                  ? isMuted
                    ? "Tap to speak your answer"
                    : "Tap when finished speaking"
                  : isRecording
                    ? "Stop voice answer recording"
                    : "Start voice answer recording"
              }
              accessibilityRole="button"
              className="items-center justify-center rounded-full"
              disabled={isSubmitting || streamConnectionState !== "connected"}
              onPress={handlePrimaryRecordingPress}
              style={{
                backgroundColor: isSubmitting
                  ? "#5C5597"
                  : isSessionActive &&
                      streamConnectionState === "connected" &&
                      !isMuted
                    ? "#30D158"
                    : "#7B5DFF",
                boxShadow:
                  isSessionActive &&
                  streamConnectionState === "connected" &&
                  !isMuted
                    ? "0 18px 36px rgba(48, 209, 88, 0.38)"
                    : "0 18px 36px rgba(26, 18, 92, 0.28)",
                height: primaryControlSize,
                opacity:
                  isSubmitting ||
                  !isSessionActive ||
                  streamConnectionState !== "connected"
                    ? 0.62
                    : 1,
                width: primaryControlSize,
              }}
            >
              <SymbolIcon
                accessibilityLabel="Microphone"
                color={colors.white}
                name={
                  isSessionActive && streamConnectionState === "connected"
                    ? isMuted
                      ? "mic.slash.fill"
                      : "mic.fill"
                    : isRecording
                      ? "mic.slash.fill"
                      : "mic.fill"
                }
                size={primaryMicIconSize}
              />
            </Pressable>

            <Pressable
              accessibilityLabel="Open typed notes"
              accessibilityRole="button"
              className="items-center justify-center rounded-full bg-white/10"
              onPress={() => setShowNotes((currentValue) => !currentValue)}
              style={{ height: sideControlSize, width: sideControlSize }}
            >
              <SymbolIcon
                accessibilityLabel="Notes"
                color="#D6D1FF"
                name="note.text"
                size={notesIconSize}
              />
            </Pressable>
          </View>

          {sessionError ? (
            <Text className="mt-3 text-[12px] font-semibold leading-[17px] text-[#D6D1FF]">
              {sessionError}
            </Text>
          ) : null}
        </View>

        <View className="gap-3 rounded-[24px] bg-[#201D50] p-3">
          <View className="flex-row gap-3">
            <ControlButton
              accessibilityLabel={
                isMuted ? "Tap to speak" : "Tap when done speaking"
              }
              disabled={streamConnectionState !== "connected"}
              icon={isMuted ? "mic.slash.fill" : "mic.fill"}
              isSelected={!isMuted && streamConnectionState === "connected"}
              label={isMuted ? "Speak" : "Done"}
              onPress={() => {
                void toggleMute();
              }}
            />
            <ControlButton
              accessibilityLabel="End voice practice session"
              icon="phone.down.fill"
              isDanger
              label="End"
              onPress={endSession}
            />
            <ControlButton
              accessibilityLabel="Show answer notes"
              icon="note.text"
              isSelected={showNotes}
              label="Notes"
              onPress={() => setShowNotes((currentValue) => !currentValue)}
            />
          </View>

          {showNotes || streamConnectionState !== "connected" ? (
            <View
              className="rounded-[24px] bg-white/8 p-4"
              style={{ borderCurve: "continuous" }}
            >
              <Text className="text-[15px] font-bold leading-[20px] text-white">
                Text fallback
              </Text>
              {streamConnectionState !== "connected" ? (
                <Text className="mt-2 text-[13px] font-semibold leading-[18px] text-[#E5E2FF]">
                  {streamUnavailableMessage}
                </Text>
              ) : null}
              <TextInput
                accessibilityLabel="Type your answer"
                className="mt-3 min-h-[108px] rounded-[20px] bg-white px-4 py-4 text-[17px] font-semibold leading-[24px] text-text-primary"
                multiline
                onChangeText={updateAnswerText}
                placeholder="Type your answer if speech is unavailable..."
                placeholderTextColor="#8F92A8"
                textAlignVertical="top"
                value={answerText}
              />
              <Pressable
                accessibilityLabel="Submit typed answer for feedback"
                accessibilityRole="button"
                className="mt-3 overflow-hidden rounded-[20px]"
                disabled={!canSubmitTypedAnswer}
                onPress={() => {
                  void submitAnswerForFeedback();
                }}
                style={{ opacity: canSubmitTypedAnswer ? 1 : 0.72 }}
              >
                <LinearGradient
                  colors={["#8B6DFF", "#6C4EF5"]}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    paddingVertical: 15,
                  }}
                >
                  {feedbackState === "loading" ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : null}
                  <Text className="text-[17px] font-bold leading-[22px] text-white">
                    {feedbackState === "loading"
                      ? " Scoring answer..."
                      : "Submit for feedback"}
                  </Text>
                </LinearGradient>
              </Pressable>
              {streamConnectionState === "failed" ? (
                <Text className="mt-2 text-[12px] font-semibold leading-[16px] text-[#D6D1FF]">
                  Live voice is unavailable, but text practice still works.
                </Text>
              ) : null}
            </View>
          ) : null}

          {feedbackState === "loading" ? (
            <View
              className="rounded-[24px] bg-white/12 p-4"
              style={{ borderCurve: "continuous" }}
            >
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-[15px] font-bold leading-[20px] text-white">
                  Loading feedback...
                </Text>
              </View>
            </View>
          ) : null}

          {feedbackState === "error" && feedbackError ? (
            <View
              className="rounded-[24px] bg-[#422455] p-4"
              style={{ borderCurve: "continuous" }}
            >
              <Text className="text-[15px] font-bold uppercase leading-[20px] text-[#FFC4CC]">
                Error
              </Text>
              <Text className="mt-2 text-[15px] font-semibold leading-[22px] text-white">
                {feedbackError}
              </Text>
            </View>
          ) : null}

          {feedbackState === "success" &&
          interviewFeedback &&
          feedbackSummary ? (
            <View
              className="rounded-[24px] bg-white p-5"
              style={{ borderCurve: "continuous" }}
            >
              <Text className="text-[15px] font-bold uppercase leading-[20px] text-primary">
                Feedback summary
              </Text>
              <Text className="mt-3 text-[19px] font-bold leading-[27px] text-text-primary">
                {feedbackSummary}
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-[#F0EAFF] px-3 py-1.5">
                  <Text className="text-[13px] font-bold leading-[17px] text-primary">
                    Overall {interviewFeedback.score}
                  </Text>
                </View>
                <View className="rounded-full bg-[#F0EAFF] px-3 py-1.5">
                  <Text className="text-[13px] font-bold leading-[17px] text-primary">
                    Structure {interviewFeedback.categories.structure}
                  </Text>
                </View>
                <View className="rounded-full bg-[#F0EAFF] px-3 py-1.5">
                  <Text className="text-[13px] font-bold leading-[17px] text-primary">
                    Relevance {interviewFeedback.categories.relevance}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-[14px] font-semibold leading-[21px] text-[#6B7280]">
                Keep the answer role-aware, specific, and honest. CareerFox can
                coach the structure, but it cannot guarantee interview outcomes.
              </Text>

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  accessibilityLabel="Retry current question"
                  accessibilityRole="button"
                  className="h-[48px] flex-1 items-center justify-center rounded-[16px] border border-primary"
                  onPress={retryCurrentQuestion}
                >
                  <Text className="text-[15px] font-bold leading-[20px] text-primary">
                    Retry
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Go to next question"
                  accessibilityRole="button"
                  className="h-[48px] flex-1 items-center justify-center rounded-[16px] bg-primary"
                  onPress={moveToNextQuestion}
                >
                  <Text className="text-[15px] font-bold leading-[20px] text-white">
                    Next Question
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Pressable
            accessibilityLabel="Back to interview practice"
            accessibilityRole="button"
            className="h-[48px] items-center justify-center rounded-[16px] bg-white/10"
            onPress={goBack}
          >
            <Text className="text-[15px] font-bold leading-[20px] text-white">
              Back to Practice
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  // Wrap in Stream providers when a session is active so iOS audio is routed to speaker.
  if (activeStreamClient && activeStreamCall) {
    return (
      <StreamVideo client={activeStreamClient}>
        <StreamCall call={activeStreamCall}>{screenContent}</StreamCall>
      </StreamVideo>
    );
  }

  return screenContent;
}
