import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { interviewQuestions } from "@/data/interviewQuestions";
import { targetRoles } from "@/data/roles";
import {
  trackInterviewAnswerSubmitted,
  trackInterviewFeedbackViewed,
  trackInterviewPracticeStarted,
} from "@/lib/analytics";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";

type SessionPhase =
  | "ready"
  | "recording"
  | "listening"
  | "submitted"
  | "feedback";

type ControlButtonProps = {
  accessibilityLabel: string;
  icon: SymbolIconName;
  isDanger?: boolean;
  isSelected?: boolean;
  label: string;
  onPress: () => void;
};

const darkBackground = "#2B2769";
const questionSurface = "#49457E";
const waveformBars = [
  16, 20, 23, 18, 25, 21, 27, 22, 19, 26, 22, 28, 24, 20, 25, 18, 22, 27, 23,
  25, 18, 22, 26, 21,
];

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function ControlButton({
  accessibilityLabel,
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
      onPress={onPress}
      style={{
        backgroundColor,
        borderCurve: "continuous",
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTrackedPracticeStartRef = useRef(false);
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
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
  const setAnswerDraft = useInterviewStore((state) => state.setAnswerDraft);
  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRoleId,
  );
  const roleQuestions = useMemo(
    () =>
      interviewQuestions.filter((question) =>
        selectedRole ? question.roleId === selectedRole.id : true,
      ),
    [selectedRole],
  );
  const activeQuestion =
    roleQuestions.find((question) => question.id === activeQuestionId) ??
    roleQuestions.find((question) => question.category === "behavioral") ??
    roleQuestions[0] ??
    null;
  const questionId = activeQuestion?.id ?? "voice-practice-fallback";
  const [phase, setPhase] = useState<SessionPhase>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState<string | null>(null);
  const answerText = answerDraftsByQuestionId[questionId] ?? "";
  const isRecording = phase === "recording";
  const isSubmitting = phase === "listening" || phase === "submitted";
  const statusLabel =
    phase === "recording"
      ? "Recording..."
      : isSubmitting
        ? "Listening..."
        : "Ready";
  const instruction =
    phase === "recording"
      ? "Tap to stop recording"
      : isSubmitting
        ? "Preparing feedback"
        : phase === "feedback"
          ? "Feedback ready"
          : "Tap to start recording";

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRecording]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/interview");
  };

  const submitAnswerForFeedback = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
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

    const submittedAnswerLength = answerText.trim().length;
    const readinessScore = submittedAnswerLength > 0 ? 78 : 64;

    trackInterviewAnswerSubmitted({
      answerLength: submittedAnswerLength,
      durationSeconds: elapsedSeconds,
      mode: "voice",
      questionCategory: activeQuestion?.category ?? null,
      questionId,
      readinessScore,
      roleId: selectedTargetRoleId,
      skipped: false,
    });

    setPhase("submitted");

    feedbackTimerRef.current = setTimeout(() => {
      const trimmedAnswer = answerText.trim();
      const summary =
        trimmedAnswer.length > 0
          ? "Strong start. Add one measurable result, then close with what you learned so the answer feels complete."
          : "Nice practice run. For the next take, capture the situation, your specific action, and one clear result.";

      setFeedbackSummary(summary);
      setAnswerDraft(questionId, trimmedAnswer);
      markQuestionCompleted(questionId);
      addPracticeHistoryItem({
        feedbackSummary: summary,
        id: `voice-${questionId}-${Date.now()}`,
        mode: "voice",
        practicedAt: new Date().toISOString(),
        questionId,
        readinessScore,
      });
      trackInterviewFeedbackViewed({
        questionCategory: activeQuestion?.category ?? null,
        questionId,
        readinessScore,
        roleId: selectedTargetRoleId,
      });
      setPhase("feedback");
    }, 900);
  };

  const startRecording = () => {
    if (phase === "recording" || isSubmitting) {
      return;
    }

    setElapsedSeconds(0);
    setFeedbackSummary(null);
    trackInterviewPracticeStarted({
      mode: "voice",
      questionCategory: activeQuestion?.category ?? null,
      questionId,
      roleId: selectedTargetRoleId,
    });
    hasTrackedPracticeStartRef.current = true;
    setPhase("recording");
  };

  const stopRecording = () => {
    if (phase !== "recording") {
      return;
    }

    setPhase("listening");
    submitAnswerForFeedback();
  };

  const endSession = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setPhase("ready");
    setElapsedSeconds(0);
    setFeedbackSummary(null);
    hasTrackedPracticeStartRef.current = false;
    router.back();
  };

  const handlePrimaryRecordingPress = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  };

  const updateAnswerText = (value: string) => {
    setAnswerDraft(questionId, value);
  };

  return (
    <View className="flex-1 bg-[#201D50]">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          backgroundColor: darkBackground,
          minHeight: height,
          paddingBottom: Math.max(insets.bottom + 16, 28),
          paddingHorizontal: 18,
          paddingTop: Math.max(insets.top - 8, 20),
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

        <View className="flex-1 items-center justify-center py-6">
          <View className="h-[132px] w-[132px] items-center justify-end rounded-full bg-white/12">
            <Image
              accessibilityLabel="CareerFox AI interview coach"
              contentFit="contain"
              source={images.careerFoxCoach}
              style={{ height: 110, width: 98 }}
            />
          </View>

          <View
            accessibilityLabel="Voice waveform"
            className="mt-7 h-[30px] w-full flex-row items-center justify-center gap-1.5"
          >
            {waveformBars.map((barHeight, index) => (
              <View
                className="w-[7px] rounded-full"
                key={`${barHeight}-${index}`}
                style={{
                  backgroundColor:
                    isRecording && index % 3 === elapsedSeconds % 3
                      ? "#FFFFFF"
                      : "#716BA0",
                  height: isRecording ? barHeight : 21,
                  opacity: isRecording ? 0.82 : 0.58,
                }}
              />
            ))}
          </View>

          <Text
            accessibilityLabel={`Elapsed recording time ${formatElapsedTime(elapsedSeconds)}`}
            className="mt-7 text-[48px] font-bold leading-[54px] text-white"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatElapsedTime(elapsedSeconds)}
          </Text>
          <Text className="mt-1 text-[17px] font-bold leading-[22px] text-[#AAA5D0]">
            {instruction}
          </Text>

          <View className="mt-6 w-full flex-row items-center justify-center gap-4">
            <Pressable
              accessibilityLabel={isMuted ? "Unmute microphone" : "Mute microphone"}
              accessibilityRole="button"
              className="h-[66px] w-[66px] items-center justify-center rounded-full bg-white/10"
              onPress={() => setIsMuted((currentValue) => !currentValue)}
            >
              <SymbolIcon
                accessibilityLabel={isMuted ? "Muted" : "Mute"}
                color="#D6D1FF"
                name={isMuted ? "mic.slash.fill" : "speaker.wave.2.fill"}
                size={28}
              />
            </Pressable>

            <Pressable
              accessibilityLabel={
                isRecording ? "Stop voice answer recording" : "Start voice answer recording"
              }
              accessibilityRole="button"
              className="h-[106px] w-[106px] items-center justify-center rounded-full"
              disabled={isSubmitting}
              onPress={handlePrimaryRecordingPress}
              style={{
                backgroundColor: isSubmitting ? "#5C5597" : "#7B5DFF",
                boxShadow: "0 18px 36px rgba(26, 18, 92, 0.28)",
                opacity: isSubmitting ? 0.78 : 1,
              }}
            >
              <SymbolIcon
                accessibilityLabel="Microphone"
                color={colors.white}
                name={isRecording ? "mic.slash.fill" : "mic.fill"}
                size={44}
              />
            </Pressable>

            <Pressable
              accessibilityLabel="Open typed notes"
              accessibilityRole="button"
              className="h-[66px] w-[66px] items-center justify-center rounded-full bg-white/10"
              onPress={() => setShowNotes((currentValue) => !currentValue)}
            >
              <SymbolIcon
                accessibilityLabel="Notes"
                color="#D6D1FF"
                name="note.text"
                size={27}
              />
            </Pressable>
          </View>
        </View>

        <View className="gap-3 rounded-[24px] bg-[#201D50] p-3">
          <View className="flex-row gap-3">
            <ControlButton
              accessibilityLabel={isMuted ? "Unmute" : "Mute"}
              icon={isMuted ? "mic.slash.fill" : "speaker.wave.2.fill"}
              isSelected={isMuted}
              label="Mute"
              onPress={() => setIsMuted((currentValue) => !currentValue)}
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

          {showNotes ? (
            <View
              className="rounded-[24px] bg-white/8 p-4"
              style={{ borderCurve: "continuous" }}
            >
              <Text className="text-[15px] font-bold leading-[20px] text-white">
                Text fallback
              </Text>
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
                disabled={isSubmitting}
                onPress={submitAnswerForFeedback}
                style={{ opacity: isSubmitting ? 0.72 : 1 }}
              >
                <LinearGradient
                  colors={["#8B6DFF", "#6C4EF5"]}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={{ alignItems: "center", paddingVertical: 15 }}
                >
                  <Text className="text-[17px] font-bold leading-[22px] text-white">
                    Submit for feedback
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {feedbackSummary ? (
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
              <Text className="mt-3 text-[14px] font-semibold leading-[21px] text-[#6B7280]">
                Keep the answer role-aware, specific, and honest. CareerFox can
                coach the structure, but it cannot guarantee interview outcomes.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
