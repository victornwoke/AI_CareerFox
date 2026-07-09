import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";
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
import { trackApplicationAdded } from "@/lib/analytics";
import {
    type ApplicationStatus,
    useApplicationStore,
} from "@/store/useApplicationStore";

type FieldProps = {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

const statusOptions: { label: string; status: ApplicationStatus }[] = [
  { label: "Saved", status: "saved" },
  { label: "Applied", status: "applied" },
  { label: "Interview", status: "interviewing" },
  { label: "Offer", status: "offer" },
];

const optionalValue = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const createApplicationId = () =>
  `application-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function Field({
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: FieldProps) {
  return (
    <View>
      <Text className="mb-2 text-[13px] font-bold leading-[18px] text-text-primary">
        {label}
      </Text>
      <TextInput
        className="min-h-[56px] rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-4 text-[15px] font-semibold leading-[21px] text-text-primary"
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A5A0BA"
        style={{
          minHeight: multiline ? 112 : 56,
          paddingTop: multiline ? 14 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
        value={value}
      />
    </View>
  );
}

export default function NewApplicationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addApplication = useApplicationStore((state) => state.addApplication);
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");

  const handleSave = () => {
    const trimmedCompanyName = companyName.trim();
    const trimmedRoleTitle = roleTitle.trim();

    if (!trimmedCompanyName || !trimmedRoleTitle) {
      Alert.alert(
        "Missing details",
        "Add the company and role title before saving this application.",
      );
      return;
    }

    const now = new Date().toISOString();
    const id = createApplicationId();

    addApplication({
      companyName: trimmedCompanyName,
      createdAt: now,
      deadline: optionalValue(deadline),
      id,
      jobUrl: optionalValue(jobUrl),
      location: optionalValue(location),
      nextAction: optionalValue(nextAction),
      notes: optionalValue(notes),
      roleTitle: trimmedRoleTitle,
      source: optionalValue(source),
      status,
      updatedAt: now,
    });

    trackApplicationAdded({
      applicationId: id,
      hasDeadline: !!optionalValue(deadline),
      hasJobUrl: !!optionalValue(jobUrl),
      source: optionalValue(source),
      status,
    });

    router.replace(`/applications/${id}` as Href);
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={gradients.primary}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top - 8, 24),
          paddingBottom: 14,
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

        <Text className="mt-6 text-[30px] font-bold leading-[37px] text-white">
          Add application
        </Text>
        <Text className="mt-2 text-[14px] font-semibold leading-[21px] text-white/72">
          Save the role, status, and next follow-up action.
        </Text>
      </LinearGradient>

      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1 bg-[#F7F4FF]"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28,
        }}
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
            paddingBottom: 8,
            paddingHorizontal: 24,
            paddingTop: 0,
          }}
        ></LinearGradient>

        <View className="-mt-4 px-6">
          <View
            className="gap-5 rounded-[28px] bg-white p-5"
            style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.06)" }}
          >
            <Field
              label="Company"
              onChangeText={setCompanyName}
              placeholder="Company name"
              value={companyName}
            />
            <Field
              label="Role title"
              onChangeText={setRoleTitle}
              placeholder="Role you applied for"
              value={roleTitle}
            />

            <View>
              <Text className="mb-3 text-[13px] font-bold leading-[18px] text-text-primary">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const selected = option.status === status;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      className="rounded-full px-4 py-2"
                      key={option.status}
                      onPress={() => setStatus(option.status)}
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

            <Field
              label="Job link"
              onChangeText={setJobUrl}
              placeholder="https://..."
              value={jobUrl}
            />
            <Field
              label="Deadline"
              onChangeText={setDeadline}
              placeholder="YYYY-MM-DD or reminder date"
              value={deadline}
            />
            <Field
              label="Next action"
              onChangeText={setNextAction}
              placeholder="Follow up with recruiter"
              value={nextAction}
            />
            <Field
              label="Location"
              onChangeText={setLocation}
              placeholder="Remote, London, New York..."
              value={location}
            />
            <Field
              label="Source"
              onChangeText={setSource}
              placeholder="LinkedIn, referral, company site..."
              value={source}
            />
            <Field
              label="Notes"
              multiline
              onChangeText={setNotes}
              placeholder="Salary notes, contact names, interview prep..."
              value={notes}
            />

            <Pressable
              accessibilityLabel="Save application"
              accessibilityRole="button"
              className="min-h-[56px] items-center justify-center rounded-[18px]"
              onPress={handleSave}
              style={{
                backgroundColor: colors.primary,
                boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
              }}
            >
              <Text className="text-[16px] font-bold leading-[22px] text-white">
                Save application
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
