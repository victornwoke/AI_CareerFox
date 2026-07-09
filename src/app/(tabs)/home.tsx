import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
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
import { careerMissions } from "@/data/missions";
import { targetRoles } from "@/data/roles";
import { trackDailyMissionStarted } from "@/lib/analytics";
import { useCareerStore } from "@/store/useCareerStore";
import { useProgressStore } from "@/store/useProgressStore";
import type { CareerMission } from "@/types/career";

const coachHref = "/coach" as Href;
const learnHref = "/learn" as Href;
const applicationsHref = "/applications" as Href;
const cvHref = "/cv" as Href;
const profileHref = "/profile" as Href;
const progressHref = "/progress" as Href;
const targetRoleHref = "/target-role" as Href;

type QuickAction = {
  accent: string;
  background: string;
  href: Href;
  icon: SymbolIconName;
  title: string;
};

type PlanTaskId = "mock-interview" | "improve-cv" | "job-search";

type PlanTask = {
  accent: string;
  background: string;
  href: Href;
  icon: SymbolIconName;
  id: PlanTaskId;
  subtitle: string;
  title: string;
};

type RecentActivity = {
  accent: string;
  background: string;
  detail: string;
  title: string;
};

const quickActions: QuickAction[] = [
  {
    accent: colors.primary,
    background: "#EEE9FF",
    href: coachHref,
    icon: "mic.fill",
    title: "Interview\nPractice",
  },
  {
    accent: colors.energy,
    background: "#FFF0E0",
    href: coachHref,
    icon: "message.fill",
    title: "Behavioral\nQuestions",
  },
  {
    accent: colors.success,
    background: "#E9F9F0",
    href: learnHref,
    icon: "book.closed",
    title: "Learning\nPaths",
  },
  {
    accent: colors.blue,
    background: "#EEF5FF",
    href: progressHref,
    icon: "chart.bar.fill",
    title: "My\nProgress",
  },
];

const todayPlan: PlanTask[] = [
  {
    accent: colors.primary,
    background: "#EEE9FF",
    href: coachHref,
    icon: "mic.fill",
    id: "mock-interview",
    subtitle: "Practise one answer",
    title: "Mock Interview",
  },
  {
    accent: colors.energy,
    background: "#FFF0E0",
    href: cvHref,
    icon: "doc.text.fill",
    id: "improve-cv",
    subtitle: "Polish one bullet",
    title: "Improve CV",
  },
  {
    accent: colors.success,
    background: "#E9F9F0",
    href: applicationsHref,
    icon: "briefcase.fill",
    id: "job-search",
    subtitle: "Save one target job",
    title: "Job Search",
  },
];

const formatCompactNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }

  return String(value);
};

const getDailyMission = (
  missions: CareerMission[],
  completedMissionIds: string[],
) =>
  missions.find((mission) => !completedMissionIds.includes(mission.id)) ?? null;

const getMissionHref = (mission: CareerMission) => {
  if (mission.category === "applications") {
    return applicationsHref;
  }

  if (mission.category === "interview") {
    return coachHref;
  }

  if (mission.category === "cv") {
    return cvHref;
  }

  return learnHref;
};

const getPlanTaskId = (mission: CareerMission): PlanTaskId => {
  if (mission.category === "interview") {
    return "mock-interview";
  }

  if (mission.category === "applications") {
    return "job-search";
  }

  return "improve-cv";
};

function ProgressBar({
  color,
  progress,
  trackColor = "rgba(255, 255, 255, 0.28)",
}: {
  color: string;
  progress: number;
  trackColor?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      className="h-[5px] overflow-hidden rounded-full"
      style={{ backgroundColor: trackColor }}
    >
      <View
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${clampedProgress}%` }}
      />
    </View>
  );
}

function StatCard({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-[105px] flex-1 rounded-[22px] bg-white/15 px-3 py-4">
      <Text className="text-[20px] leading-[24px]">{icon}</Text>
      <Text
        adjustsFontSizeToFit
        className="mt-2 text-[20px] font-bold leading-[24px] text-white"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="text-[12px] font-bold leading-[16px] text-white/85"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="text-[11px] font-semibold leading-[15px] text-white/65"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {detail}
      </Text>
    </View>
  );
}

function LoadingHome() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F7F4FF] px-6">
      <View
        className="items-center rounded-[28px] bg-white px-8 py-9"
        style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text className="mt-5 text-center text-[17px] font-bold leading-[24px] text-text-primary">
          Preparing your dashboard
        </Text>
        <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
          Loading your coaching progress.
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, user } = useUser();
  const { width } = useWindowDimensions();
  const selectedTargetRole = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const completedMissionIds = useProgressStore(
    (state) => state.completedMissionIds,
  );
  const coins = useProgressStore((state) => state.coins);
  const readinessScore = useProgressStore((state) => state.readinessScore);
  const streak = useProgressStore((state) => state.streak);
  const xp = useProgressStore((state) => state.xp);
  const isNarrow = width < 370;

  const userName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "career builder";
  const dailyMission = useMemo(
    () => getDailyMission(careerMissions, completedMissionIds),
    [completedMissionIds],
  );
  const completedCount = completedMissionIds.length;
  const totalMissions = careerMissions.length;
  const missionProgress =
    totalMissions === 0
      ? 0
      : Math.round((completedCount / totalMissions) * 100);
  const currentMissionProgress = dailyMission
    ? completedMissionIds.includes(dailyMission.id)
      ? 100
      : missionProgress
    : 0;
  const recentActivities = careerMissions
    .filter((mission) => completedMissionIds.includes(mission.id))
    .slice(0, 2)
    .map(
      (mission, index): RecentActivity => ({
        accent: index === 0 ? colors.success : colors.primary,
        background: index === 0 ? "#E9F9F0" : "#EEE9FF",
        detail: `${mission.category} • ${mission.xp} XP reward`,
        title: mission.title,
      }),
    );
  const completedPlanIds = new Set<PlanTaskId>(
    careerMissions
      .filter((mission) => completedMissionIds.includes(mission.id))
      .map(getPlanTaskId),
  );
  const selectedRole = targetRoles.find(
    (role) => role.id === selectedTargetRole,
  );
  const nextMission =
    careerMissions.find(
      (mission) =>
        !completedMissionIds.includes(mission.id) &&
        (mission.category === "interview" || mission.category === "cv"),
    ) ?? dailyMission;
  const nextUpHref = nextMission
    ? getMissionHref(nextMission)
    : selectedRole
      ? coachHref
      : targetRoleHref;
  const nextUpTitle = nextMission
    ? nextMission.title
    : selectedRole
      ? `${selectedRole.title} practice`
      : "Choose your target role";
  const nextUpSubtitle = selectedRole
    ? selectedRole.title
    : "Personalize your coaching plan";

  const startDailyMission = (mission: CareerMission, source: string) => {
    trackDailyMissionStarted({
      missionCategory: mission.category,
      missionId: mission.id,
      missionXp: mission.xp,
      source,
    });
    router.push(getMissionHref(mission));
  };

  if (!isLoaded) {
    return <LoadingHome />;
  }

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: isNarrow ? 20 : 24,
          paddingTop: Math.max(insets.top - 8, 24),
          paddingBottom: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row flex-1 items-center gap-3">
            <Pressable
              accessibilityLabel="Open profile"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
              hitSlop={10}
              onPress={() => router.push(profileHref)}
            >
              <Image
                accessibilityLabel="CareerFox mascot"
                contentFit="contain"
                source={images.careerFoxLogoMark}
                style={{ height: 25, width: 25 }}
              />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold leading-[17px] text-white/72">
                Good morning,
              </Text>
              <Text
                adjustsFontSizeToFit
                className="text-[17px] font-bold leading-[22px] text-white"
                minimumFontScale={0.72}
                numberOfLines={1}
              >
                {userName}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 rounded-full bg-white/16 px-2.5 py-1.5">
            <SymbolIcon
              accessibilityLabel="Streak"
              color="#FFB84A"
              name="flame.fill"
              size={14}
            />
            <Text className="text-[12px] font-bold leading-[15px] text-white">
              {streak}d
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.primary}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: 48,
            borderBottomRightRadius: 48,
            paddingBottom: 32,
            paddingHorizontal: isNarrow ? 20 : 24,
            paddingTop: 8,
          }}
        >
          <View className="mt-5 flex-row gap-3">
            <StatCard
              detail={`${completedCount}/${totalMissions} done`}
              icon="🔥"
              label="Day Streak"
              value={String(streak)}
            />
            <StatCard
              detail={`${formatCompactNumber(coins)} coins`}
              icon="🪙"
              label="Total XP"
              value={formatCompactNumber(xp)}
            />
            <StatCard
              detail="CV score"
              icon="📈"
              label="Readiness"
              value={`${readinessScore}%`}
            />
          </View>
        </LinearGradient>

        <View
          className="-mt-3 gap-6"
          style={{ paddingHorizontal: isNarrow ? 20 : 24 }}
        >
          {dailyMission ? (
            <Pressable
              accessibilityLabel={`Start daily mission: ${dailyMission.title}`}
              accessibilityRole="button"
              className="overflow-hidden rounded-[22px]"
              onPress={() => startDailyMission(dailyMission, "daily_card")}
              style={{ boxShadow: "0 16px 32px rgba(255, 111, 55, 0.22)" }}
            >
              <LinearGradient
                colors={["#FF633B", "#FF8C56"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={{
                  minHeight: 90,
                  paddingHorizontal: isNarrow ? 16 : 18,
                  paddingVertical: 17,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <SymbolIcon
                        accessibilityLabel="Daily Mission"
                        color={colors.white}
                        name="bolt.fill"
                        size={17}
                      />
                      <Text className="text-[14px] font-bold leading-[18px] text-white">
                        Daily Mission
                      </Text>
                    </View>
                    <Text
                      adjustsFontSizeToFit
                      className="mt-2 text-[16px] font-bold leading-[20px] text-white"
                      minimumFontScale={0.72}
                      numberOfLines={1}
                    >
                      {dailyMission.title}
                    </Text>
                    <Text className="mt-1 text-[13px] font-bold leading-[17px] text-white/86">
                      +{dailyMission.xp} XP • {completedCount}/{totalMissions}{" "}
                      missions
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-white/18">
                      <SymbolIcon
                        accessibilityLabel="Mission reward"
                        color={colors.white}
                        name="trophy.fill"
                        size={19}
                      />
                    </View>
                    <View className="min-h-9 items-center justify-center rounded-full bg-white px-5">
                      <Text className="text-[15px] font-bold leading-[19px] text-[#F35F1D]">
                        Start
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center gap-3">
                  <View className="flex-1">
                    <ProgressBar
                      color={colors.white}
                      progress={currentMissionProgress}
                    />
                  </View>
                  <Text className="text-[11px] font-bold leading-[15px] text-white/80">
                    {currentMissionProgress}%
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View
              className="rounded-[22px] bg-white p-5"
              style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
            >
              <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                {totalMissions > 0
                  ? "Daily missions complete"
                  : "No missions yet"}
              </Text>
              <Text className="mt-1 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                {totalMissions > 0
                  ? `${completedCount}/${totalMissions} missions completed.`
                  : "New daily coaching missions will appear here."}
              </Text>
            </View>
          )}

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                Quick Practice
              </Text>
              <Pressable
                accessibilityLabel="View all learning activities"
                accessibilityRole="link"
                hitSlop={12}
                onPress={() => router.push(learnHref)}
              >
                <Text className="text-[13px] font-bold leading-[18px] text-primary">
                  View all
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row flex-wrap gap-3">
              {quickActions.map((item) => (
                <Pressable
                  accessibilityLabel={item.title.replace("\n", " ")}
                  accessibilityRole="button"
                  className="min-h-[76px] flex-row items-center rounded-[16px] bg-white px-4"
                  key={item.title}
                  onPress={() => router.push(item.href)}
                  style={{
                    boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)",
                    width: (width - (isNarrow ? 40 : 48) - 12) / 2,
                  }}
                >
                  <View
                    className="h-11 w-11 items-center justify-center rounded-[18px]"
                    style={{ backgroundColor: item.background }}
                  >
                    <SymbolIcon
                      accessibilityLabel={item.title}
                      color={item.accent}
                      name={item.icon}
                      size={22}
                    />
                  </View>
                  <Text
                    adjustsFontSizeToFit
                    className="ml-3 flex-1 text-[14px] font-bold leading-[18px] text-text-primary"
                    minimumFontScale={0.78}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                Today&apos;s Plan
              </Text>
              <Pressable
                accessibilityLabel="View all plan items"
                accessibilityRole="link"
                hitSlop={12}
                onPress={() => router.push(learnHref)}
              >
                <Text className="text-[13px] font-bold leading-[18px] text-primary">
                  View all
                </Text>
              </Pressable>
            </View>

            <View
              className="mt-4 overflow-hidden rounded-[18px] bg-white"
              style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
            >
              {todayPlan.map((item, index) => {
                const isComplete = completedPlanIds.has(item.id);

                return (
                  <Pressable
                    accessibilityLabel={item.title}
                    accessibilityRole="button"
                    className="min-h-[62px] flex-row items-center px-4"
                    key={item.id}
                    onPress={() => router.push(item.href)}
                    style={{
                      borderBottomColor: "#F0ECFB",
                      borderBottomWidth: index === todayPlan.length - 1 ? 0 : 1,
                    }}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-[16px]"
                      style={{ backgroundColor: item.background }}
                    >
                      <SymbolIcon
                        accessibilityLabel={item.title}
                        color={item.accent}
                        name={item.icon}
                        size={20}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                        {item.title}
                      </Text>
                      <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                        {item.subtitle}
                      </Text>
                    </View>
                    <View
                      className="h-7 w-7 items-center justify-center rounded-full border-[2px]"
                      style={{
                        backgroundColor: isComplete
                          ? colors.success
                          : colors.white,
                        borderColor: isComplete ? colors.success : "#E4DDFB",
                      }}
                    >
                      <SymbolIcon
                        accessibilityLabel={isComplete ? "Completed" : "Open"}
                        color={isComplete ? colors.white : "#B7AED8"}
                        name={isComplete ? "checkmark" : "circle"}
                        size={14}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
              Recent Activity
            </Text>

            <View
              className="mt-4 overflow-hidden rounded-[18px] bg-white"
              style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
            >
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View
                    className="min-h-[61px] flex-row items-center px-4"
                    key={`${activity.title}-${activity.detail}`}
                    style={{
                      borderBottomColor: "#F0ECFB",
                      borderBottomWidth:
                        index === recentActivities.length - 1 ? 0 : 1,
                    }}
                  >
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: activity.background }}
                    >
                      <SymbolIcon
                        accessibilityLabel="Activity complete"
                        color={activity.accent}
                        name="checkmark.circle"
                        size={20}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        adjustsFontSizeToFit
                        className="text-[14px] font-bold leading-[18px] text-text-primary"
                        minimumFontScale={0.78}
                        numberOfLines={1}
                      >
                        {activity.title}
                      </Text>
                      <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                        {activity.detail}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="min-h-[72px] justify-center px-4">
                  <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                    No recent activity yet
                  </Text>
                  <Text className="mt-1 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                    Complete a mission to see it here.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View
            className="rounded-[18px] bg-white p-4"
            style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
          >
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-[18px] bg-[#EEE9FF]">
                <Image
                  accessibilityLabel="CareerFox coach"
                  contentFit="contain"
                  source={images.careerFoxCoach}
                  style={{ height: 38, width: 38 }}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-bold uppercase leading-[17px] text-primary">
                  Next Up
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-0.5 text-[15px] font-bold leading-[20px] text-text-primary"
                  minimumFontScale={0.78}
                  numberOfLines={1}
                >
                  {nextUpTitle}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]"
                  minimumFontScale={0.78}
                  numberOfLines={1}
                >
                  {nextUpSubtitle}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Start next mission"
              accessibilityRole="button"
              className="mt-4 min-h-10 overflow-hidden rounded-full"
              onPress={() => {
                if (nextMission) {
                  startDailyMission(nextMission, "next_up_card");
                  return;
                }

                router.push(nextUpHref);
              }}
              style={{ boxShadow: "0 10px 20px rgba(108, 78, 245, 0.18)" }}
            >
              <LinearGradient
                colors={gradients.primary}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={{
                  alignItems: "center",
                  flex: 1,
                  justifyContent: "center",
                  minHeight: 40,
                }}
              >
                <Text className="text-[14px] font-bold leading-[18px] text-white">
                  Start Next
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
