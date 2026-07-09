import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
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
import { legalLinks } from "@/constants/legal";
import { achievements } from "@/data/achievements";
import { experienceLevels } from "@/data/experienceLevels";
import { careerMissions } from "@/data/missions";
import { targetRoles } from "@/data/roles";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";

const applicationsHref = "/applications" as Href;
const cvHref = "/cv" as Href;
const homeHref = "/home" as Href;
const signOutHref = "/sign-out" as Href;
const targetRoleHref = "/target-role" as Href;

type ProfileAction = {
  accent: string;
  background: string;
  href: Href;
  icon: SymbolIconName;
  subtitle: string;
  title: string;
};

type ExternalProfileAction = {
  accent: string;
  background: string;
  icon: SymbolIconName;
  subtitle: string;
  title: string;
  url: string;
};

const profileActions: ProfileAction[] = [
  {
    accent: colors.primary,
    background: colors.softPurple,
    href: targetRoleHref,
    icon: "target",
    subtitle: "Update your coaching plan",
    title: "Target role",
  },
  {
    accent: colors.energy,
    background: colors.softEnergy,
    href: cvHref,
    icon: "doc.text.fill",
    subtitle: "Review bullets and keywords",
    title: "CV Coach",
  },
  {
    accent: colors.blue,
    background: colors.softBlue,
    href: applicationsHref,
    icon: "briefcase.fill",
    subtitle: "Track roles and next steps",
    title: "Applications",
  },
];

const supportActions: ExternalProfileAction[] = [
  {
    accent: colors.primary,
    background: colors.softPurple,
    icon: "lock",
    subtitle: "How CareerFox handles your data",
    title: "Privacy Policy",
    url: legalLinks.privacyPolicyUrl,
  },
  {
    accent: colors.blue,
    background: colors.softBlue,
    icon: "doc.text",
    subtitle: "App rules and responsibilities",
    title: "Terms of Service",
    url: legalLinks.termsOfServiceUrl,
  },
  {
    accent: colors.energy,
    background: colors.softEnergy,
    icon: "envelope",
    subtitle: legalLinks.supportEmail,
    title: "Contact Support",
    url: legalLinks.supportMailto,
  },
];

const careerMissionIds = new Set(careerMissions.map((mission) => mission.id));

const formatCompactNumber = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }

  return String(value);
};

function ProfileMetric({
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
    <View className="min-h-[88px] flex-1 rounded-[22px] bg-white/15 px-3 py-4">
      <Text className="text-[20px] leading-[24px]">{icon}</Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 text-[21px] font-bold leading-[25px] text-white"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="text-[11px] font-bold leading-[15px] text-white/78"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="text-[10px] font-semibold leading-[14px] text-white/60"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {detail}
      </Text>
    </View>
  );
}

function Card({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View
      className="rounded-[24px] bg-white p-5"
      style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
    >
      <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
        {title}
      </Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}

function LoadingProfile() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F7F4FF] px-6">
      <View
        className="items-center rounded-[28px] bg-white px-8 py-9"
        style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text className="mt-5 text-center text-[17px] font-bold leading-[24px] text-text-primary">
          Loading your profile
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, user } = useUser();
  const { width } = useWindowDimensions();
  const [isResettingLocalState, setIsResettingLocalState] = useState(false);
  const clearApplicationTestingState = useApplicationStore(
    (state) => state.clearApplicationTestingState,
  );
  const clearCareerTestingState = useCareerStore(
    (state) => state.clearCareerTestingState,
  );
  const clearInterviewTestingState = useInterviewStore(
    (state) => state.clearInterviewTestingState,
  );
  const clearProgressTestingState = useProgressStore(
    (state) => state.clearProgressTestingState,
  );
  const selectedExperienceLevelId = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const selectedTargetRoleId = useCareerStore(
    (state) => state.selectedTargetRole,
  );
  const setupCompleted = useCareerStore((state) => state.setupCompleted);
  const coins = useProgressStore((state) => state.coins);
  const completedMissionIds = useProgressStore(
    (state) => state.completedMissionIds,
  );
  const readinessScore = useProgressStore((state) => state.readinessScore);
  const streak = useProgressStore((state) => state.streak);
  const unlockedAchievementIds = useProgressStore(
    (state) => state.unlockedAchievementIds,
  );
  const xp = useProgressStore((state) => state.xp);
  const isNarrow = width < 370;

  const selectedRole = useMemo(
    () => targetRoles.find((role) => role.id === selectedTargetRoleId) ?? null,
    [selectedTargetRoleId],
  );
  const selectedExperienceLevel = useMemo(
    () =>
      experienceLevels.find(
        (level) => level.id === selectedExperienceLevelId,
      ) ?? null,
    [selectedExperienceLevelId],
  );

  const userName =
    user?.fullName ??
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "CareerFox learner";
  const emailAddress =
    user?.primaryEmailAddress?.emailAddress ?? "No email linked";
  const completedMissions = useMemo(
    () =>
      new Set(
        completedMissionIds.filter((missionId) =>
          careerMissionIds.has(missionId),
        ),
      ).size,
    [completedMissionIds],
  );
  const missionCount = careerMissions.length;
  const missionProgress =
    missionCount === 0
      ? 0
      : Math.round((completedMissions / missionCount) * 100);
  const earnedBadges = unlockedAchievementIds.length;
  const profileCompleteness =
    (selectedRole ? 34 : 0) +
    (selectedExperienceLevel ? 33 : 0) +
    (setupCompleted ? 33 : 0);
  const nextAchievement =
    achievements.find(
      (achievement) => !unlockedAchievementIds.includes(achievement.id),
    ) ?? achievements[0];

  const openExternalAction = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  const resetLocalTestingState = async () => {
    if (isResettingLocalState) {
      return;
    }

    setIsResettingLocalState(true);

    try {
      await Promise.all([
        clearApplicationTestingState(),
        clearCareerTestingState(),
        clearInterviewTestingState(),
        clearProgressTestingState(),
      ]);
      router.replace(targetRoleHref);
    } finally {
      setIsResettingLocalState(false);
    }
  };

  if (!isLoaded) {
    return <LoadingProfile />;
  }

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: isNarrow ? 20 : 24,
          paddingTop: Math.max(insets.top - 20, 18),
          paddingBottom: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Back to home"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
            hitSlop={10}
            onPress={() => router.push(homeHref)}
          >
            <SymbolIcon color={colors.white} name="chevron.left" size={22} />
          </Pressable>

          <Pressable
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            className="min-h-10 flex-row items-center gap-2 rounded-full bg-white/16 px-3"
            onPress={() => router.push(signOutHref)}
          >
            <Text className="text-[12px] font-bold leading-[16px] text-white">
              Sign out
            </Text>
            <SymbolIcon color={colors.white} name="arrow.right" size={15} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
          <View className="mt-7 flex-row items-center gap-4">
            <View className="h-[76px] w-[76px] items-center justify-center rounded-full bg-white/18">
              {user?.imageUrl ? (
                <Image
                  accessibilityLabel="Profile photo"
                  contentFit="cover"
                  source={{ uri: user.imageUrl }}
                  style={{ borderRadius: 34, height: 68, width: 68 }}
                />
              ) : (
                <Image
                  accessibilityLabel="CareerFox mascot"
                  contentFit="contain"
                  source={images.careerFoxLogoMark}
                  style={{ height: 48, width: 48 }}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold leading-[20px] text-white/76">
                Career profile
              </Text>
              <Text
                adjustsFontSizeToFit
                className="mt-1 text-[28px] font-bold leading-[34px] text-white"
                minimumFontScale={0.7}
                numberOfLines={1}
              >
                {userName}
              </Text>
              <Text
                adjustsFontSizeToFit
                className="mt-1 text-[13px] font-semibold leading-[18px] text-white/68"
                minimumFontScale={0.72}
                numberOfLines={1}
              >
                {emailAddress}
              </Text>
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <ProfileMetric
              detail={`${completedMissions}/${missionCount} missions`}
              icon="📈"
              label="Ready"
              value={`${readinessScore}%`}
            />
            <ProfileMetric
              detail={`${earnedBadges} badges`}
              icon="🏅"
              label="XP"
              value={formatCompactNumber(xp)}
            />
            <ProfileMetric
              detail={`${formatCompactNumber(coins)} coins`}
              icon="🔥"
              label="Streak"
              value={`${streak}d`}
            />
          </View>
        </LinearGradient>

        <View
          className="-mt-4 gap-5"
          style={{ paddingHorizontal: isNarrow ? 20 : 24 }}
        >
          <Card title="Career focus">
            <View className="flex-row items-center gap-4">
              <View
                className="h-14 w-14 items-center justify-center rounded-[22px]"
                style={{
                  backgroundColor:
                    selectedRole?.iconBackground ?? colors.softPurple,
                }}
              >
                <SymbolIcon
                  color={selectedRole?.iconColor ?? colors.primary}
                  name={selectedRole?.icon ?? "target"}
                  size={27}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-bold leading-[23px] text-text-primary">
                  {selectedRole?.title ?? "Choose your target role"}
                </Text>
                <Text className="mt-1 text-[13px] font-semibold leading-[19px] text-[#8F92A8]">
                  {selectedExperienceLevel?.label ??
                    "Set your role so coaching feels personal."}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Change target role"
                accessibilityRole="button"
                className="min-h-10 items-center justify-center rounded-full bg-soft-purple px-4"
                onPress={() => router.push(targetRoleHref)}
              >
                <Text className="text-[12px] font-bold leading-[16px] text-primary">
                  Edit
                </Text>
              </Pressable>
            </View>

            <View className="mt-5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-bold leading-[18px] text-text-primary">
                  Profile setup
                </Text>
                <Text className="text-[13px] font-bold leading-[18px] text-primary">
                  {profileCompleteness}%
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-[#EEE9FF]">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </View>
            </View>
          </Card>

          <Card title="Career tools">
            <View className="gap-3">
              {profileActions.map((action) => (
                <Pressable
                  accessibilityLabel={action.title}
                  accessibilityRole="button"
                  className="min-h-[70px] flex-row items-center rounded-[18px] border border-[#F0ECFB] bg-white px-4"
                  key={action.title}
                  onPress={() => router.push(action.href)}
                >
                  <View
                    className="h-11 w-11 items-center justify-center rounded-[17px]"
                    style={{ backgroundColor: action.background }}
                  >
                    <SymbolIcon
                      color={action.accent}
                      name={action.icon}
                      size={21}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                      {action.title}
                    </Text>
                    <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                      {action.subtitle}
                    </Text>
                  </View>
                  <SymbolIcon color="#B8A5E8" name="chevron.right" size={19} />
                </Pressable>
              ))}
            </View>
          </Card>

          <View
            className="overflow-hidden rounded-[24px]"
            style={{ boxShadow: "0 12px 28px rgba(255, 111, 55, 0.18)" }}
          >
            <LinearGradient
              colors={["#FF633B", "#FF8C56"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={{ padding: 20 }}
            >
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white/18">
                  <SymbolIcon color={colors.white} name="sparkles" size={22} />
                </View>
                <View className="flex-1">
                  <Text className="text-[18px] font-bold leading-[24px] text-white">
                    Next badge
                  </Text>
                  <Text className="mt-1 text-[14px] font-bold leading-[20px] text-white">
                    {nextAchievement.title}
                  </Text>
                  <Text className="mt-1 text-[12px] font-semibold leading-[18px] text-white/80">
                    {nextAchievement.description}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Card title="Mission progress">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[14px] font-bold leading-[19px] text-text-primary">
                Daily coaching plan
              </Text>
              <Text className="text-[14px] font-bold leading-[19px] text-success">
                {missionProgress}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-[#EEE9FF]">
              <View
                className="h-full rounded-full bg-success"
                style={{ width: `${missionProgress}%` }}
              />
            </View>
            <Text className="mt-3 text-[13px] font-semibold leading-[20px] text-[#8F92A8]">
              {completedMissions} of {missionCount} focused missions completed.
            </Text>
          </Card>

          <Card title="Privacy and support">
            <View className="gap-3">
              {supportActions.map((action) => (
                <Pressable
                  accessibilityLabel={action.title}
                  accessibilityRole="button"
                  className="min-h-[70px] flex-row items-center rounded-[18px] border border-[#F0ECFB] bg-white px-4"
                  key={action.title}
                  onPress={() => openExternalAction(action.url)}
                >
                  <View
                    className="h-11 w-11 items-center justify-center rounded-[17px]"
                    style={{ backgroundColor: action.background }}
                  >
                    <SymbolIcon
                      color={action.accent}
                      name={action.icon}
                      size={21}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                      {action.title}
                    </Text>
                    <Text className="mt-0.5 text-[12px] font-semibold leading-[16px] text-[#8F92A8]">
                      {action.subtitle}
                    </Text>
                  </View>
                  <SymbolIcon color="#B8A5E8" name="chevron.right" size={19} />
                </Pressable>
              ))}
            </View>
          </Card>

          {__DEV__ ? (
            <Card title="Developer tools">
              <Pressable
                accessibilityLabel="Reset local testing state"
                accessibilityRole="button"
                className="min-h-[58px] flex-row items-center justify-center rounded-[18px] bg-soft-error px-4"
                disabled={isResettingLocalState}
                onPress={() => void resetLocalTestingState()}
                style={{ opacity: isResettingLocalState ? 0.72 : 1 }}
              >
                {isResettingLocalState ? (
                  <ActivityIndicator color={colors.error} size="small" />
                ) : (
                  <Text className="text-[14px] font-bold leading-[19px] text-error">
                    Reset local testing state
                  </Text>
                )}
              </Pressable>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
