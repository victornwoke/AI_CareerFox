import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import {
    type ApplicationStatus,
    useApplicationStore,
} from "@/store/useApplicationStore";

const statusOptions: { label: string; status: ApplicationStatus }[] = [
  { label: "Saved", status: "saved" },
  { label: "Applied", status: "applied" },
  { label: "Interview", status: "interviewing" },
  { label: "Offer", status: "offer" },
  { label: "Rejected", status: "rejected" },
  { label: "Withdrawn", status: "withdrawn" },
];

const timelineStatuses: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
];

const statusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interviewing: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  saved: "Saved",
  withdrawn: "Withdrawn",
};

const optionalValue = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const formatDateLabel = (value?: string) => {
  if (!value) {
    return "No deadline set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const applications = useApplicationStore((state) => state.applications);
  const updateApplication = useApplicationStore(
    (state) => state.updateApplication,
  );
  const removeApplication = useApplicationStore(
    (state) => state.removeApplication,
  );
  const application = applications.find((item) => item.id === id);
  const [nextAction, setNextAction] = useState(application?.nextAction ?? "");
  const [deadline, setDeadline] = useState(application?.deadline ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const activeTimelineIndex = useMemo(
    () =>
      application
        ? timelineStatuses.findIndex((status) => status === application.status)
        : -1,
    [application],
  );

  const handleStatusChange = (status: ApplicationStatus) => {
    if (!application) {
      return;
    }

    updateApplication(application.id, { status });
  };

  const handleSaveFollowUp = () => {
    if (!application) {
      return;
    }

    updateApplication(application.id, {
      deadline: optionalValue(deadline),
      nextAction: optionalValue(nextAction),
      notes: optionalValue(notes),
    });
  };

  const handleDelete = () => {
    if (!application) {
      return;
    }

    Alert.alert(
      "Delete application?",
      "This removes the application from your tracker.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: () => {
            removeApplication(application.id);
            router.replace("/applications");
          },
          style: "destructive",
          text: "Delete",
        },
      ],
    );
  };

  if (!application) {
    return (
      <View className="flex-1 bg-[#F7F4FF] px-6">
        <View className="flex-1 items-center justify-center">
          <View
            className="items-center rounded-[28px] bg-white px-6 py-8"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <Text className="text-center text-[22px] font-bold leading-[28px] text-text-primary">
              Application not found
            </Text>
            <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
              This job may have been deleted from your tracker.
            </Text>
            <Pressable
              accessibilityLabel="Back to applications"
              accessibilityRole="button"
              className="mt-6 min-h-[52px] w-full items-center justify-center rounded-[18px] bg-primary"
              onPress={() => router.replace("/applications")}
            >
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Back to applications
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.primary}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
            paddingBottom: 32,
            paddingHorizontal: 24,
            paddingTop: Math.max(insets.top + 12, 32),
          }}
        >
          <Pressable
            accessibilityLabel="Back to applications"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/18"
            onPress={() => router.back()}
          >
            <SymbolIcon
              accessibilityLabel="Back"
              color={colors.white}
              name="chevron.left"
              size={24}
            />
          </Pressable>

          <Text
            className="mt-6 text-[30px] font-bold leading-[37px] text-white"
            numberOfLines={2}
          >
            {application.companyName}
          </Text>
          <Text className="mt-2 text-[15px] font-semibold leading-[22px] text-white/76">
            {application.roleTitle}
          </Text>
        </LinearGradient>

        <View className="-mt-4 gap-5 px-6">
          <View
            className="rounded-[28px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                Status
              </Text>
              <Text className="text-[13px] font-bold leading-[18px] text-primary">
                {statusLabels[application.status]}
              </Text>
            </View>

            <View className="mt-5 flex-row items-center">
              {timelineStatuses.map((status, index) => {
                const isActive =
                  activeTimelineIndex >= 0 && index <= activeTimelineIndex;

                return (
                  <View className="flex-1 flex-row items-center" key={status}>
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isActive ? colors.primary : "#EEE9FF",
                      }}
                    >
                      <SymbolIcon
                        accessibilityLabel={statusLabels[status]}
                        color={isActive ? colors.white : colors.primary}
                        name="checkmark"
                        size={15}
                      />
                    </View>
                    {index < timelineStatuses.length - 1 ? (
                      <View
                        className="h-[3px] flex-1 rounded-full"
                        style={{
                          backgroundColor: isActive
                            ? colors.primary
                            : "#EEE9FF",
                        }}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View className="mt-5 flex-row flex-wrap gap-2">
              {statusOptions.map((option) => {
                const selected = option.status === application.status;

                return (
                  <Pressable
                    accessibilityRole="button"
                    className="rounded-full px-4 py-2"
                    key={option.status}
                    onPress={() => handleStatusChange(option.status)}
                    style={{
                      backgroundColor: selected ? colors.primary : "#EEE9FF",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold leading-[18px]"
                      style={{
                        color: selected ? colors.white : colors.primary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            className="gap-5 rounded-[28px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <View>
              <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
                Follow-up
              </Text>
              <Text className="mt-1 text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
                Deadline: {formatDateLabel(application.deadline)}
              </Text>
            </View>

            <View>
              <Text className="mb-2 text-[13px] font-bold leading-[18px] text-text-primary">
                Next action
              </Text>
              <TextInput
                className="min-h-[56px] rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-4 text-[15px] font-semibold leading-[21px] text-text-primary"
                onChangeText={setNextAction}
                placeholder="Follow up with recruiter"
                placeholderTextColor="#A5A0BA"
                value={nextAction}
              />
            </View>

            <View>
              <Text className="mb-2 text-[13px] font-bold leading-[18px] text-text-primary">
                Deadline
              </Text>
              <TextInput
                className="min-h-[56px] rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-4 text-[15px] font-semibold leading-[21px] text-text-primary"
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD or reminder date"
                placeholderTextColor="#A5A0BA"
                value={deadline}
              />
            </View>

            <View>
              <Text className="mb-2 text-[13px] font-bold leading-[18px] text-text-primary">
                Notes
              </Text>
              <TextInput
                className="min-h-[112px] rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-4 pt-4 text-[15px] font-semibold leading-[21px] text-text-primary"
                multiline
                onChangeText={setNotes}
                placeholder="Contacts, prep notes, salary range, blockers..."
                placeholderTextColor="#A5A0BA"
                style={{ textAlignVertical: "top" }}
                value={notes}
              />
            </View>

            <Pressable
              accessibilityLabel="Save follow-up"
              accessibilityRole="button"
              className="min-h-[56px] items-center justify-center rounded-[18px] bg-primary"
              onPress={handleSaveFollowUp}
              style={{ boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)" }}
            >
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Save follow-up
              </Text>
            </Pressable>
          </View>

          <View
            className="gap-3 rounded-[28px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            {application.location ? (
              <Text className="text-[14px] font-semibold leading-[21px] text-[#6B7280]">
                Location: {application.location}
              </Text>
            ) : null}
            {application.source ? (
              <Text className="text-[14px] font-semibold leading-[21px] text-[#6B7280]">
                Source: {application.source}
              </Text>
            ) : null}
            {application.jobUrl ? (
              <Text
                className="text-[14px] font-semibold leading-[21px] text-primary"
                selectable
              >
                {application.jobUrl}
              </Text>
            ) : null}
            <Pressable
              accessibilityLabel="Delete application"
              accessibilityRole="button"
              className="mt-1 min-h-[48px] items-center justify-center rounded-[16px] bg-[#FFECEC]"
              onPress={handleDelete}
            >
              <Text className="text-[15px] font-bold leading-[21px] text-error">
                Delete application
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
