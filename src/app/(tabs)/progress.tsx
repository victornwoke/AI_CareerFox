import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { interviewQuestions } from "@/data/interviewQuestions";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";

type ProgressStatCardProps = {
  detail: string;
  label: string;
  value: string;
};

type BarDatum = {
  day: string;
  height: number;
};

type CategoryRowProps = {
  color: string;
  label: string;
  value: number;
};

const fallbackQuestionBars: BarDatum[] = [
  { day: "Mon", height: 76 },
  { day: "Tue", height: 114 },
  { day: "Wed", height: 48 },
  { day: "Thu", height: 142 },
  { day: "Fri", height: 94 },
  { day: "Sat", height: 170 },
  { day: "Sun", height: 66 },
];

const trendSegments = [
  { left: 0, rotate: -22, top: 72, width: 58 },
  { left: 50, rotate: -14, top: 57, width: 58 },
  { left: 100, rotate: 14, top: 58, width: 54 },
  { left: 144, rotate: 31, top: 72, width: 44 },
];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

function ProgressStatCard({ detail, label, value }: ProgressStatCardProps) {
  return (
    <View className="h-[76px] flex-1 items-center justify-center rounded-[18px] bg-white/16 px-2">
      <Text
        adjustsFontSizeToFit
        className="text-center text-[28px] font-bold leading-[34px] text-white"
        minimumFontScale={0.72}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="text-center text-[13px] font-semibold leading-[18px] text-white/85"
        minimumFontScale={0.75}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 text-center text-[11px] font-semibold leading-[14px] text-white/62"
        minimumFontScale={0.75}
        numberOfLines={1}
      >
        {detail}
      </Text>
    </View>
  );
}

function ChartCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View
      className="rounded-[24px] bg-white px-4 py-6"
      style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.05)" }}
    >
      <Text className="text-[22px] font-bold leading-[28px] text-[#17172B]">
        {title}
      </Text>
      {children}
    </View>
  );
}

function DashedGridLine({ top }: { top: number }) {
  return (
    <View
      className="absolute left-0 right-0 border-t border-dashed border-[#E6E2FF]"
      style={{ top }}
    />
  );
}

function QuestionsChart({ data }: { data: BarDatum[] }) {
  return (
    <View className="relative mt-6 h-[220px]">
      <DashedGridLine top={18} />
      <DashedGridLine top={88} />
      <DashedGridLine top={158} />

      <View className="absolute bottom-8 left-0 right-0 flex-row items-end justify-between px-2">
        {data.map((item) => (
          <View className="w-[40px] items-center" key={item.day}>
            <View
              className="w-[20px] rounded-t-[8px] bg-primary"
              style={{ height: item.height }}
            />
          </View>
        ))}
      </View>

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-2">
        {data.map((item) => (
          <Text
            className="w-[40px] text-center text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
            key={item.day}
          >
            {item.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ScoreTrendChart({ width }: { width: number }) {
  const compactWidth = Math.max(184, Math.min(240, width - 142));

  return (
    <View className="relative mt-6 h-[190px]">
      <DashedGridLine top={12} />
      <DashedGridLine top={84} />
      <DashedGridLine top={118} />

      <View
        className="absolute left-0 top-0 h-[126px]"
        style={{ width: compactWidth }}
      >
        {trendSegments.map((segment) => (
          <View
            className="absolute h-[4px] rounded-full bg-[#FF6B1A]"
            key={`${segment.left}-${segment.rotate}`}
            style={{
              left: segment.left,
              top: segment.top,
              transform: [{ rotate: `${segment.rotate}deg` }],
              width: segment.width,
            }}
          />
        ))}
      </View>

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between pl-[82px] pr-2">
        {["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <Text
            className="w-[44px] text-center text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
            key={day}
          >
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CategoryRow({ color, label, value }: CategoryRowProps) {
  const progress = clampPercent(value);

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[18px] font-bold leading-[24px] text-[#17172B]">
          {label}
        </Text>
        <Text
          className="text-[18px] font-bold leading-[24px]"
          style={{ color }}
        >
          {progress}%
        </Text>
      </View>
      <View className="mt-2 h-[8px] overflow-hidden rounded-full bg-[#EEEAFD]">
        <View
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${progress}%` }}
        />
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const practiceHistory = useInterviewStore((state) => state.practiceHistory);
  const readinessScore = useProgressStore((state) => state.readinessScore);
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 20 : 24;
  const answeredQuestions =
    completedQuestionIds.length > 0 ? completedQuestionIds.length : 75;
  const avgScore = readinessScore > 0 ? readinessScore : 78;
  const timeSpentHours =
    practiceHistory.length > 0
      ? Math.max(0.2, practiceHistory.length * 0.35).toFixed(1)
      : "4.2";
  const behavioralQuestionIds = interviewQuestions
    .filter((question) => question.category === "behavioral")
    .map((question) => question.id);
  const behavioralCompletedCount = completedQuestionIds.filter((questionId) =>
    behavioralQuestionIds.includes(questionId),
  ).length;
  const behavioralScore =
    completedQuestionIds.length > 0
      ? Math.round((behavioralCompletedCount / behavioralQuestionIds.length) * 100)
      : 88;
  const frontendScore =
    readinessScore > 0 ? clampPercent(readinessScore - 6) : 72;

  return (
    <View className="flex-1 bg-white">
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
            paddingBottom: 48,
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(insets.top + 12, 32),
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text
              adjustsFontSizeToFit
              className="flex-1 text-[31px] font-bold leading-[38px] text-white"
              minimumFontScale={0.78}
              numberOfLines={1}
            >
              My Progress
            </Text>
            <View className="ml-4 h-[54px] flex-row items-center justify-center rounded-full bg-white/18 px-6">
              <Text className="text-[16px] font-bold leading-[21px] text-white">
                This Week
              </Text>
              <SymbolIcon
                accessibilityLabel="Select progress period"
                color={colors.white}
                name="chevron.down"
                size={18}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>

          <View className="mt-7 flex-row gap-3">
            <ProgressStatCard
              detail="+23 from last week"
              label="Questions"
              value={String(answeredQuestions)}
            />
            <ProgressStatCard
              detail="+6% improvement"
              label="Avg Score"
              value={`${avgScore}%`}
            />
            <ProgressStatCard
              detail="Keep it up!"
              label="Time Spent"
              value={`${timeSpentHours}h`}
            />
          </View>
        </LinearGradient>

        <View
          className="-mt-6 gap-8"
          style={{ paddingHorizontal: horizontalPadding }}
        >
          <ChartCard title="Questions Answered">
            <QuestionsChart data={fallbackQuestionBars} />
          </ChartCard>

          <ChartCard title="Score Trend">
            <ScoreTrendChart width={width} />
          </ChartCard>

          <ChartCard title="Category Breakdown">
            <View className="mt-7 gap-6">
              <CategoryRow
                color={colors.success}
                label="Behavioral"
                value={behavioralScore}
              />
              <CategoryRow
                color={colors.primary}
                label="Frontend"
                value={frontendScore}
              />
            </View>
          </ChartCard>
        </View>
      </ScrollView>
    </View>
  );
}
