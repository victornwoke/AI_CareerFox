import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { getEstimatedMinutesForDifficulty } from "@/lib/interviewGeneratedQuestion";
import {
    type BehavioralLesson,
    getActiveBehavioralLesson,
    getBehavioralLessons,
} from "@/lib/interviewLessonFlow";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";

const coachHref = "/coach" as Href;
const lessonIntroHref = "/interview/lesson-intro" as Href;

function getStatusMeta({
  isComplete,
  isCurrent,
}: {
  isComplete: boolean;
  isCurrent: boolean;
}) {
  if (isComplete) {
    return {
      backgroundColor: colors.softSuccess,
      color: colors.success,
      icon: "checkmark.circle.fill" as SymbolIconName,
      label: "Completed",
    };
  }

  if (isCurrent) {
    return {
      backgroundColor: colors.softEnergy,
      color: colors.energy,
      icon: "bolt.fill" as SymbolIconName,
      label: "In progress",
    };
  }

  return {
    backgroundColor: colors.mutedPurple,
    color: colors.primary,
    icon: "circle" as SymbolIconName,
    label: "Ready",
  };
}

export default function BehavioralInterviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const activeQuestionId = useInterviewStore((state) => state.activeQuestionId);
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const generatedPracticeQuestion = useInterviewStore(
    (state) => state.generatedPracticeQuestion,
  );
  const setActiveQuestionId = useInterviewStore(
    (state) => state.setActiveQuestionId,
  );
  const selectedRoleTitle = useMemo(
    () =>
      selectedTargetRoleId
        ? (targetRoles.find((role) => role.id === selectedTargetRoleId)
            ?.title ?? "Career")
        : "Career",
    [selectedTargetRoleId],
  );
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
      roleTitle: selectedRoleTitle,
      tags: [
        generated.expectedStructure,
        generated.difficulty,
        `${getEstimatedMinutesForDifficulty(generated.difficulty)} min`,
      ],
    };

    return [generatedLesson, ...baseLessons].map((lesson, index) => ({
      ...lesson,
      lessonNumber: index + 1,
    }));
  }, [generatedPracticeQuestion, selectedRoleTitle, selectedTargetRoleId]);
  const activeLesson = getActiveBehavioralLesson({
    activeQuestionId,
    completedQuestionIds,
    lessons,
  });
  const completedBehavioralCount = lessons.filter((lesson) =>
    completedQuestionIds.includes(lesson.id),
  ).length;

  const openLesson = (questionId: string) => {
    setActiveQuestionId(questionId);
    router.push(lessonIntroHref);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(coachHref);
  };

  return (
    <View className="flex-1 bg-white">
      <View
        className="bg-[#F6F2FF] px-6"
        style={{ paddingTop: Math.max(insets.top + 12, 32), paddingBottom: 12 }}
      >
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityLabel="Back to interview practice"
            accessibilityRole="button"
            className="h-[58px] w-[58px] items-center justify-center rounded-full bg-white"
            onPress={goBack}
            style={{ boxShadow: "0 10px 24px rgba(108, 78, 245, 0.08)" }}
          >
            <SymbolIcon
              accessibilityLabel="Back"
              color={colors.primary}
              name="chevron.left"
              size={26}
            />
          </Pressable>

          <View className="flex-1">
            <Text className="text-[28px] font-bold leading-[34px] text-text-primary">
              Behavioral Questions
            </Text>
            <Text className="mt-1 text-[18px] font-semibold leading-[24px] text-[#8F92A8]">
              {completedBehavioralCount} / {lessons.length} completed
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          paddingTop: 8,
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6 h-3 flex-row gap-2">
          {lessons.slice(0, 3).map((lesson, index) => {
            const isFilled =
              index === 0 ||
              completedQuestionIds.includes(lesson.id) ||
              lesson.id === activeLesson?.id;

            return (
              <View
                className="h-3 flex-1 rounded-full"
                key={lesson.id}
                style={{
                  backgroundColor: isFilled ? colors.primary : "#E8DFFF",
                }}
              />
            );
          })}
        </View>

        {activeLesson ? (
          <Pressable
            accessibilityLabel={`Continue ${activeLesson.question}`}
            accessibilityRole="button"
            className="mt-8 overflow-hidden rounded-[28px]"
            onPress={() => openLesson(activeLesson.id)}
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(108, 78, 245, 0.18)",
            }}
          >
            <LinearGradient
              colors={gradients.primary}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{ padding: 24 }}
            >
              <Text className="text-[13px] font-bold uppercase leading-[18px] text-white/72">
                Current lesson
              </Text>
              <Text className="mt-3 text-[25px] font-bold leading-[32px] text-white">
                {activeLesson.question}
              </Text>
              <View className="mt-5 flex-row flex-wrap gap-2">
                {activeLesson.tags.map((tag) => (
                  <View
                    className="rounded-full bg-white/18 px-3.5 py-2"
                    key={tag}
                  >
                    <Text className="text-[13px] font-bold leading-[17px] text-white">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        <View className="mt-8 gap-4">
          {lessons.map((lesson) => {
            const isComplete = completedQuestionIds.includes(lesson.id);
            const isCurrent = lesson.id === activeLesson?.id;
            const status = getStatusMeta({ isComplete, isCurrent });

            return (
              <Pressable
                accessibilityLabel={`${lesson.question}, ${status.label}`}
                accessibilityRole="button"
                className="rounded-[24px] bg-white p-4"
                key={lesson.id}
                onPress={() => openLesson(lesson.id)}
                style={{
                  borderColor: isCurrent ? "#D9CCFF" : "transparent",
                  borderCurve: "continuous",
                  borderWidth: 2,
                  boxShadow: "0 10px 24px rgba(13, 19, 43, 0.05)",
                }}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className="h-[46px] w-[46px] items-center justify-center rounded-[18px]"
                    style={{ backgroundColor: status.backgroundColor }}
                  >
                    <SymbolIcon
                      accessibilityLabel={status.label}
                      color={status.color}
                      name={status.icon}
                      size={22}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-[12px] font-bold uppercase leading-[16px] text-primary">
                        Lesson {lesson.lessonNumber}
                      </Text>
                      <Text
                        adjustsFontSizeToFit
                        className="text-[12px] font-bold leading-[16px]"
                        minimumFontScale={0.75}
                        numberOfLines={1}
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </Text>
                    </View>
                    <Text className="mt-2 text-[16px] font-bold leading-[22px] text-text-primary">
                      {lesson.question}
                    </Text>
                    <Text className="mt-2 text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                      {lesson.roleTitle} - {lesson.expectedStructure} practice
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
