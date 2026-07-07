import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { experienceLevels } from "@/data/experienceLevels";
import {
  interviewQuestionBankCounts,
  learningCategories,
} from "@/data/interviewCategories";
import { interviewQuestions } from "@/data/interviewQuestions";
import { careerMissions } from "@/data/missions";
import { targetRoles } from "@/data/roles";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useCareerStore } from "@/store/useCareerStore";
import { useProgressStore } from "@/store/useProgressStore";
import type {
  CareerMission,
  InterviewCategory,
  InterviewQuestion,
  LearningCategory,
  TargetRole,
} from "@/types/career";

const applicationsHref = "/applications" as Href;
const cvHref = "/cv" as Href;
const interviewHref = "/interview" as Href;
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

function ProgressBar({
  color,
  progress,
}: {
  color: string;
  progress: number;
}) {
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
  if (category.destination === "applications") {
    return applicationsHref;
  }

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const selectedExperienceLevelId = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const selectedTargetRoleId = useCareerStore((state) => state.selectedTargetRole);
  const completedMissionIds = useProgressStore(
    (state) => state.completedMissionIds,
  );
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 20 : 24;
  const cardGap = 12;
  const cardWidth = (width - horizontalPadding * 2 - cardGap) / 2;
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
      case: getQuestionBankCount({
        category: "case",
        experienceLevelId: selectedExperienceLevelId,
        roleCategory,
      }),
      hr: getQuestionBankCount({
        category: "hr",
        experienceLevelId: selectedExperienceLevelId,
        roleCategory,
      }),
      technical: getQuestionBankCount({
        category: "technical",
        experienceLevelId: selectedExperienceLevelId,
        roleCategory,
      }),
    } satisfies Record<InterviewCategory["id"], number>;
  }, [selectedExperienceLevelId, selectedRole?.category]);
  const totalInterviewBankCount = Object.values(bankCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const getProgressForQuestions = useCallback(
    (
      category: InterviewCategory["id"],
      total: number,
    ): CategoryProgress => {
      const completed = roleQuestions.filter(
        (question) =>
          question.category === category && completedQuestionIdSet.has(question.id),
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
    const applicationProgress = getProgressForMissions(["applications"]);
    const skillsProgress = getProgressForMissions(["skills"]);
    const selectedRoleLabel = selectedRole?.title ?? "your target role";
    const selectedLevelLabel = selectedExperienceLevel?.label ?? "all levels";
    const behavioralProgress = getProgressForQuestions(
      "behavioral",
      bankCounts.behavioral,
    );
    const caseProgress = getProgressForQuestions("case", bankCounts.case);
    const hrProgress = getProgressForQuestions("hr", bankCounts.hr);
    const technicalProgress = getProgressForQuestions(
      "technical",
      bankCounts.technical,
    );
    const completedInterviewQuestions =
      behavioralProgress.completed +
      caseProgress.completed +
      hrProgress.completed +
      technicalProgress.completed;
    const interviewQuestionProgress = {
      completed: completedInterviewQuestions,
      progress:
        totalInterviewBankCount === 0
          ? 0
          : Math.round((completedInterviewQuestions / totalInterviewBankCount) * 100),
      total: totalInterviewBankCount,
    };

    return learningCategories.map((category) => {
      if (category.id === "interview-practice") {
        return {
          ...category,
          countLabel: `${totalInterviewBankCount}+ questions`,
          progressDetail: `${interviewQuestionProgress.completed}/${interviewQuestionProgress.total}+ practised`,
          progressStatus: interviewQuestionProgress,
        };
      }

      if (category.id === "resume-cv") {
        return {
          ...category,
          countLabel: pluralize(cvProgress.total, "CV task"),
          progressDetail: `${cvProgress.completed}/${cvProgress.total} CV tasks complete`,
          progressStatus: cvProgress,
        };
      }

      if (category.id === "skills-knowledge") {
        return {
          ...category,
          countLabel: selectedRole
            ? pluralize(selectedRole.popularKeywords.length, "role skill")
            : "Choose role",
          progressDetail: `${skillsProgress.completed}/${skillsProgress.total} skill tasks complete`,
          progressStatus: skillsProgress,
        };
      }

      if (category.id === "career-guidance") {
        return {
          ...category,
          countLabel: selectedExperienceLevel
            ? `${selectedExperienceLevel.label} plan`
            : "Choose level",
          progressDetail: selectedExperienceLevel
            ? `${selectedRoleLabel} guidance for ${selectedLevelLabel}`
            : "Select your experience level",
          progressStatus: null,
        };
      }

      if (category.id === "job-search") {
        return {
          ...category,
          countLabel: pluralize(applicationProgress.total, "job task"),
          progressDetail: `${applicationProgress.completed}/${applicationProgress.total} job tasks complete`,
          progressStatus: applicationProgress,
        };
      }

      if (category.id === "hr-interviews") {
        return {
          ...category,
          countLabel: `${bankCounts.hr}+ questions`,
          progressDetail: `${hrProgress.completed}/${hrProgress.total}+ practised`,
          progressStatus: hrProgress,
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

      if (category.id === "case-interviews") {
        return {
          ...category,
          countLabel: `${bankCounts.case}+ questions`,
          progressDetail: `${caseProgress.completed}/${caseProgress.total}+ practised`,
          progressStatus: caseProgress,
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
      <ScrollView
        className="flex-1 bg-[#F6F2FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28,
        }}
        contentInsetAdjustmentBehavior="automatic"
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
            paddingTop: insets.top + 12,
          }}
        >
          <Text className="text-[26px] font-bold leading-[32px] text-white">
            Learning Categories
          </Text>
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
              className="rounded-[28px] bg-white px-4 py-5"
              key={category.id}
              onPress={() => router.push(getCategoryHref(category))}
              style={{
                borderCurve: "continuous",
                boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)",
                minHeight: 204,
                width: cardWidth,
              }}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View
                  className="h-[56px] w-[56px] items-center justify-center rounded-[22px]"
                  style={{ backgroundColor: category.iconBackground }}
                >
                  <SymbolIcon
                    accessibilityLabel={category.title}
                    color={category.iconColor}
                    name={category.icon}
                    size={28}
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
                className="mt-6 text-[22px] font-bold leading-[26px] text-text-primary"
                minimumFontScale={0.78}
                numberOfLines={2}
              >
                {category.title}
              </Text>
              <Text
                className="mt-2 text-[12px] font-semibold leading-[16px] text-[#8F92A8]"
                numberOfLines={3}
              >
                {category.description}
              </Text>
              <Text className="mt-3 text-[15px] font-bold leading-[20px] text-[#8F92A8]">
                {category.countLabel}
              </Text>

              {category.progressStatus ? (
                <View className="mt-3 gap-2">
                  <ProgressBar
                    color={category.iconColor}
                    progress={category.progressStatus.progress}
                  />
                  <Text
                    className="text-[14px] font-bold leading-[18px]"
                    style={{ color: category.iconColor }}
                  >
                    {category.progressDetail}
                  </Text>
                </View>
              ) : (
                <Text
                  className="mt-3 text-[13px] font-bold leading-[17px]"
                  style={{ color: category.iconColor }}
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
              Try searching for interview, CV, skills, or job search.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
