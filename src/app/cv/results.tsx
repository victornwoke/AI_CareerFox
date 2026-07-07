import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { trackCvAnalysisCompleted } from "@/lib/analytics";

type ScoreMetric = {
  color: string;
  label: string;
  score: number;
};

type ActionItem = {
  icon: SymbolIconName;
  text: string;
};

const fallbackKeywordGaps = [
  "role-specific tools",
  "measurable outcomes",
  "collaboration keywords",
  "delivery scope",
];

const weakBullets = [
  "Responsible for improving website and working with the team.",
  "Helped with customer reports and completed tasks on time.",
  "Worked on projects using different tools and technologies.",
];

const improvedBullets = [
  "Improved onboarding page completion by clarifying error states and reducing repeated support questions.",
  "Built weekly customer reports that highlighted activation risks and helped managers prioritize follow-ups.",
  "Shipped project updates across design, engineering, and QA while documenting decisions for future releases.",
];

const recommendedActions: ActionItem[] = [
  {
    icon: "target",
    text: "Rewrite three experience bullets with action, scope, and measurable result.",
  },
  {
    icon: "magnifyingglass",
    text: "Mirror only honest keywords from the job description in your summary and skills.",
  },
  {
    icon: "star.fill",
    text: "Move your strongest role-matching proof into the first third of the CV.",
  },
];

const metrics: ScoreMetric[] = [
  {
    color: colors.success,
    label: "Summary quality",
    score: 72,
  },
  {
    color: colors.energy,
    label: "Impact score",
    score: 64,
  },
  {
    color: colors.primary,
    label: "Clarity score",
    score: 81,
  },
];

function ProgressBar({
  color,
  progress,
}: {
  color: string;
  progress: number;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View className="h-2 overflow-hidden rounded-full bg-[#EEE9FF]">
      <View
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${clampedProgress}%` }}
      />
    </View>
  );
}

function ResultSection({
  children,
  title,
}: {
  children: ReactNode;
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
      <View className="mt-4 gap-3">{children}</View>
    </View>
  );
}

function BulletItem({
  background = colors.softPurple,
  children,
  icon = "checkmark.circle.fill",
  iconColor = colors.primary,
}: {
  background?: string;
  children: ReactNode;
  icon?: SymbolIconName;
  iconColor?: string;
}) {
  return (
    <View
      className="flex-row items-start rounded-[18px] px-4 py-4"
      style={{ backgroundColor: background }}
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-white">
        <SymbolIcon color={iconColor} name={icon} size={17} />
      </View>
      <Text className="ml-3 flex-1 text-[13px] font-semibold leading-[20px] text-text-primary">
        {children}
      </Text>
    </View>
  );
}

export default function CvResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { hasJobDescription, roleId } = useLocalSearchParams<{
    hasJobDescription?: string;
    roleId?: string;
  }>();
  const selectedRole = targetRoles.find((role) => role.id === roleId) ?? null;
  const keywordGaps = selectedRole
    ? selectedRole.popularKeywords.slice(0, 4)
    : fallbackKeywordGaps;
  const hasJobDescriptionSource = hasJobDescription === "true";
  const isNarrow = width < 370;

  useEffect(() => {
    trackCvAnalysisCompleted({
      atsKeywordGapCount: keywordGaps.length,
      hasJobDescription: hasJobDescriptionSource,
      score: 74,
      targetRoleId: roleId ?? null,
    });
  }, [hasJobDescriptionSource, keywordGaps.length, roleId]);

  return (
    <View className="flex-1 bg-white">
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
            borderBottomLeftRadius: 46,
            borderBottomRightRadius: 46,
            paddingBottom: 34,
            paddingHorizontal: isNarrow ? 20 : 24,
            paddingTop: Math.max(insets.top - 20, 18),
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Go back to CV Coach"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/18"
              hitSlop={10}
              onPress={() => router.back()}
            >
              <SymbolIcon color={colors.white} name="chevron.left" size={22} />
            </Pressable>

            <View className="flex-row items-center gap-2 rounded-full bg-white/16 px-3 py-2">
              <SymbolIcon color={colors.white} name="doc.text.fill" size={15} />
              <Text className="text-[12px] font-bold leading-[16px] text-white">
                Mock analysis
              </Text>
            </View>
          </View>

          <View className="mt-7 flex-row items-end justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[15px] font-bold leading-[20px] text-white/76">
                Overall CV score
              </Text>
              <Text className="mt-2 text-[54px] font-bold leading-[60px] text-white">
                74%
              </Text>
              <Text className="mt-2 text-[15px] font-semibold leading-[22px] text-white/76">
                Good base for {selectedRole?.title ?? "your target role"}, with
                stronger impact bullets needed.
              </Text>
            </View>

            <View className="h-[104px] w-[104px] items-center justify-center rounded-full bg-white/16">
              <View className="h-[76px] w-[76px] items-center justify-center rounded-full bg-white">
                <SymbolIcon color={colors.primary} name="sparkles" size={32} />
              </View>
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            {metrics.map((metric) => (
              <View
                className="min-h-[86px] flex-1 rounded-[22px] bg-white/15 px-3 py-4"
                key={metric.label}
              >
                <Text className="text-[23px] font-bold leading-[28px] text-white">
                  {metric.score}%
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-1 text-[12px] font-bold leading-[16px] text-white/78"
                  minimumFontScale={0.72}
                  numberOfLines={2}
                >
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View
          className="-mt-4 gap-5"
          style={{ paddingHorizontal: isNarrow ? 20 : 24 }}
        >
          <ResultSection title="Score breakdown">
            {metrics.map((metric) => (
              <View key={metric.label}>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-[14px] font-bold leading-[18px] text-text-primary">
                    {metric.label}
                  </Text>
                  <Text
                    className="text-[14px] font-bold leading-[18px]"
                    style={{ color: metric.color }}
                  >
                    {metric.score}%
                  </Text>
                </View>
                <ProgressBar color={metric.color} progress={metric.score} />
              </View>
            ))}
          </ResultSection>

          <ResultSection title="ATS keyword gaps">
            <View className="flex-row flex-wrap gap-2">
              {keywordGaps.map((keyword) => (
                <View
                  className="min-h-[40px] justify-center rounded-full border border-[#E9E0FF] bg-soft-purple px-4"
                  key={keyword}
                >
                  <Text className="text-[12px] font-bold leading-[16px] text-primary">
                    {keyword}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="text-[13px] font-semibold leading-[20px] text-[#8F92A8]">
              {hasJobDescriptionSource
                ? "These are matched against the supplied job description. Add them only where they honestly reflect your experience."
                : "Add a job description next time to make these gaps more specific to the role."}
            </Text>
          </ResultSection>

          <ResultSection title="Weak bullet points">
            {weakBullets.map((bullet) => (
              <BulletItem
                background={colors.softEnergy}
                icon="bolt.fill"
                iconColor={colors.energy}
                key={bullet}
              >
                {bullet}
              </BulletItem>
            ))}
          </ResultSection>

          <ResultSection title="Improved bullet suggestions">
            {improvedBullets.map((bullet) => (
              <BulletItem
                background={colors.softSuccess}
                iconColor={colors.success}
                key={bullet}
              >
                {bullet}
              </BulletItem>
            ))}
          </ResultSection>

          <ResultSection title="Recommended next actions">
            {recommendedActions.map((action, index) => (
              <View
                className="flex-row items-start rounded-[18px] bg-[#F8F6FF] px-4 py-4"
                key={action.text}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                  <Text className="text-[13px] font-bold leading-[17px] text-primary">
                    {index + 1}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <View className="mb-1 flex-row items-center gap-2">
                    <SymbolIcon color={colors.primary} name={action.icon} size={15} />
                    <Text className="text-[13px] font-bold leading-[18px] text-primary">
                      Next step
                    </Text>
                  </View>
                  <Text className="text-[13px] font-semibold leading-[20px] text-text-primary">
                    {action.text}
                  </Text>
                </View>
              </View>
            ))}
          </ResultSection>

          <Pressable
            accessibilityLabel="Analyse another CV"
            accessibilityRole="button"
            className="min-h-[58px] items-center justify-center rounded-[18px] bg-white"
            onPress={() => router.back()}
            style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
          >
            <Text className="text-[15px] font-bold leading-[20px] text-primary">
              Analyse another CV
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
