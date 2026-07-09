import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { images } from "@/constants/images";
import { targetRoles } from "@/data/roles";
import { trackInterviewPracticeStarted } from "@/lib/analytics";
import {
    getEstimatedMinutesForDifficulty,
    getXpForDifficulty,
} from "@/lib/interviewGeneratedQuestion";
import {
    type BehavioralLesson,
    getActiveBehavioralLesson,
    getBehavioralLessons,
} from "@/lib/interviewLessonFlow";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";

const behavioralHref = "/interview/behavioral" as Href;
const questionHref = "/interview/question" as Href;

export default function LessonIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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

    return [generatedLesson, ...baseLessons].map((entry, index) => ({
      ...entry,
      lessonNumber: index + 1,
    }));
  }, [generatedPracticeQuestion, selectedRoleTitle, selectedTargetRoleId]);
  const lesson = getActiveBehavioralLesson({
    activeQuestionId,
    completedQuestionIds,
    lessons,
  });
  const generatedLessonContext =
    lesson && generatedPracticeQuestion?.id === lesson.id
      ? generatedPracticeQuestion.question
      : null;
  const lessonMinutes = lesson
    ? getEstimatedMinutesForDifficulty(lesson.difficulty)
    : 5;
  const lessonXp = lesson ? getXpForDifficulty(lesson.difficulty) : 30;
  const learningOutcomes = generatedLessonContext?.answerTips.slice(0, 3) ?? [
    "Structure answer clearly",
    "Avoid generic wording",
    "Practise with AI feedback",
  ];

  const startLesson = () => {
    if (lesson) {
      setActiveQuestionId(lesson.id);
      trackInterviewPracticeStarted({
        expectedStructure: lesson.expectedStructure,
        lessonId: lesson.id,
        lessonNumber: lesson.lessonNumber,
        mode: "text",
        questionCategory: "behavioral",
        questionId: lesson.id,
        roleId: selectedTargetRoleId,
      });
    }

    router.push(questionHref);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(behavioralHref);
  };

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F2FF] px-6">
        <Text className="text-center text-[22px] font-bold leading-[28px] text-text-primary">
          No lesson found
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
      <LinearGradient
        colors={gradients.bluePurple}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top + 12, 32),
          paddingBottom: 12,
        }}
      >
        <Pressable
          accessibilityLabel="Back to lessons"
          accessibilityRole="button"
          className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white/18"
          onPress={goBack}
        >
          <SymbolIcon
            accessibilityLabel="Back"
            color={colors.white}
            name="chevron.left"
            size={24}
          />
        </Pressable>
      </LinearGradient>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          minHeight: height,
          paddingBottom: Math.max(insets.bottom, 10),
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.bluePurple}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            paddingBottom: 38,
            paddingHorizontal: 24,
            paddingTop: 8,
          }}
        >
          <View className="mt-6 flex-row flex-wrap gap-3">
            <View className="rounded-full bg-white/20 px-5 py-2">
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Behavioral
              </Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-full bg-[#0D132B]/24 px-5 py-2">
              <SymbolIcon
                accessibilityLabel="Featured"
                color="#FFC800"
                name="star.fill"
                size={17}
              />
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Featured
              </Text>
            </View>
          </View>

          <Text
            adjustsFontSizeToFit
            className="mt-4 text-[34px] font-bold leading-[40px] text-white"
            minimumFontScale={0.72}
            numberOfLines={3}
          >
            {lesson.question}
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-x-7 gap-y-2">
            <View className="flex-row items-center gap-2">
              <SymbolIcon
                accessibilityLabel="Time estimate"
                color="rgba(255,255,255,0.82)"
                name="clock"
                size={18}
              />
              <Text className="text-[16px] font-semibold leading-[22px] text-white/82">
                {lessonMinutes} min
              </Text>
            </View>
            <Text className="text-[16px] font-semibold leading-[22px] text-white/82">
              Lesson {lesson.lessonNumber}
            </Text>
            <Text className="text-[16px] font-semibold leading-[22px] text-white/82">
              +{lessonXp} XP
            </Text>
          </View>
        </LinearGradient>

        <View className="-mt-6 gap-4 px-6">
          <View
            className="rounded-[28px] bg-white px-6 py-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(13, 19, 43, 0.06)",
            }}
          >
            <Text className="text-[21px] font-bold leading-[26px] text-text-primary">
              Overview
            </Text>
            <Text
              adjustsFontSizeToFit
              className="mt-3 text-[17px] font-semibold leading-[25px] text-[#8F92A8]"
              minimumFontScale={0.82}
              numberOfLines={4}
            >
              {generatedLessonContext?.whyThisQuestionMatters ??
                `Build a focused answer for ${lesson.roleTitle}. You will turn a real example into a clear ${lesson.expectedStructure} story that feels specific, confident, and easy for an interviewer to follow.`}
            </Text>
          </View>

          <View
            className="rounded-[28px] bg-white px-6 py-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(13, 19, 43, 0.06)",
            }}
          >
            <Text className="text-[21px] font-bold leading-[26px] text-text-primary">
              What you will learn
            </Text>
            <View className="mt-4 gap-3">
              {learningOutcomes.map((outcome) => (
                <View className="flex-row items-center gap-4" key={outcome}>
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-[#EEE9FF]">
                    <SymbolIcon
                      accessibilityLabel="Included"
                      color={colors.primary}
                      name="checkmark.circle"
                      size={20}
                    />
                  </View>
                  <Text className="flex-1 text-[17px] font-semibold leading-[22px] text-text-primary">
                    {outcome}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            className="flex-row items-center gap-4 rounded-[28px] bg-white px-6 py-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 14px 30px rgba(13, 19, 43, 0.06)",
            }}
          >
            <View className="h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-primary">
              <Image
                accessibilityLabel="CareerFox AI coach"
                contentFit="contain"
                source={images.careerFoxLogoMark}
                style={{ height: 46, width: 46 }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[18px] font-bold leading-[23px] text-text-primary">
                CareerFox AI
              </Text>
              <Text className="mt-0.5 text-[14px] font-semibold leading-[19px] text-[#8F92A8]">
                Your AI Career Coach
              </Text>
              <Text className="mt-2 text-[14px] font-semibold leading-[19px] text-[#8F92A8]">
                5 stars 4.9 (2.3k reviews)
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Start lesson"
            accessibilityRole="button"
            className="overflow-hidden rounded-[28px]"
            onPress={startLesson}
            style={{ boxShadow: "0 14px 30px rgba(40, 98, 232, 0.24)" }}
          >
            <LinearGradient
              colors={["#3F89F8", "#2350D9"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{
                alignItems: "center",
                minHeight: 64,
                justifyContent: "center",
                paddingHorizontal: 24,
              }}
            >
              <View className="flex-row items-center gap-3">
                <SymbolIcon
                  accessibilityLabel="Start"
                  color={colors.white}
                  name="play.fill"
                  size={24}
                />
                <Text className="text-[22px] font-bold leading-[28px] text-white">
                  Start Lesson
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
