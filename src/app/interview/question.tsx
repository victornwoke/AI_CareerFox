import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { usePostHog } from "posthog-react-native";
import {
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
import {
  getActiveBehavioralLesson,
  getBehavioralLessons,
  getNextBehavioralLesson,
} from "@/lib/interviewLessonFlow";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";

const behavioralHref = "/interview/behavioral" as Href;
const lessonIntroHref = "/interview/lesson-intro" as Href;
const voiceHref = "/interview/voice" as Href;

const frameworkSteps = [
  { color: colors.primary, label: "Situation", letter: "S" },
  { color: colors.energy, label: "Task", letter: "T" },
  { color: colors.success, label: "Action", letter: "A" },
  { color: colors.blue, label: "Result", letter: "R" },
];

export default function InterviewQuestionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const posthog = usePostHog();
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const activeQuestionId = useInterviewStore((state) => state.activeQuestionId);
  const answerDraftsByQuestionId = useInterviewStore(
    (state) => state.answerDraftsByQuestionId,
  );
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const markQuestionCompleted = useInterviewStore(
    (state) => state.markQuestionCompleted,
  );
  const setActiveQuestionId = useInterviewStore(
    (state) => state.setActiveQuestionId,
  );
  const setAnswerDraft = useInterviewStore((state) => state.setAnswerDraft);
  const lessons = useMemo(
    () => getBehavioralLessons(selectedTargetRoleId),
    [selectedTargetRoleId],
  );
  const lesson = getActiveBehavioralLesson({
    activeQuestionId,
    completedQuestionIds,
    lessons,
  });
  const answer = lesson ? (answerDraftsByQuestionId[lesson.id] ?? "") : "";
  const progress =
    lesson && lessons.length > 0 ? lesson.lessonNumber / lessons.length : 0;

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

  const submitAnswer = () => {
    if (!lesson) {
      router.replace(behavioralHref);
      return;
    }

    posthog.capture('interview_answer_submitted', {
      lesson_id: lesson.id,
      lesson_number: lesson.lessonNumber,
      role_id: selectedTargetRoleId,
      answer_length: answer.trim().length,
      skipped: false,
    });

    markQuestionCompleted(lesson.id);
    moveToNextLesson();
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
        <View
          className="bg-white px-6 pb-5"
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
                <View className="rounded-full bg-[#F5F1FF] px-3 py-1.5" key={tag}>
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
              STAR Framework
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
                onPress={() => {
                    if (lesson) {
                      posthog.capture('interview_answer_submitted', {
                        lesson_id: lesson.id,
                        lesson_number: lesson.lessonNumber,
                        role_id: selectedTargetRoleId,
                        answer_length: 0,
                        skipped: true,
                      });
                    }
                    moveToNextLesson();
                  }}
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
              onChangeText={(value) => setAnswerDraft(lesson.id, value)}
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
                accessibilityLabel="Next question"
                accessibilityRole="button"
                className="min-h-[62px] flex-1 overflow-hidden rounded-[22px]"
                onPress={submitAnswer}
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
                  <Text className="text-[18px] font-bold leading-[23px] text-white">
                    Next
                  </Text>
                  <SymbolIcon
                    accessibilityLabel="Next"
                    color={colors.white}
                    name="arrow.right"
                    size={19}
                  />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
