import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { images } from "@/constants/images";
import { experienceLevels } from "@/data/experienceLevels";
import { interviewCategories } from "@/data/interviewCategories";
import { interviewQuestions } from "@/data/interviewQuestions";
import { targetRoles } from "@/data/roles";
import { postGeneratePracticeQuestion } from "@/lib/api";
import {
    createGeneratedPracticeQuestionId,
    type GeneratedPracticeQuestion,
} from "@/lib/interviewGeneratedQuestion";
import { useCareerStore } from "@/store/useCareerStore";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import type { InterviewCategory, InterviewQuestion } from "@/types/career";

const behavioralHref = "/interview/behavioral" as Href;
const homeHref = "/home" as Href;
const voiceHref = "/interview/voice" as Href;

const allDifficulties: InterviewQuestion["difficulty"][] = [
  "beginner",
  "intermediate",
  "advanced",
];

const difficultiesByExperienceLevel: Record<
  string,
  InterviewQuestion["difficulty"][]
> = {
  entry: ["beginner"],
  mid: ["beginner", "intermediate"],
  senior: ["intermediate", "advanced"],
  "lead-principal": ["advanced", "intermediate"],
};

const difficultyOptions = [
  {
    id: "beginner",
    label: "Easy",
  },
  {
    id: "intermediate",
    label: "Medium",
  },
  {
    id: "advanced",
    label: "Hard",
  },
] satisfies { id: InterviewQuestion["difficulty"]; label: string }[];

type InterviewModule = {
  category: InterviewCategory["id"];
  icon: SymbolIconName;
  minutes: number;
  shortTitle: string;
  statusHint: "future" | "in-progress";
  title: string;
};

const interviewModules: InterviewModule[] = [
  {
    category: "behavioral",
    icon: "message.fill",
    minutes: 12,
    shortTitle: "Behavioral",
    statusHint: "in-progress",
    title: "Behavioral Questions",
  },
  {
    category: "technical",
    icon: "chevron.left.forwardslash.chevron.right",
    minutes: 18,
    shortTitle: "Technical",
    statusHint: "in-progress",
    title: "Technical Fundamentals",
  },
];

const supportedTextPracticeCategories: readonly InterviewCategory["id"][] = [
  "behavioral",
];

const supportedVoicePracticeCategories: readonly InterviewCategory["id"][] = [
  "behavioral",
  "technical",
];

function getModuleStatus({
  hasCompletedQuestion,
  statusHint,
}: {
  hasCompletedQuestion: boolean;
  statusHint: InterviewModule["statusHint"];
}) {
  if (hasCompletedQuestion) {
    return {
      backgroundColor: colors.softSuccess,
      color: colors.success,
      icon: "checkmark.circle.fill" as SymbolIconName,
      label: "Completed",
    };
  }

  if (statusHint === "future") {
    return {
      backgroundColor: "#F5F1FF",
      color: "#8F92A8",
      icon: "lock" as SymbolIconName,
      label: "Future",
    };
  }

  return {
    backgroundColor: colors.softEnergy,
    color: colors.energy,
    icon: "bolt.fill" as SymbolIconName,
    label: "In progress",
  };
}

function PracticeModeCard({
  description,
  icon,
  iconColor,
  onPress,
  title,
}: {
  description: string;
  icon: SymbolIconName;
  iconColor: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      className="min-h-[118px] flex-1 justify-end rounded-[22px] bg-white p-4"
      onPress={onPress}
      style={{
        borderCurve: "continuous",
        boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
      }}
    >
      <SymbolIcon
        accessibilityLabel={title}
        color={iconColor}
        name={icon}
        size={30}
      />
      <Text
        adjustsFontSizeToFit
        className="mt-4 text-[16px] font-bold leading-[21px] text-text-primary"
        minimumFontScale={0.78}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 text-[12px] font-bold leading-[16px] text-[#8F92A8]"
        minimumFontScale={0.78}
        numberOfLines={1}
      >
        {description}
      </Text>
    </Pressable>
  );
}

export function InterviewPracticeScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 16 : 20;
  const [selectedCategory, setSelectedCategory] =
    useState<InterviewCategory["id"]>("behavioral");
  const selectedExperienceLevelId = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const setPreferredPracticeMode = useCareerStore(
    (state) => state.setPreferredPracticeMode,
  );
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const latestJobDescription = useCvAnalysisStore(
    (state) => state.request?.jobDescription,
  );
  const generatedPracticeQuestion = useInterviewStore(
    (state) => state.generatedPracticeQuestion,
  );
  const setGeneratedPracticeQuestion = useInterviewStore(
    (state) => state.setGeneratedPracticeQuestion,
  );
  const setActiveQuestionId = useInterviewStore(
    (state) => state.setActiveQuestionId,
  );
  const [generatedStatus, setGeneratedStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [generatedError, setGeneratedError] = useState<string | null>(null);
  const [practiceUnavailableMessage, setPracticeUnavailableMessage] = useState<
    string | null
  >(null);

  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRoleId,
  );
  const selectedExperienceLevel = experienceLevels.find(
    (level) => level.id === selectedExperienceLevelId,
  );
  const allowedDifficulties =
    selectedExperienceLevelId === null
      ? allDifficulties
      : (difficultiesByExperienceLevel[selectedExperienceLevelId] ??
        allDifficulties);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    InterviewQuestion["difficulty"]
  >(() => allowedDifficulties[0] ?? "intermediate");
  const completedQuestionIdSet = useMemo(
    () => new Set(completedQuestionIds),
    [completedQuestionIds],
  );
  const roleQuestions = useMemo(
    () =>
      interviewQuestions.filter(
        (question) =>
          (selectedRole ? question.roleId === selectedRole.id : true) &&
          allowedDifficulties.includes(question.difficulty),
      ),
    [allowedDifficulties, selectedRole],
  );
  const availableDifficulties = useMemo(() => {
    const categoryDifficultySet = new Set(
      roleQuestions
        .filter((question) => question.category === selectedCategory)
        .map((question) => question.difficulty),
    );
    const categoryDifficulties = allowedDifficulties.filter((difficulty) =>
      categoryDifficultySet.has(difficulty),
    );

    return categoryDifficulties.length > 0
      ? categoryDifficulties
      : allowedDifficulties;
  }, [allowedDifficulties, roleQuestions, selectedCategory]);
  const activeDifficulty = availableDifficulties.includes(selectedDifficulty)
    ? selectedDifficulty
    : (availableDifficulties[0] ?? "intermediate");
  const availableDifficultyOptions = useMemo(
    () =>
      difficultyOptions.filter((option) =>
        availableDifficulties.includes(option.id),
      ),
    [availableDifficulties],
  );

  const completedCategories = useMemo(
    () =>
      new Set(
        roleQuestions
          .filter((question) => completedQuestionIdSet.has(question.id))
          .map((question) => question.category),
      ),
    [completedQuestionIdSet, roleQuestions],
  );
  const filteredQuestions = roleQuestions.filter(
    (question) =>
      question.category === selectedCategory &&
      question.difficulty === activeDifficulty,
  );
  const nextQuestion =
    filteredQuestions.find(
      (question) => !completedQuestionIdSet.has(question.id),
    ) ??
    filteredQuestions[0] ??
    null;
  const selectedModule = interviewModules.find(
    (module) => module.category === selectedCategory,
  );
  const selectedModuleTitle = selectedModule?.title ?? "Interview practice";
  const isSelectedCategoryTextSupported =
    supportedTextPracticeCategories.includes(selectedCategory);
  const isSelectedCategoryVoiceSupported =
    supportedVoicePracticeCategories.includes(selectedCategory);

  const generateRoleAwareQuestion = useCallback(async () => {
    if (!isSelectedCategoryVoiceSupported) {
      setGeneratedStatus("idle");
      setGeneratedError(null);
      return;
    }

    if (!userId || !selectedRole || !selectedExperienceLevel) {
      setGeneratedStatus("idle");
      setGeneratedError(null);
      return;
    }

    setGeneratedStatus("loading");
    setGeneratedError(null);

    try {
      const response = await postGeneratePracticeQuestion({
        category: selectedCategory,
        difficulty: activeDifficulty,
        experienceLevel: selectedExperienceLevel.label,
        jobDescription: latestJobDescription,
        targetRole: selectedRole.title,
        userId,
      });

      const generatedQuestion: GeneratedPracticeQuestion = {
        createdAt: new Date().toISOString(),
        id: createGeneratedPracticeQuestionId(),
        question: response,
      };

      setGeneratedPracticeQuestion(generatedQuestion);
      setGeneratedStatus("success");
    } catch (caughtError) {
      setGeneratedStatus("error");
      setGeneratedError(
        caughtError instanceof Error
          ? caughtError.message
          : "CareerFox could not generate a role-aware question right now.",
      );
    }
  }, [
    userId,
    selectedRole,
    selectedExperienceLevel,
    selectedCategory,
    activeDifficulty,
    latestJobDescription,
    isSelectedCategoryVoiceSupported,
    setGeneratedPracticeQuestion,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void generateRoleAwareQuestion();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [generateRoleAwareQuestion]);

  const roleAwareQuestion =
    generatedPracticeQuestion &&
    generatedPracticeQuestion.question.category === selectedCategory &&
    generatedPracticeQuestion.question.difficulty === activeDifficulty
      ? generatedPracticeQuestion
      : null;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(homeHref);
  };

  const openBehavioralPractice = () => {
    if (!isSelectedCategoryTextSupported) {
      setPracticeUnavailableMessage(
        "Text practice is available for Behavioral right now. Use Voice Practice for Technical interviews.",
      );
      return;
    }

    setPreferredPracticeMode("text");
    setPracticeUnavailableMessage(null);
    if (selectedCategory === "behavioral" && roleAwareQuestion) {
      setActiveQuestionId(roleAwareQuestion.id);
    } else {
      setActiveQuestionId(nextQuestion?.id ?? null);
    }
    router.push(behavioralHref);
  };

  const openVoicePractice = () => {
    if (!isSelectedCategoryVoiceSupported) {
      setPracticeUnavailableMessage(
        "Voice coaching for this interview type is coming soon.",
      );
      return;
    }

    setPreferredPracticeMode("voice");
    setPracticeUnavailableMessage(null);
    setActiveQuestionId(nextQuestion?.id ?? null);
    router.push(voiceHref);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 18,
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.primary}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            paddingBottom: 34,
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(insets.top + 12, 32),
          }}
        >
          <View className="h-10 flex-row items-center">
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
              onPress={goBack}
            >
              <SymbolIcon
                accessibilityLabel="Back"
                color={colors.white}
                name="chevron.left"
                size={20}
              />
            </Pressable>
            <Text
              adjustsFontSizeToFit
              className="flex-1 text-center text-[22px] font-bold leading-[28px] text-white"
              minimumFontScale={0.82}
              numberOfLines={1}
            >
              Interview Practice
            </Text>
            <View className="h-10 w-10" />
          </View>
          <Text
            adjustsFontSizeToFit
            className="mt-1 text-center text-[14px] font-semibold leading-[20px] text-white/70"
            minimumFontScale={0.78}
            numberOfLines={2}
          >
            Practice with AI and build stronger interview confidence.
          </Text>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-[78px] w-[82px] items-center justify-end">
              <Image
                accessibilityLabel="CareerFox interview coach"
                contentFit="contain"
                source={images.careerFoxCoach}
                style={{ height: 82, width: 82 }}
              />
            </View>
            <View className="min-h-[70px] flex-1 justify-center rounded-[20px] bg-white/18 px-4">
              <Text className="text-[13px] font-bold leading-[20px] text-white">
                {
                  "\"I'm ready to help you ace your next interview! Let's practice together.\""
                }
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View
          className="-mt-[18px] gap-5"
          style={{ paddingHorizontal: horizontalPadding }}
        >
          <View
            className="rounded-[24px] bg-white p-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
            }}
          >
            <Text className="text-[19px] font-bold leading-[24px] text-text-primary">
              Interview Type
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-3">
              {interviewModules.map((module) => {
                const isSelected = selectedCategory === module.category;

                return (
                  <Pressable
                    accessibilityLabel={`${module.title} type`}
                    accessibilityRole="button"
                    className="h-[56px] items-center justify-center rounded-full"
                    key={module.category}
                    onPress={() => {
                      setPracticeUnavailableMessage(null);
                      setSelectedCategory(module.category);
                    }}
                    style={{
                      backgroundColor: isSelected ? colors.primary : "#F5F1FF",
                      width: (width - horizontalPadding * 2 - 40 - 12) / 2,
                    }}
                  >
                    <Text
                      adjustsFontSizeToFit
                      className="px-3 text-center text-[15px] font-bold leading-[20px]"
                      minimumFontScale={0.72}
                      numberOfLines={1}
                      style={{ color: isSelected ? colors.white : "#8F92A8" }}
                    >
                      {module.shortTitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            className="rounded-[24px] bg-white p-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
            }}
          >
            <Text className="text-[19px] font-bold leading-[24px] text-text-primary">
              Difficulty
            </Text>

            <View className="mt-4 flex-row gap-3">
              {availableDifficultyOptions.map((option) => {
                const isSelected = activeDifficulty === option.id;

                return (
                  <Pressable
                    accessibilityLabel={`${option.label} difficulty`}
                    accessibilityRole="button"
                    className="h-[54px] flex-1 items-center justify-center rounded-full border-[2px]"
                    key={option.id}
                    onPress={() => setSelectedDifficulty(option.id)}
                    style={{
                      backgroundColor: isSelected ? "#FF9F0A" : colors.white,
                      borderColor: isSelected ? "#FF9F0A" : "#EEE1FF",
                    }}
                  >
                    <Text
                      className="text-[15px] font-bold leading-[20px]"
                      style={{ color: isSelected ? colors.white : "#8F92A8" }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-4">
            <PracticeModeCard
              description="STAR method practice"
              icon="message.fill"
              iconColor={colors.primary}
              onPress={openBehavioralPractice}
              title="Behavioral Q&A"
            />
            <PracticeModeCard
              description="Speak your answers"
              icon="mic"
              iconColor="#F97316"
              onPress={openVoicePractice}
              title="Voice Practice"
            />
          </View>

          {!isSelectedCategoryVoiceSupported || practiceUnavailableMessage ? (
            <View className="rounded-[20px] bg-[#FFF7ED] px-4 py-4">
              <Text className="text-[13px] font-semibold leading-[18px] text-[#C2410C]">
                {practiceUnavailableMessage ??
                  "This interview type is coming soon. Behavioral and Technical voice practice are available now."}
              </Text>
            </View>
          ) : null}

          <View
            className="rounded-[24px] bg-white p-5"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
            }}
          >
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[19px] font-bold leading-[24px] text-text-primary">
                AI Practice Question
              </Text>
              <View className="rounded-full bg-[#F5F1FF] px-3 py-1.5">
                <Text className="text-[12px] font-bold leading-[16px] text-primary">
                  {selectedCategory}
                </Text>
              </View>
            </View>

            {!isSelectedCategoryVoiceSupported ? (
              <View className="mt-4 rounded-[20px] bg-[#F8F5FF] px-4 py-4">
                <Text className="text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                  This interview type is preview-only right now. Behavioral and
                  Technical voice practice are fully available.
                </Text>
              </View>
            ) : null}

            {isSelectedCategoryVoiceSupported &&
            generatedStatus === "loading" ? (
              <View className="mt-4 min-h-[96px] items-center justify-center rounded-[20px] bg-[#F8F5FF]">
                <ActivityIndicator color={colors.primary} size="small" />
                <Text className="mt-2 text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                  Generating a role-aware question...
                </Text>
              </View>
            ) : null}

            {isSelectedCategoryVoiceSupported && generatedStatus === "error" ? (
              <View className="mt-4 rounded-[20px] bg-[#FFF1F1] px-4 py-4">
                <Text className="text-[13px] font-semibold leading-[18px] text-[#C93A3A]">
                  {generatedError ??
                    "CareerFox could not generate a role-aware question right now."}
                </Text>
                <Pressable
                  accessibilityLabel="Retry AI question generation"
                  accessibilityRole="button"
                  className="mt-3 self-start rounded-full bg-white px-4 py-2"
                  onPress={() => void generateRoleAwareQuestion()}
                >
                  <Text className="text-[12px] font-bold leading-[16px] text-primary">
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {isSelectedCategoryVoiceSupported &&
            generatedStatus === "success" &&
            roleAwareQuestion ? (
              <View className="mt-4 rounded-[20px] bg-[#F8F5FF] px-4 py-4">
                <Text className="text-[15px] font-bold leading-[21px] text-text-primary">
                  {roleAwareQuestion.question.question}
                </Text>
                <Text className="mt-2 text-[12px] font-semibold leading-[17px] text-[#8F92A8]">
                  {roleAwareQuestion.question.whyThisQuestionMatters}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-[11px] font-bold leading-[15px] text-primary">
                      {roleAwareQuestion.question.expectedStructure}
                    </Text>
                  </View>
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-[11px] font-bold leading-[15px] text-primary">
                      {roleAwareQuestion.question.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {isSelectedCategoryVoiceSupported &&
            generatedStatus === "success" &&
            !roleAwareQuestion ? (
              <View className="mt-4 rounded-[20px] bg-[#F8F5FF] px-4 py-4">
                <Text className="text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                  No role-aware question is available for this selection yet.
                </Text>
                <Pressable
                  accessibilityLabel="Generate AI practice question"
                  accessibilityRole="button"
                  className="mt-3 self-start rounded-full bg-white px-4 py-2"
                  onPress={() => void generateRoleAwareQuestion()}
                >
                  <Text className="text-[12px] font-bold leading-[16px] text-primary">
                    Generate
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="Start mock interview"
            accessibilityRole="button"
            className="overflow-hidden rounded-[22px]"
            disabled={!isSelectedCategoryVoiceSupported}
            onPress={openVoicePractice}
            style={{
              boxShadow: "0 14px 30px rgba(108, 78, 245, 0.22)",
              opacity: isSelectedCategoryVoiceSupported ? 1 : 0.62,
            }}
          >
            <LinearGradient
              colors={["#7758FF", "#9378FF"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{
                alignItems: "center",
                minHeight: 66,
                justifyContent: "center",
                paddingHorizontal: 20,
              }}
            >
              <View className="flex-row items-center justify-center gap-2.5">
                <Text className="text-[20px] leading-[24px]">🎙️</Text>
                <Text
                  adjustsFontSizeToFit
                  className="text-[19px] font-bold leading-[25px] text-white"
                  minimumFontScale={0.78}
                  numberOfLines={1}
                >
                  {isSelectedCategoryVoiceSupported
                    ? selectedCategory === "technical"
                      ? "Start Technical Voice Interview"
                      : "Start Mock Interview"
                    : "Behavioral & Technical Available"}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          <View className="gap-3">
            <View className="flex-row items-end justify-between gap-4">
              <View className="flex-1">
                <Text className="text-[19px] font-bold leading-[24px] text-text-primary">
                  Modules
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-1 text-[12px] font-bold leading-[17px] text-[#8F92A8]"
                  minimumFontScale={0.78}
                  numberOfLines={2}
                >
                  {selectedModuleTitle}
                </Text>
              </View>
            </View>

            {interviewModules.map((module) => {
              const status = getModuleStatus({
                hasCompletedQuestion: completedCategories.has(module.category),
                statusHint: module.statusHint,
              });
              const categoryDetails = interviewCategories.find(
                (category) => category.id === module.category,
              );
              const isSelected = selectedCategory === module.category;

              return (
                <Pressable
                  accessibilityLabel={`${module.title}, ${status.label}`}
                  accessibilityRole="button"
                  className="rounded-[22px] bg-white p-3.5"
                  key={module.category}
                  onPress={() => setSelectedCategory(module.category)}
                  style={{
                    borderColor: isSelected ? "#D9CCFF" : "transparent",
                    borderCurve: "continuous",
                    borderWidth: 2,
                    boxShadow: "0 10px 24px rgba(13, 19, 43, 0.05)",
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-[46px] w-[46px] items-center justify-center rounded-[18px]"
                      style={{
                        backgroundColor:
                          categoryDetails?.iconBackground ?? colors.mutedPurple,
                      }}
                    >
                      <SymbolIcon
                        accessibilityLabel={module.title}
                        color={categoryDetails?.iconColor ?? colors.primary}
                        name={module.icon}
                        size={22}
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        adjustsFontSizeToFit
                        className="text-[15px] font-bold leading-[20px] text-text-primary"
                        minimumFontScale={0.76}
                        numberOfLines={1}
                      >
                        {module.title}
                      </Text>
                      <Text className="mt-1 text-[12px] font-bold leading-[16px] text-[#8F92A8]">
                        {module.minutes} min
                      </Text>
                    </View>

                    <View
                      className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                      style={{ backgroundColor: status.backgroundColor }}
                    >
                      <SymbolIcon
                        accessibilityLabel={status.label}
                        color={status.color}
                        name={status.icon}
                        size={13}
                      />
                      <Text
                        adjustsFontSizeToFit
                        className="text-[11px] font-bold leading-[14px]"
                        minimumFontScale={0.74}
                        numberOfLines={1}
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
