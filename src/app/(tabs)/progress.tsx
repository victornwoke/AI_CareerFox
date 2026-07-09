import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { interviewQuestions } from "@/data/interviewQuestions";
import type { InterviewPracticeHistoryItem } from "@/store/useInterviewStore";
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

type TrendPoint = {
  day: string;
  score: number | null;
};

type TrendSegment = {
  left: number;
  rotate: number;
  top: number;
  width: number;
};

type DayBucket = {
  count: number;
  day: string;
  key: string;
  scores: number[];
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const chartMaxBarHeight = 88;
const trendPlotHeight = 102;
const trendTop = 10;
const trendBottom = 88;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getLocalDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getRecentDayBuckets = (dayCount: number): DayBucket[] => {
  const today = new Date();
  const buckets: DayBucket[] = [];

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - index);
    buckets.push({
      count: 0,
      day: dayLabels[date.getDay()],
      key: getLocalDayKey(date),
      scores: [],
    });
  }

  return buckets;
};

const getValidPracticeDate = (item: InterviewPracticeHistoryItem) => {
  const practicedAt = new Date(item.practicedAt);

  return Number.isNaN(practicedAt.getTime()) ? null : practicedAt;
};

const buildQuestionBars = ({
  completedQuestionIds,
  practiceHistory,
  dayCount = 7,
}: {
  completedQuestionIds: string[];
  dayCount?: number;
  practiceHistory: InterviewPracticeHistoryItem[];
}): BarDatum[] => {
  const buckets = getRecentDayBuckets(dayCount);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const completedQuestionIdSet = new Set(completedQuestionIds);
  const completionDateByQuestionId = new Map<string, string>();

  [...practiceHistory]
    .sort((first, second) => {
      const firstDate = getValidPracticeDate(first)?.getTime() ?? 0;
      const secondDate = getValidPracticeDate(second)?.getTime() ?? 0;

      return firstDate - secondDate;
    })
    .forEach((item) => {
      const practicedAt = getValidPracticeDate(item);

      if (
        !practicedAt ||
        !completedQuestionIdSet.has(item.questionId) ||
        completionDateByQuestionId.has(item.questionId)
      ) {
        return;
      }

      completionDateByQuestionId.set(
        item.questionId,
        getLocalDayKey(practicedAt),
      );
    });

  completedQuestionIds.forEach((questionId) => {
    const bucketKey = completionDateByQuestionId.get(questionId);

    if (!bucketKey) {
      return;
    }

    const bucket = bucketByKey.get(bucketKey);

    if (bucket) {
      bucket.count += 1;
    }
  });

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 0);

  return buckets.map((bucket) => ({
    day: bucket.day,
    height:
      maxCount > 0
        ? Math.round((bucket.count / maxCount) * chartMaxBarHeight)
        : 0,
  }));
};

const buildScoreTrendPoints = ({
  practiceHistory,
  readinessScore,
  dayCount = 6,
}: {
  dayCount?: number;
  practiceHistory: InterviewPracticeHistoryItem[];
  readinessScore: number;
}): TrendPoint[] => {
  const buckets = getRecentDayBuckets(dayCount);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  practiceHistory.forEach((item) => {
    const practicedAt = getValidPracticeDate(item);

    if (!practicedAt || item.readinessScore === undefined) {
      return;
    }

    const bucket = bucketByKey.get(getLocalDayKey(practicedAt));

    if (bucket) {
      bucket.scores.push(clampPercent(item.readinessScore));
    }
  });

  if (readinessScore > 0) {
    buckets[buckets.length - 1]?.scores.push(clampPercent(readinessScore));
  }

  return buckets.map((bucket) => {
    if (bucket.scores.length === 0) {
      return { day: bucket.day, score: null };
    }

    const totalScore = bucket.scores.reduce((total, score) => total + score, 0);

    return {
      day: bucket.day,
      score: Math.round(totalScore / bucket.scores.length),
    };
  });
};

const getTrendY = (score: number) => {
  const progress = clampPercent(score) / 100;

  return trendBottom - progress * (trendBottom - trendTop);
};

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
      className="rounded-[24px] bg-white px-4 py-5"
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
    <View className="relative mt-5 h-[142px] overflow-hidden">
      <DashedGridLine top={16} />
      <DashedGridLine top={62} />
      <DashedGridLine top={108} />

      <View className="absolute bottom-7 left-0 right-0 flex-row items-end px-1">
        {data.map((item) => (
          <View className="flex-1 items-center" key={item.day}>
            <View
              className="w-[20px] rounded-t-[8px] bg-primary"
              style={{ height: item.height }}
            />
          </View>
        ))}
      </View>

      <View className="absolute bottom-0 left-0 right-0 flex-row px-1">
        {data.map((item) => (
          <Text
            adjustsFontSizeToFit
            className="flex-1 text-center text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
            key={item.day}
            minimumFontScale={0.82}
            numberOfLines={1}
          >
            {item.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ScoreTrendChart({
  chartWidth,
  data,
}: {
  chartWidth: number;
  data: TrendPoint[];
}) {
  const labelWidth = 44;
  const plotWidth = Math.max(1, chartWidth - labelWidth);
  const pointSpacing =
    data.length > 1 ? plotWidth / Math.max(1, data.length - 1) : 0;
  const chartPoints = data.map((point, index) => ({
    ...point,
    left: labelWidth / 2 + index * pointSpacing,
    top: point.score === null ? null : getTrendY(point.score),
  }));
  const visiblePoints = chartPoints.filter(
    (point): point is typeof point & { top: number } => point.top !== null,
  );
  const trendSegments: TrendSegment[] = visiblePoints
    .slice(0, -1)
    .map((point, index) => {
      const nextPoint = visiblePoints[index + 1];
      const xDistance = nextPoint.left - point.left;
      const yDistance = nextPoint.top - point.top;

      return {
        left: point.left,
        rotate: Math.atan2(yDistance, xDistance) * (180 / Math.PI),
        top: point.top,
        width: Math.sqrt(xDistance ** 2 + yDistance ** 2),
      };
    });

  return (
    <View className="relative mt-5 h-[126px] overflow-hidden">
      <DashedGridLine top={10} />
      <DashedGridLine top={64} />
      <DashedGridLine top={96} />

      <View
        className="absolute left-0 top-0"
        style={{ height: trendPlotHeight, width: chartWidth }}
      >
        {trendSegments.map((segment) => (
          <View
            className="absolute h-[4px] rounded-full bg-[#FF6B1A]"
            key={`${segment.left}-${segment.rotate}`}
            style={{
              left: segment.left,
              top: segment.top - 2,
              transform: [{ rotate: `${segment.rotate}deg` }],
              transformOrigin: "left center",
              width: segment.width,
            }}
          />
        ))}
        {visiblePoints.map((point) => (
          <View
            className="absolute h-[9px] w-[9px] rounded-full bg-[#FF6B1A]"
            key={`${point.day}-${point.left}-${point.top}`}
            style={{
              left: point.left - 4.5,
              top: point.top - 4.5,
            }}
          />
        ))}
      </View>

      <View
        className="absolute bottom-0 left-0 h-[20px]"
        style={{ width: chartWidth }}
      >
        {chartPoints.map((point) => (
          <Text
            adjustsFontSizeToFit
            className="absolute text-center text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
            key={`${point.day}-${point.left}`}
            minimumFontScale={0.82}
            numberOfLines={1}
            style={{ left: point.left - labelWidth / 2, width: labelWidth }}
          >
            {point.day}
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
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("week");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const completedQuestionIds = useInterviewStore(
    (state) => state.completedQuestionIds,
  );
  const practiceHistory = useInterviewStore((state) => state.practiceHistory);
  const readinessScore = useProgressStore((state) => state.readinessScore);
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 20 : 24;
  const chartInnerWidth = Math.max(1, width - horizontalPadding * 2 - 32);

  const dayCount = useMemo(() => {
    switch (selectedPeriod) {
      case "week":
        return 7;
      case "month":
        return 30;
      case "all": {
        if (practiceHistory.length === 0) {
          return 7;
        }

        const earliestPracticeTime = Math.min(
          ...practiceHistory.map((item) =>
            new Date(item.practicedAt).getTime(),
          ),
        );
        // eslint-disable-next-line
        const daysSinceFirstPractice = Math.ceil(
          // eslint-disable-next-line
          (Date.now() - earliestPracticeTime) / (1000 * 60 * 60 * 24),
        );

        return daysSinceFirstPractice + 1;
      }

      default:
        return 7;
    }
  }, [selectedPeriod, practiceHistory]);

  const getDayCount = () => dayCount;
  const questionBars = useMemo(
    () =>
      buildQuestionBars({ completedQuestionIds, practiceHistory, dayCount }),
    [completedQuestionIds, practiceHistory, dayCount],
  );
  const scoreTrendPoints = useMemo(
    () => buildScoreTrendPoints({ practiceHistory, readinessScore, dayCount }),
    [practiceHistory, readinessScore, dayCount],
  );
  const answeredQuestions = completedQuestionIds.length;
  const avgScore = clampPercent(readinessScore);
  const timeSpentHours = (practiceHistory.length * 0.35).toFixed(1);
  const getCategoryScore = (category: "behavioral" | "technical") => {
    const categoryQuestionIds = interviewQuestions
      .filter((question) => question.category === category)
      .map((question) => question.id);
    const completedCount = completedQuestionIds.filter((questionId) =>
      categoryQuestionIds.includes(questionId),
    ).length;

    return categoryQuestionIds.length > 0
      ? Math.round((completedCount / categoryQuestionIds.length) * 100)
      : 0;
  };
  const behavioralScore = getCategoryScore("behavioral");
  const technicalScore = getCategoryScore("technical");

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top - 8, 24),
          paddingBottom: 14,
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
          <Pressable
            onPress={() => setIsDropdownOpen(true)}
            className="ml-4 h-[54px] flex-row items-center justify-center rounded-full bg-white/18 px-6"
          >
            <Text className="text-[16px] font-bold leading-[21px] text-white">
              {selectedPeriod === "week"
                ? "This Week"
                : selectedPeriod === "month"
                  ? "This Month"
                  : "All Time"}
            </Text>
            <SymbolIcon
              accessibilityLabel="Select progress period"
              color={colors.white}
              name="chevron.down"
              size={18}
              style={{ marginLeft: 8 }}
            />
          </Pressable>
        </View>
      </LinearGradient>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
        transparent
        visible={isDropdownOpen}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setIsDropdownOpen(false)}
        >
          <View
            className="absolute top-0 right-0 left-0 flex-row justify-end px-6"
            pointerEvents="box-none"
            style={{ paddingTop: Math.max(insets.top - 20, 18) + 54 + 14 + 8 }}
          >
            <View className="w-40 overflow-hidden rounded-3xl bg-white shadow-lg">
              {[
                { label: "This Week", value: "week" as const },
                { label: "This Month", value: "month" as const },
                { label: "All Time", value: "all" as const },
              ].map((option, index) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSelectedPeriod(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-6 py-4 ${
                    index < 2 ? "border-b border-[#EEEAFD]" : ""
                  }`}
                >
                  <Text
                    className={`text-[16px] font-semibold leading-[21px] ${
                      selectedPeriod === option.value
                        ? "text-primary"
                        : "text-[#17172B]"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {selectedPeriod === option.value && (
                    <SymbolIcon
                      color={colors.primary}
                      name="checkmark"
                      size={20}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

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
            paddingBottom: 30,
            paddingHorizontal: horizontalPadding,
            paddingTop: 8,
          }}
        >
          <View className="mt-6 flex-row gap-3">
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
          className="-mt-5 gap-5"
          style={{ paddingHorizontal: horizontalPadding }}
        >
          <ChartCard title="Questions Answered">
            <QuestionsChart data={questionBars} />
          </ChartCard>

          <ChartCard title="Score Trend">
            <ScoreTrendChart
              chartWidth={chartInnerWidth}
              data={scoreTrendPoints}
            />
          </ChartCard>

          <ChartCard title="Category Breakdown">
            <View className="mt-5 gap-5">
              <CategoryRow
                color={colors.success}
                label="Behavioral"
                value={behavioralScore}
              />
              <CategoryRow
                color={colors.primary}
                label="Technical"
                value={technicalScore}
              />
            </View>
          </ChartCard>
        </View>
      </ScrollView>
    </View>
  );
}
