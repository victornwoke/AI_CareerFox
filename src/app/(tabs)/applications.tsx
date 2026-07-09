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

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import {
    type ApplicationStatus,
    type JobApplication,
    useApplicationStore,
} from "@/store/useApplicationStore";

const newApplicationHref = "/applications/new" as Href;

type StatusMeta = {
  background: string;
  color: string;
  icon: SymbolIconName;
  label: string;
};

type SummaryCardProps = {
  accent: string;
  background: string;
  count: number;
  label: string;
};

const statusMeta: Record<ApplicationStatus, StatusMeta> = {
  applied: {
    background: "#EEE9FF",
    color: colors.primary,
    icon: "paperplane.fill",
    label: "Applied",
  },
  interviewing: {
    background: "#E9F9F0",
    color: colors.success,
    icon: "message.fill",
    label: "Interview",
  },
  offer: {
    background: "#FFF8D6",
    color: colors.energy,
    icon: "star.fill",
    label: "Offer",
  },
  rejected: {
    background: "#FFECEC",
    color: colors.error,
    icon: "xmark.circle.fill",
    label: "Rejected",
  },
  saved: {
    background: "#EEF5FF",
    color: colors.blue,
    icon: "bookmark.fill",
    label: "Saved",
  },
  withdrawn: {
    background: "#F1F2F6",
    color: colors.textSecondary,
    icon: "minus.circle.fill",
    label: "Withdrawn",
  },
};

const formatDateLabel = (value?: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
};

function SummaryCard({ accent, background, count, label }: SummaryCardProps) {
  return (
    <View className="min-h-[94px] flex-1 rounded-[20px] bg-white px-4 py-4">
      <View
        className="h-9 w-9 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: background }}
      >
        <Text
          className="text-center text-[18px] font-bold leading-[22px]"
          style={{ color: accent, fontVariant: ["tabular-nums"] }}
        >
          {count}
        </Text>
      </View>
      <Text className="mt-3 text-[13px] font-bold leading-[18px] text-[#8F92A8]">
        {label}
      </Text>
    </View>
  );
}

function ApplicationRow({ application }: { application: JobApplication }) {
  const router = useRouter();
  const meta = statusMeta[application.status];
  const deadlineLabel = formatDateLabel(application.deadline);
  const followUpLabel = application.nextAction?.trim()
    ? application.nextAction
    : "No follow-up set";

  return (
    <Pressable
      accessibilityLabel={`${application.companyName}, ${application.roleTitle}`}
      accessibilityRole="button"
      className="rounded-[22px] bg-white p-4"
      onPress={() => router.push(`/applications/${application.id}` as Href)}
      style={{ boxShadow: "0 10px 24px rgba(13, 19, 43, 0.06)" }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: meta.background }}
        >
          <SymbolIcon
            accessibilityLabel={meta.label}
            color={meta.color}
            name={meta.icon}
            size={23}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text
                className="text-[17px] font-bold leading-[22px] text-text-primary"
                numberOfLines={1}
              >
                {application.companyName}
              </Text>
              <Text
                className="mt-1 text-[13px] font-semibold leading-[18px] text-[#8F92A8]"
                numberOfLines={1}
              >
                {application.roleTitle}
              </Text>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: meta.background }}
            >
              <Text
                className="text-[11px] font-bold leading-[15px]"
                style={{ color: meta.color }}
              >
                {meta.label}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <SymbolIcon
              accessibilityLabel="Next action"
              color={colors.primary}
              name="clock"
              size={15}
            />
            <Text
              className="flex-1 text-[13px] font-semibold leading-[18px] text-[#6B7280]"
              numberOfLines={1}
            >
              {followUpLabel}
            </Text>
          </View>

          {deadlineLabel ? (
            <Text className="mt-2 text-[12px] font-bold leading-[16px] text-[#8F92A8]">
              Deadline: {deadlineLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const applications = useApplicationStore((state) => state.applications);
  const isNarrow = width < 370;
  const horizontalPadding = isNarrow ? 20 : 24;
  const counts = useMemo(
    () => ({
      applied: applications.filter((item) => item.status === "applied").length,
      interviewing: applications.filter(
        (item) => item.status === "interviewing",
      ).length,
      offer: applications.filter((item) => item.status === "offer").length,
      saved: applications.filter((item) => item.status === "saved").length,
    }),
    [applications],
  );

  const sortedApplications = useMemo(
    () =>
      [...applications].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      ),
    [applications],
  );

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top + 12, 32),
          paddingBottom: 14,
        }}
      >
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[31px] font-bold leading-[38px] text-white">
              Applications
            </Text>
            <Text className="mt-2 text-[14px] font-semibold leading-[20px] text-white/72">
              Track job applications and follow-up momentum.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Add application"
            accessibilityRole="button"
            className="h-[54px] w-[54px] items-center justify-center rounded-full bg-white/18"
            onPress={() => router.push(newApplicationHref)}
          >
            <SymbolIcon
              accessibilityLabel="Add application"
              color={colors.white}
              name="plus"
              size={27}
            />
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
            paddingBottom: 34,
            paddingHorizontal: horizontalPadding,
            paddingTop: 8,
          }}
        >
          <View className="mt-7 flex-row gap-3">
            <SummaryCard
              accent={colors.blue}
              background="#EEF5FF"
              count={counts.saved}
              label="Saved"
            />
            <SummaryCard
              accent={colors.primary}
              background="#EEE9FF"
              count={counts.applied}
              label="Applied"
            />
          </View>
          <View className="mt-3 flex-row gap-3">
            <SummaryCard
              accent={colors.success}
              background="#E9F9F0"
              count={counts.interviewing}
              label="Interview"
            />
            <SummaryCard
              accent={colors.energy}
              background="#FFF8D6"
              count={counts.offer}
              label="Offer"
            />
          </View>
        </LinearGradient>

        <View
          className="gap-5 pt-6"
          style={{ paddingHorizontal: horizontalPadding }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[22px] font-bold leading-[28px] text-text-primary">
              Follow-ups
            </Text>
            <Text className="text-[13px] font-bold leading-[18px] text-[#8F92A8]">
              {applications.length} total
            </Text>
          </View>

          {sortedApplications.length > 0 ? (
            <View className="gap-3">
              {sortedApplications.map((application) => (
                <ApplicationRow
                  application={application}
                  key={application.id}
                />
              ))}
            </View>
          ) : (
            <View
              className="items-center rounded-[28px] bg-white px-6 py-8"
              style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
            >
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEE9FF]">
                <SymbolIcon
                  accessibilityLabel="Applications"
                  color={colors.primary}
                  name="briefcase.fill"
                  size={30}
                />
              </View>
              <Text className="mt-5 text-center text-[22px] font-bold leading-[28px] text-text-primary">
                No applications yet
              </Text>
              <Text className="mt-3 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
                Add jobs you have saved or applied for, then track deadlines and
                next follow-up actions here.
              </Text>
              <Pressable
                accessibilityLabel="Add your first application"
                accessibilityRole="button"
                className="mt-6 min-h-[54px] w-full items-center justify-center rounded-[18px]"
                onPress={() => router.push(newApplicationHref)}
                style={{
                  backgroundColor: colors.primary,
                  boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
                }}
              >
                <Text className="text-[16px] font-bold leading-[22px] text-white">
                  Add application
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
