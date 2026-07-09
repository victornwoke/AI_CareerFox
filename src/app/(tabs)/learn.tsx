import { useAuth } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
    interviewQuestionBankCounts,
    learningCategories,
} from "@/data/interviewCategories";
import { interviewQuestions } from "@/data/interviewQuestions";
import { careerMissions } from "@/data/missions";
import { targetRoles } from "@/data/roles";
import { postGenerateRoleLearningPlan } from "@/lib/api";
import type { GenerateRoleLearningPlanOutput } from "@/lib/server/aiFeedback";
import { useCareerStore } from "@/store/useCareerStore";
import { useCvAnalysisStore } from "@/store/useCvAnalysisStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";
import type {
    CareerMission,
    InterviewCategory,
    InterviewQuestion,
    LearningCategory,
    TargetRole,
} from "@/types/career";

const cvHref = "/cv" as Href;
const interviewHref = "/interview" as Href;
const learnScreenCategories = learningCategories.filter(
  (category) =>
    category.id !== "job-search" &&
    category.id !== "hr-interviews" &&
    category.id !== "case-interviews",
);

type ActiveInterviewCategory = Extract<
  InterviewCategory,
  "behavioral" | "technical"
>;

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

type CategoryProgress = {
  completed: number;
  progress: number;
  total: number;
};

type LearningCategoryCard = LearningCategory & {
  countLabel: string;
  progressDetail: string;
  progressStatus: CategoryProgress | null;
};

function ProgressBar({ color, progress }: { color: string; progress: number }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-[#EEEAFD]">
      <View
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${clampedProgress}%` }}
      />
    </View>
  );
}

function getCategoryHref(category: LearningCategory): Href {
  if (category.destination === "cv") {
    return cvHref;
  }

  if (category.destination === "interview") {
    return interviewHref;
  }

  return `/learn/${category.id}` as Href;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

function getQuestionBankCount({
  category,
  experienceLevelId,
  roleCategory,
}: {
  category: InterviewCategory["id"];
  experienceLevelId: string | null;
  roleCategory: TargetRole["category"] | null;
}) {
  const bankCount = interviewQuestionBankCounts[category];
  const levelCount = experienceLevelId
    ? (bankCount.byExperienceLevel[experienceLevelId] ?? bankCount.base)
    : bankCount.base;
  const roleBonus = roleCategory
    ? (bankCount.roleCategoryBonus?.[roleCategory] ?? 0)
    : 0;

  return levelCount + roleBonus;
}

export default function LearnScreen() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const [learningPlan, setLearningPlan] =
    useState<GenerateRoleLearningPlanOutput | null>(null);
  const [learningPlanStatus, setLearningPlanStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [learningPlanError, setLearningPlanError] = useState<string | null>(
    null,
  );
  const selectedExperienceLevelId = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const completedMissionIds = useProgressStore(
    (state) => state.completedMissionIds,
  );
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const latestJobDescription = useCvAnalysisStore(
    (state) => state.request?.jobDescription,
  );
  const isCompact = width < 390;
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 18 : isCompact ? 20 : 24;
  const cardGap = isNarrow ? 10 : 12;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - cardGap) / 2);
  const cardPaddingX = isNarrow ? 12 : 16;
  const cardPaddingY = isNarrow ? 18 : 20;
  const cardMinHeight = isNarrow ? 186 : isCompact ? 194 : 204;
  const cardIconSize = isNarrow ? 52 : 56;
  const cardIconSymbolSize = isNarrow ? 26 : 28;
  const cardTitleSize = isNarrow ? 19 : isCompact ? 21 : 22;
  const cardTitleLeading = isNarrow ? 23 : isCompact ? 25 : 26;
  const cardDescriptionSize = isNarrow ? 11 : 12;
  const cardCountSize = isNarrow ? 13 : 15;
  const cardProgressSize = isNarrow ? 12 : 14;
  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRoleId,
  );
  const selectedExperienceLevel = experienceLevels.find(
    (level) => level.id === selectedExperienceLevelId,
  );

  const learningPlanCallRef = useRef(0);

  const generateLearningPlan = useCallback(async () => {
    if (!userId || !selectedRole || !selectedExperienceLevel) {
      setLearningPlan(null);
      setLearningPlanStatus("idle");
      setLearningPlanError(null);
      return;
    }

    setLearningPlanStatus("loading");
    setLearningPlanError(null);

    const callId = ++learningPlanCallRef.current;

    try {
      const result = await postGenerateRoleLearningPlan({
        experienceLevel: selectedExperienceLevel.label,
        jobDescription: latestJobDescription,
        targetRole: selectedRole.title,
        userId,
      });

      if (callId !== learningPlanCallRef.current) {
        return;
      }

      setLearningPlan(result);
      setLearningPlanStatus("success");
    } catch (caughtError) {
      if (callId !== learningPlanCallRef.current) {
        return;
      }
      setLearningPlanStatus("error");
      setLearningPlanError(
        caughtError instanceof Error
          ? caughtError.message
          : "CareerFox could not generate your learning plan right now.",
      );
    }
  }, [latestJobDescription, selectedExperienceLevel, selectedRole, userId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void generateLearningPlan();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [generateLearningPlan]);
  const allowedDifficulties =
    selectedExperienceLevelId === null
      ? allDifficulties
      : (difficultiesByExperienceLevel[selectedExperienceLevelId] ??
        allDifficulties);
  const completedMissionIdSet = useMemo(
    () => new Set(completedMissionIds),
    [completedMissionIds],
  );
  const completedQuestionIdSet = useMemo(
    () => new Set(completedQuestionIds),
    [completedQuestionIds],
  );
  const roleQuestions = useMemo(() => {
    if (!selectedRole) {
      return [];
    }

    return interviewQuestions.filter(
      (question) =>
        question.roleId === selectedRole.id &&
        allowedDifficulties.includes(question.difficulty),
    );
  }, [allowedDifficulties, selectedRole]);
  const bankCounts = useMemo(() => {
    const roleCategory = selectedRole?.category ?? null;

    return {
      behavioral: getQuestionBankCount({
        category: "behavioral",
        experienceLevelId: selectedExperienceLevelId,
        roleCategory,
      }),
      technical: getQuestionBankCount({
        category: "technical",
        experienceLevelId: selectedExperienceLevelId,
        roleCategory,
      }),
    } satisfies Record<ActiveInterviewCategory, number>;
  }, [selectedExperienceLevelId, selectedRole?.category]);
  const totalInterviewBankCount = Object.values(bankCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const getProgressForQuestions = useCallback(
    (category: InterviewCategory["id"], total: number): CategoryProgress => {
      const completed = roleQuestions.filter(
        (question) =>
          question.category === category &&
          completedQuestionIdSet.has(question.id),
      ).length;

      return {
        completed,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        total,
      };
    },
    [completedQuestionIdSet, roleQuestions],
  );
  const getProgressForMissions = useCallback(
    (missionCategories: CareerMission["category"][]): CategoryProgress => {
      const matchingMissions = careerMissions.filter((mission) =>
        missionCategories.includes(mission.category),
      );
      const completed = matchingMissions.filter((mission) =>
        completedMissionIdSet.has(mission.id),
      ).length;
      const total = matchingMissions.length;

      return {
        completed,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        total,
      };
    },
    [completedMissionIdSet],
  );
  const categoryCards = useMemo<LearningCategoryCard[]>(() => {
    const cvProgress = getProgressForMissions(["cv"]);
    const skillsProgress = getProgressForMissions(["skills"]);
    const selectedRoleLabel = selectedRole?.title ?? "your target role";
    const selectedLevelLabel = selectedExperienceLevel?.label ?? "all levels";
    const behavioralProgress = getProgressForQuestions(
      "behavioral",
      bankCounts.behavioral,
    );
    const technicalProgress = getProgressForQuestions(
      "technical",
      bankCounts.technical,
    );
    const completedInterviewQuestions =
      behavioralProgress.completed + technicalProgress.completed;
    const interviewQuestionProgress = {
      completed: completedInterviewQuestions,
      progress:
        totalInterviewBankCount === 0
          ? 0
          : Math.round(
              (completedInterviewQuestions / totalInterviewBankCount) * 100,
            ),
      total: totalInterviewBankCount,
    };
    const planModules = learningPlan?.modules ?? [];
    const learnModules = planModules.filter(
      (module) => module.type === "learn",
    );
    const cvModules = planModules.filter((module) => module.type === "cv");
    const interviewModules = planModules.filter(
      (module) =>
        module.type === "practice" || module.type === "mock_interview",
    );
    const totalPlanMinutes = planModules.reduce(
      (sum, module) => sum + module.estimatedMinutes,
      0,
    );

    return learnScreenCategories.map((category) => {
      if (category.id === "interview-practice") {
        const interviewModuleMinutes = interviewModules.reduce(
          (sum, module) => sum + module.estimatedMinutes,
          0,
        );

        return {
          ...category,
          countLabel:
            interviewModules.length > 0
              ? `${interviewModules.length} AI modules`
              : `${totalInterviewBankCount}+ questions`,
          progressDetail:
            interviewModules.length > 0
              ? `${interviewModuleMinutes} min role plan • ${interviewQuestionProgress.completed}/${interviewQuestionProgress.total}+ practised`
              : `${interviewQuestionProgress.completed}/${interviewQuestionProgress.total}+ practised`,
          progressStatus: interviewQuestionProgress,
        };
      }

      if (category.id === "resume-cv") {
        const cvMinutes = cvModules.reduce(
          (sum, module) => sum + module.estimatedMinutes,
          0,
        );

        return {
          ...category,
          countLabel:
            cvModules.length > 0
              ? `${cvModules.length} AI module${cvModules.length === 1 ? "" : "s"}`
              : pluralize(cvProgress.total, "CV task"),
          progressDetail:
            cvModules.length > 0
              ? `${cvMinutes} min role plan • ${cvProgress.completed}/${cvProgress.total} CV tasks complete`
              : `${cvProgress.completed}/${cvProgress.total} CV tasks complete`,
          progressStatus: cvProgress,
        };
      }

      if (category.id === "skills-knowledge") {
        return {
          ...category,
          countLabel:
            learnModules.length > 0
              ? `${learnModules.length} AI lesson${learnModules.length === 1 ? "" : "s"}`
              : selectedRole
                ? pluralize(selectedRole.popularKeywords.length, "role skill")
                : "Choose role",
          progressDetail:
            learnModules.length > 0
              ? `${learnModules[0]?.title ?? "Role lesson"}`
              : `${skillsProgress.completed}/${skillsProgress.total} skill tasks complete`,
          progressStatus: skillsProgress,
        };
      }

      if (category.id === "career-guidance") {
        return {
          ...category,
          countLabel: selectedExperienceLevel
            ? `${selectedExperienceLevel.label} plan`
            : "Choose level",
          progressDetail:
            learningPlan?.summary && totalPlanMinutes > 0
              ? `${totalPlanMinutes} min • ${learningPlan.summary}`
              : selectedExperienceLevel
                ? `${selectedRoleLabel} guidance for ${selectedLevelLabel}`
                : "Select your experience level",
          progressStatus: null,
        };
      }

      if (category.id === "technical-interviews") {
        return {
          ...category,
          countLabel: `${bankCounts.technical}+ questions`,
          progressDetail: `${technicalProgress.completed}/${technicalProgress.total}+ practised`,
          progressStatus: technicalProgress,
        };
      }

      if (category.id === "behavioral-interviews") {
        return {
          ...category,
          countLabel: `${bankCounts.behavioral}+ questions`,
          progressDetail: `${behavioralProgress.completed}/${behavioralProgress.total}+ practised`,
          progressStatus: behavioralProgress,
        };
      }

      return {
        ...category,
        countLabel: "Personalized path",
        progressDetail: `${selectedLevelLabel} ${selectedRoleLabel} focus`,
        progressStatus: null,
      };
    });
  }, [
    bankCounts,
    getProgressForMissions,
    getProgressForQuestions,
    learningPlan,
    selectedExperienceLevel,
    selectedRole,
    totalInterviewBankCount,
  ]);
  const completedPracticeCount = categoryCards.reduce(
    (total, category) =>
      category.id === "interview-practice"
        ? total + (category.progressStatus?.completed ?? 0)
        : total,
    0,
  );
  const headerSummary =
    selectedRole && selectedExperienceLevel
      ? `${totalInterviewBankCount}+ questions • ${completedPracticeCount} practised`
      : "Choose a target role and level to personalize";
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    if (!normalizedQuery) {
      return categoryCards;
    }

    return categoryCards.filter((category) => {
      const searchableText =
        `${category.title} ${category.description} ${category.countLabel}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [categoryCards, normalizedQuery]);

  return (
    <View className="flex-1 bg-[#10B77F]">
      <View
        className="bg-[#10B77F]"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top - 8, 24),
          paddingBottom: 16,
        }}
      >
        <Text className="text-[26px] font-bold leading-[32px] text-white">
          Learning Categories
        </Text>
      </View>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="bg-[#10B77F]"
          style={{
            borderBottomLeftRadius: 34,
            borderBottomRightRadius: 34,
            paddingBottom: 34,
            paddingHorizontal: horizontalPadding,
            paddingTop: 2,
          }}
        >
          <Text className="mt-1.5 text-[15px] font-semibold leading-[21px] text-white/72">
            {headerSummary}
          </Text>
          {selectedRole && selectedExperienceLevel ? (
            <Text className="mt-1 text-[12px] font-bold leading-[16px] text-white/62">
              {selectedRole.title} • {selectedExperienceLevel.label}
            </Text>
          ) : null}
        </View>

        <View
          className="-mt-[20px]"
          style={{ paddingHorizontal: horizontalPadding }}
        >
          <View
            className="h-[58px] flex-row items-center rounded-[20px] bg-white px-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <SymbolIcon
              accessibilityLabel="Search"
              color="#8F92A8"
              name="magnifyingglass"
              size={22}
            />
            <TextInput
              accessibilityLabel="Search categories"
              className="ml-3 flex-1 text-[17px] font-semibold leading-[22px] text-text-primary"
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor={colors.textPrimary}
              returnKeyType="search"
              style={{ color: colors.textPrimary }}
              value={searchQuery}
            />
          </View>

          {selectedRole && selectedExperienceLevel ? (
            <View
              className="mt-3 rounded-[18px] bg-white px-4 py-3"
              style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
            >
              {learningPlanStatus === "loading" ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text className="flex-1 text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                    Building your role learning plan...
                  </Text>
                </View>
              ) : null}

              {learningPlanStatus === "error" ? (
                <View>
                  <Text className="text-[13px] font-semibold leading-[18px] text-[#C93A3A]">
                    {learningPlanError ??
                      "CareerFox could not generate your role learning plan."}
                  </Text>
                  <Pressable
                    accessibilityLabel="Retry role learning plan"
                    accessibilityRole="button"
                    className="mt-2 self-start rounded-full bg-[#F5F1FF] px-4 py-2"
                    onPress={() => void generateLearningPlan()}
                  >
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      Retry
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {learningPlanStatus === "success" && learningPlan ? (
                <View>
                  <Text className="text-[13px] font-bold leading-[18px] text-primary">
                    {learningPlan.title}
                  </Text>
                  <Text className="mt-1 text-[12px] font-semibold leading-[17px] text-[#8F92A8]">
                    {learningPlan.summary}
                  </Text>
                </View>
              ) : null}

              {learningPlanStatus === "success" && !learningPlan ? (
                <View>
                  <Text className="text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                    Your role plan is not ready yet.
                  </Text>
                  <Pressable
                    accessibilityLabel="Generate role learning plan"
                    accessibilityRole="button"
                    className="mt-2 self-start rounded-full bg-[#F5F1FF] px-4 py-2"
                    onPress={() => void generateLearningPlan()}
                  >
                    <Text className="text-[12px] font-bold leading-[16px] text-primary">
                      Generate
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View
          className="mt-5 flex-row flex-wrap"
          style={{
            gap: cardGap,
            paddingHorizontal: horizontalPadding,
          }}
        >
          {visibleCategories.map((category) => (
            <Pressable
              accessibilityLabel={`Open ${category.title}`}
              accessibilityRole="button"
              className="rounded-[28px] bg-white"
              key={category.id}
              onPress={() => router.push(getCategoryHref(category))}
              style={{
                borderCurve: "continuous",
                boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
                minHeight: cardMinHeight,
                paddingHorizontal: cardPaddingX,
                paddingVertical: cardPaddingY,
                width: cardWidth,
              }}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View
                  className="items-center justify-center rounded-[22px]"
                  style={{
                    backgroundColor: category.iconBackground,
                    height: cardIconSize,
                    width: cardIconSize,
                  }}
                >
                  <SymbolIcon
                    accessibilityLabel={category.title}
                    color={category.iconColor}
                    name={category.icon}
                    size={cardIconSymbolSize}
                  />
                </View>
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#F5F1FF]">
                  <SymbolIcon
                    accessibilityLabel="Open category"
                    color="#8F92A8"
                    name="chevron.right"
                    size={16}
                  />
                </View>
              </View>

              <Text
                adjustsFontSizeToFit
                className="mt-5 font-bold text-text-primary"
                minimumFontScale={0.8}
                numberOfLines={2}
                style={{
                  fontSize: cardTitleSize,
                  lineHeight: cardTitleLeading,
                }}
              >
                {category.title}
              </Text>
              <Text
                className="mt-2 font-semibold text-[#8F92A8]"
                numberOfLines={isNarrow ? 2 : 3}
                style={{
                  fontSize: cardDescriptionSize,
                  lineHeight: isNarrow ? 15 : 16,
                }}
              >
                {category.description}
              </Text>
              <Text
                className="mt-3 font-bold text-[#8F92A8]"
                style={{
                  fontSize: cardCountSize,
                  lineHeight: isNarrow ? 18 : 20,
                }}
              >
                {category.countLabel}
              </Text>

              {category.progressStatus ? (
                <View className="mt-3 gap-2">
                  <ProgressBar
                    color={category.iconColor}
                    progress={category.progressStatus.progress}
                  />
                  <Text
                    className="font-bold"
                    style={{
                      color: category.iconColor,
                      fontSize: cardProgressSize,
                      lineHeight: isNarrow ? 16 : 18,
                    }}
                  >
                    {category.progressDetail}
                  </Text>
                </View>
              ) : (
                <Text
                  className="mt-3 font-bold"
                  style={{
                    color: category.iconColor,
                    fontSize: cardProgressSize,
                    lineHeight: isNarrow ? 16 : 17,
                  }}
                >
                  {category.progressDetail}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {visibleCategories.length === 0 ? (
          <View
            className="mx-6 mt-8 items-center rounded-[28px] bg-white px-6 py-8"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <Text className="text-center text-[20px] font-bold leading-[26px] text-text-primary">
              No matching categories
            </Text>
            <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
              Try searching for interview, CV, skills, or career guidance.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
