import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";
import { experienceLevels } from "@/data/experienceLevels";
import { targetRoles } from "@/data/roles";
import {
    trackInterviewAnswerSubmitted,
    trackInterviewFeedbackViewed,
    trackInterviewPracticeStarted,
} from "@/lib/analytics";
import { postInterviewFeedback } from "@/lib/api";
import { getEstimatedMinutesForDifficulty } from "@/lib/interviewGeneratedQuestion";
import {
    type BehavioralLesson,
    getActiveBehavioralLesson,
    getBehavioralLessons,
    getNextBehavioralLesson,
} from "@/lib/interviewLessonFlow";
import type { InterviewFeedbackOutput } from "@/lib/server/aiFeedback";
import { useCareerStore } from "@/store/useCareerStore";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";

const behavioralHref = "/interview/behavioral" as Href;
const lessonIntroHref = "/interview/lesson-intro" as Href;
const voiceHref = "/interview/voice" as Href;
const aiFeedbackFallbackMessage =
  "AI feedback is unavailable right now. Please try again shortly.";

function getFrameworkSteps(expectedStructure: "STAR" | "XYZ" | "freeform") {
  if (expectedStructure === "XYZ") {
    return [
      { color: colors.primary, label: "Accomplished", letter: "X" },
      { color: colors.energy, label: "Measured by", letter: "Y" },
      { color: colors.success, label: "By doing", letter: "Z" },
    ];
  }

  if (expectedStructure === "freeform") {
    return [
      { color: colors.primary, label: "Context", letter: "C" },
      { color: colors.energy, label: "Approach", letter: "A" },
      { color: colors.success, label: "Outcome", letter: "O" },
    ];
  }

  return [
    { color: colors.primary, label: "Situation", letter: "S" },
    { color: colors.energy, label: "Task", letter: "T" },
    { color: colors.success, label: "Action", letter: "A" },
    { color: colors.blue, label: "Result", letter: "R" },
  ];
}

export default function InterviewQuestionScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const generatedPracticeQuestion = useInterviewStore(
    (state) => state.generatedPracticeQuestion,
  );
  const markQuestionCompleted = useInterviewStore(
    (state) => state.markQuestionCompleted,
  );
  const setActiveQuestionId = useInterviewStore(
    (state) => state.setActiveQuestionId,
  );
  const setAnswerDraft = useInterviewStore((state) => state.setAnswerDraft);
  const addPracticeHistoryItem = useInterviewStore(
    (state) => state.addPracticeHistoryItem,
  );
  const latestJobDescription = useCvAnalysisStore(
    (state) => state.request?.jobDescription,
  );
  const setReadinessScore = useProgressStore(
    (state) => state.setReadinessScore,
  );
  const [feedbackState, setFeedbackState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [interviewFeedback, setInterviewFeedback] =
    useState<InterviewFeedbackOutput | null>(null);
  const lessons = useMemo(() => {
    const baseLessons = getBehavioralLessons(selectedTargetRoleId);

    if (!generatedPracticeQuestion) {
      return baseLessons;
    }

    const generated = generatedPracticeQuestion.question;

    if (generated.category !== "behavioral") {
      return baseLessons;
    }

    const generatedLesson: BehavioralLesson = {
      category: "behavioral",
      difficulty: generated.difficulty,
      expectedStructure: generated.expectedStructure,
      guidance: generated.answerTips,
      id: generatedPracticeQuestion.id,
      lessonNumber: 1,
      question: generated.question,
      roleId: selectedTargetRoleId ?? "generated",
      roleTitle: selectedTargetRoleId
        ? (targetRoles.find((role) => role.id === selectedTargetRoleId)
            ?.title ?? "Career")
        : "Career",
      tags: [
        generated.expectedStructure,
        generated.difficulty,
        `${getEstimatedMinutesForDifficulty(generated.difficulty)} min`,
      ],
    };

    return [generatedLesson, ...baseLessons].map((entry, index) => ({
      ...entry,
      lessonNumber: index + 1,
    }));
  }, [generatedPracticeQuestion, selectedTargetRoleId]);
  const lesson = getActiveBehavioralLesson({
    activeQuestionId,
    completedQuestionIds,
    lessons,
  });
  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRoleId,
  );
  const selectedExperienceLevel = experienceLevels.find(
    (level) => level.id === selectedExperienceLevelId,
  );
  const roleTitle = selectedRole?.title ?? "Career";
  const experienceLabel = selectedExperienceLevel?.label;
  const frameworkSteps = lesson
    ? getFrameworkSteps(lesson.expectedStructure)
    : getFrameworkSteps("STAR");
  const frameworkTitle =
    lesson?.expectedStructure === "XYZ"
      ? "XYZ Framework"
      : lesson?.expectedStructure === "freeform"
        ? "Answer Framework"
        : "STAR Framework";
  const answer = lesson ? (answerDraftsByQuestionId[lesson.id] ?? "") : "";
  const progress =
    lesson && lessons.length > 0 ? lesson.lessonNumber / lessons.length : 0;
  const isSubmittingFeedback = feedbackState === "loading";

  const moveToNextLesson = () => {
    if (!lesson) {
      router.replace(behavioralHref);
      return;
    }

    const nextLesson = getNextBehavioralLesson({
      currentQuestionId: lesson.id,
      lessons,
    });

    if (nextLesson) {
      setActiveQuestionId(nextLesson.id);
      router.replace(lessonIntroHref);
      return;
    }

    setActiveQuestionId(null);
    router.replace(behavioralHref);
  };

  const continueToNextQuestion = () => {
    if (!lesson) {
      router.replace(behavioralHref);
      return;
    }

    markQuestionCompleted(lesson.id);
    moveToNextLesson();
  };

  const retryQuestion = () => {
    setFeedbackState("idle");
    setFeedbackError(null);
    setInterviewFeedback(null);
  };

  const submitAnswer = async () => {
    if (isSubmittingFeedback) {
      return;
    }

    if (!lesson) {
      router.replace(behavioralHref);
      return;
    }

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setFeedbackState("error");
      setFeedbackError("Type your answer before submitting for feedback.");
      return;
    }

    if (!userId || !selectedRole || !experienceLabel) {
      setFeedbackState("error");
      setFeedbackError(
        "Please finish role setup and sign in to get AI feedback.",
      );
      return;
    }

    trackInterviewPracticeStarted({
      expectedStructure: lesson.expectedStructure,
      lessonId: lesson.id,
      lessonNumber: lesson.lessonNumber,
      mode: "text",
      questionCategory: lesson.category,
      questionId: lesson.id,
      roleId: selectedTargetRoleId,
    });

    trackInterviewAnswerSubmitted({
      answerLength: trimmedAnswer.length,
      lessonId: lesson.id,
      lessonNumber: lesson.lessonNumber,
      mode: "text",
      questionCategory: lesson.category,
      questionId: lesson.id,
      roleId: selectedTargetRoleId,
      skipped: false,
    });

    setFeedbackState("loading");
    setFeedbackError(null);

    try {
      const feedback = await postInterviewFeedback({
        answer: trimmedAnswer,
        category: lesson.category,
        experienceLevel: experienceLabel,
        jobDescription: latestJobDescription,
        question: lesson.question,
        targetRole: roleTitle,
        userId,
      });
      const practicedAt = new Date().toISOString();

      setInterviewFeedback(feedback);
      setReadinessScore(feedback.score);
      addPracticeHistoryItem({
        category: lesson.category,
        categoryScores: feedback.categories,
        feedbackSummary: feedback.summary.slice(0, 220),
        id: `text-${lesson.id}-${practicedAt}`,
        mode: "text",
        practicedAt,
        questionId: lesson.id,
        readinessScore: feedback.score,
      });

      trackInterviewFeedbackViewed({
        questionCategory: lesson.category,
        questionId: lesson.id,
        readinessScore: feedback.score,
        roleId: selectedTargetRoleId,
      });

      setFeedbackState("success");
    } catch (caughtError) {
      const fallbackError =
        caughtError instanceof Error && caughtError.message.trim().length > 0
          ? caughtError.message
          : aiFeedbackFallbackMessage;

      setFeedbackState("error");
      setFeedbackError(fallbackError || aiFeedbackFallbackMessage);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(lessonIntroHref);
  };

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F2FF] px-6">
        <Text className="text-center text-[22px] font-bold leading-[28px] text-text-primary">
          No question found
        </Text>
        <Pressable
          accessibilityLabel="Back to behavioral questions"
          accessibilityRole="button"
          className="mt-5 rounded-full bg-primary px-6 py-4"
          onPress={() => router.replace(behavioralHref)}
        >
          <Text className="text-[16px] font-bold leading-[22px] text-white">
            Back to lessons
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View
        className="bg-white px-6 pb-4"
        style={{ paddingTop: Math.max(insets.top + 12, 32) }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityLabel="Back to lesson intro"
            accessibilityRole="button"
            className="h-[48px] w-[48px] items-center justify-center rounded-full bg-[#F3EEFF]"
            onPress={goBack}
          >
            <SymbolIcon
              accessibilityLabel="Back"
              color={colors.primary}
              name="chevron.left"
              size={24}
            />
          </Pressable>

          <View className="flex-1">
            <Text
              adjustsFontSizeToFit
              className="text-[22px] font-bold leading-[27px] text-text-primary"
              minimumFontScale={0.78}
              numberOfLines={1}
            >
              Behavioral Questions
            </Text>
            <Text className="text-[17px] font-semibold leading-[22px] text-[#8F92A8]">
              Question {lesson.lessonNumber} of {lessons.length}
            </Text>
          </View>

          <View className="h-10 flex-row items-center gap-1.5 rounded-full bg-[#EEE9FF] px-3">
            <SymbolIcon
              accessibilityLabel="Timer"
              color={colors.primary}
              name="clock"
              size={18}
            />
            <Text className="text-[17px] font-bold leading-[22px] text-primary">
              3:45
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          minHeight: height,
          paddingBottom: Math.max(insets.bottom, 10),
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white px-6 pb-5" style={{ paddingTop: 8 }}>
          <View className="mt-5 h-3 overflow-hidden rounded-full bg-[#E8DFFF]">
            <View
              className="h-3 rounded-full bg-primary"
              style={{ width: `${Math.max(progress * 100, 10)}%` }}
            />
          </View>
        </View>

        <View className="gap-4 px-6 pt-5">
          <View
            className="rounded-[28px] bg-white px-5 py-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(13, 19, 43, 0.06)",
            }}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-[#EEE9FF]">
                <SymbolIcon
                  accessibilityLabel="Behavioral"
                  color={colors.primary}
                  name="message.fill"
                  size={22}
                />
              </View>
              <Text className="text-[15px] font-bold uppercase leading-[20px] text-primary">
                Behavioral
              </Text>
            </View>

            <Text
              adjustsFontSizeToFit
              className="mt-5 text-[22px] font-bold leading-[31px] text-text-primary"
              minimumFontScale={0.78}
              numberOfLines={4}
            >
              {lesson.question}
            </Text>

            <View className="mt-5 flex-row flex-wrap gap-2">
              {lesson.tags.map((tag) => (
                <View
                  className="rounded-full bg-[#F5F1FF] px-3 py-1.5"
                  key={tag}
                >
                  <Text className="text-[14px] font-bold leading-[18px] text-primary">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            className="rounded-[28px] bg-[#E9E2FF] px-5 py-5"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-[21px] font-bold leading-[26px] text-[#3C1C8C]">
              {frameworkTitle}
            </Text>
            <View className="mt-4 flex-row gap-3">
              {frameworkSteps.map((step) => (
                <View
                  className="h-[78px] flex-1 items-center justify-center rounded-[20px] bg-white"
                  key={step.letter}
                >
                  <Text
                    className="text-[27px] font-bold leading-[32px]"
                    style={{ color: step.color }}
                  >
                    {step.letter}
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    className="mt-1 text-center text-[12px] font-semibold leading-[16px] text-[#8F92A8]"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            className="rounded-[28px] bg-white px-5 py-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(13, 19, 43, 0.06)",
            }}
          >
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-[21px] font-bold leading-[26px] text-text-primary">
                Your Answer
              </Text>
              <Pressable
                accessibilityLabel="Skip question"
                accessibilityRole="button"
                className="rounded-full bg-[#F5F1FF] px-4 py-2"
                disabled={isSubmittingFeedback}
                onPress={() => {
                  if (lesson) {
                    trackInterviewAnswerSubmitted({
                      answerLength: 0,
                      lessonId: lesson.id,
                      lessonNumber: lesson.lessonNumber,
                      mode: "text",
                      questionCategory: lesson.category,
                      questionId: lesson.id,
                      roleId: selectedTargetRoleId,
                      skipped: true,
                    });
                  }
                  retryQuestion();
                  moveToNextLesson();
                }}
                style={{ opacity: isSubmittingFeedback ? 0.6 : 1 }}
              >
                <Text className="text-[14px] font-bold leading-[18px] text-primary">
                  Skip
                </Text>
              </Pressable>
            </View>

            <TextInput
              accessibilityLabel="Your answer"
              className="mt-4 min-h-[118px] rounded-[24px] border-[2px] border-[#E9DFFF] bg-[#F6F2FF] p-5 text-[20px] font-medium leading-[28px] text-text-primary"
              multiline
              onChangeText={(value) => {
                if (feedbackState !== "idle") {
                  setFeedbackState("idle");
                  setFeedbackError(null);
                  setInterviewFeedback(null);
                }
                setAnswerDraft(lesson.id, value);
              }}
              placeholder="Type your answer here using the STAR method..."
              placeholderTextColor={colors.textPrimary}
              textAlignVertical="top"
              value={answer}
            />

            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityLabel="Voice answer"
                accessibilityRole="button"
                className="min-h-[62px] flex-1 overflow-hidden rounded-[22px] border-[3px] border-primary"
                onPress={() => router.push(voiceHref)}
              >
                <View className="flex-1 flex-row items-center justify-center gap-2 px-3">
                  <SymbolIcon
                    accessibilityLabel="Voice answer"
                    color={colors.primary}
                    name="mic"
                    size={21}
                  />
                  <Text
                    adjustsFontSizeToFit
                    className="text-[17px] font-bold leading-[22px] text-primary"
                    minimumFontScale={0.7}
                    numberOfLines={1}
                  >
                    Voice Answer
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel="Submit answer for AI feedback"
                accessibilityRole="button"
                className="min-h-[62px] flex-1 overflow-hidden rounded-[22px]"
                disabled={isSubmittingFeedback}
                onPress={() => {
                  void submitAnswer();
                }}
                style={{ boxShadow: "0 14px 30px rgba(108, 78, 245, 0.20)" }}
              >
                <LinearGradient
                  colors={["#7758FF", "#6C4EF5"]}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={{
                    alignItems: "center",
                    flex: 1,
                    flexDirection: "row",
                    gap: 8,
                    justifyContent: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  {isSubmittingFeedback ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <SymbolIcon
                      accessibilityLabel="Submit"
                      color={colors.white}
                      name="paperplane.fill"
                      size={19}
                    />
                  )}
                  <Text className="text-[18px] font-bold leading-[23px] text-white">
                    {isSubmittingFeedback ? "Scoring..." : "Submit"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {feedbackState === "error" ? (
              <View className="mt-4 rounded-[22px] bg-[#FFF1F1] px-4 py-4">
                <Text className="text-[13px] font-bold uppercase leading-[17px] text-[#C93A3A]">
                  Feedback unavailable
                </Text>
                <Text className="mt-2 text-[15px] font-semibold leading-[21px] text-[#8F2F2F]">
                  {feedbackError ?? aiFeedbackFallbackMessage}
                </Text>
              </View>
            ) : null}

            {feedbackState === "success" && interviewFeedback ? (
              <View className="mt-4 rounded-[22px] bg-[#F6F2FF] px-4 py-4">
                <Text className="text-[13px] font-bold uppercase leading-[17px] text-primary">
                  AI feedback
                </Text>
                <Text className="mt-2 text-[17px] font-bold leading-[24px] text-text-primary">
                  {interviewFeedback.summary}
                </Text>

                <View className="mt-3 flex-row flex-wrap gap-2">
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      Score {interviewFeedback.score}
                    </Text>
                  </View>
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      Clarity {interviewFeedback.categories.clarity}
                    </Text>
                  </View>
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      Relevance {interviewFeedback.categories.relevance}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 gap-2">
                  {interviewFeedback.strengths.slice(0, 2).map((strength) => (
                    <Text
                      className="text-[14px] font-semibold leading-[20px] text-[#4B5563]"
                      key={`strength-${strength}`}
                    >
                      • {strength}
                    </Text>
                  ))}
                  {interviewFeedback.improvements
                    .slice(0, 2)
                    .map((improvement) => (
                      <Text
                        className="text-[14px] font-semibold leading-[20px] text-[#6B7280]"
                        key={`improvement-${improvement}`}
                      >
                        → {improvement}
                      </Text>
                    ))}
                </View>

                <View className="mt-4 flex-row gap-3">
                  <Pressable
                    accessibilityLabel="Try this question again"
                    accessibilityRole="button"
                    className="h-[48px] flex-1 items-center justify-center rounded-[16px] border border-primary"
                    onPress={retryQuestion}
                  >
                    <Text className="text-[15px] font-bold leading-[20px] text-primary">
                      Try Again
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Continue to next question"
                    accessibilityRole="button"
                    className="h-[48px] flex-1 items-center justify-center rounded-[16px] bg-primary"
                    onPress={continueToNextQuestion}
                  >
                    <Text className="text-[15px] font-bold leading-[20px] text-white">
                      Continue
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
