import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, type Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

type RoleOption = {
  accent: string;
  background: string;
  icon: string;
  label: string;
};

const signInHref = "/sign-in" as Href;
const experienceLevelHref = "/experience-level";

const roleOptions: RoleOption[] = [
  {
    accent: "#6C4EF5",
    background: "#EEE9FF",
    icon: "chevron.left.forwardslash.chevron.right",
    label: "Frontend Dev",
  },
  {
    accent: "#FF7A1A",
    background: "#FFF0E6",
    icon: "cylinder.split.1x2",
    label: "Backend Dev",
  },
  {
    accent: "#18B894",
    background: "#DDF8F1",
    icon: "square.stack.3d.up",
    label: "Full Stack",
  },
  {
    accent: "#4D8BFF",
    background: "#EAF2FF",
    icon: "brain.head.profile",
    label: "Data Scientist",
  },
  {
    accent: "#FF4F9A",
    background: "#FFEAF4",
    icon: "target",
    label: "Product Manager",
  },
  {
    accent: "#F5A000",
    background: "#FFF4DC",
    icon: "globe",
    label: "UI/UX Designer",
  },
  {
    accent: "#6C63FF",
    background: "#EEEEFF",
    icon: "briefcase",
    label: "DevOps",
  },
  {
    accent: "#12B8A6",
    background: "#E0F8F6",
    icon: "waveform.path.ecg",
    label: "QA Engineer",
  },
];

export default function TargetRoleScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const isCompactHeight = height < 820;
  const topPadding = insets.top + (isCompactHeight ? 22 : 37);
  const bottomPadding = insets.bottom + (isCompactHeight ? 12 : 18);
  const progressToHeaderGap = isCompactHeight ? 20 : 27;
  const headerToCopyGap = isCompactHeight ? 12 : 14;
  const copyToGridGap = isCompactHeight ? 16 : 24;
  const roleGridRowGap = isCompactHeight ? 10 : 14;
  const buttonTopGap = isCompactHeight ? 18 : 24;
  const buttonHeight = 58;
  const roleIconSize = isCompactHeight ? 36 : 40;
  const availableRoleCardHeight = Math.floor(
    (height -
      topPadding -
      bottomPadding -
      6 -
      progressToHeaderGap -
      52 -
      headerToCopyGap -
      50 -
      copyToGridGap -
      roleGridRowGap * 3 -
      buttonTopGap -
      buttonHeight) /
      4,
  );
  const roleCardHeight = Math.min(
    isCompactHeight ? 98 : 106,
    Math.max(82, availableRoleCardHeight),
  );
  const handleContinue = useCallback(() => {
    if (selectedRoles.length === 0) {
      return;
    }

    router.push(experienceLevelHref);
  }, [router, selectedRoles]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={signInHref} />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          minHeight: height,
          paddingBottom: bottomPadding,
          paddingHorizontal: 24,
          paddingTop: topPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[6px] overflow-hidden rounded-full bg-[#EEE7FF]">
          <View className="h-full w-[49%] rounded-full bg-primary" />
        </View>

        <View
          className="flex-row items-center gap-3"
          style={{ marginTop: progressToHeaderGap }}
        >
          <View
            className="items-center justify-center rounded-full bg-[#EEE9FF]"
            style={{ height: roleIconSize, width: roleIconSize }}
          >
            <Image
              accessibilityLabel="Target role"
              contentFit="contain"
              source="sf:target"
              style={{
                height: isCompactHeight ? 20 : 22,
                tintColor: colors.primary,
                width: isCompactHeight ? 20 : 22,
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] font-bold leading-[32px] text-text-primary">
              Target Role
            </Text>
            <Text className="text-[15px] font-semibold leading-[20px] text-[#8F92A8]">
              Select all that apply
            </Text>
          </View>
        </View>

        <Text
          className="text-[17px] font-medium leading-[25px] text-[#8F92A8]"
          style={{ marginTop: headerToCopyGap }}
        >
          Choose your target role(s) so we can customize your interview prep.
        </Text>

        <View
          className="flex-row flex-wrap justify-between"
          style={{
            marginTop: copyToGridGap,
            rowGap: roleGridRowGap,
          }}
        >
          {roleOptions.map((role) => {
            const isSelected = selectedRoles.includes(role.label);

            return (
              <Pressable
                accessibilityRole="button"
                className="w-[48%] rounded-[24px] border-[2px] bg-white"
                key={role.label}
                onPress={() =>
                  setSelectedRoles((currentRoles) =>
                    currentRoles.includes(role.label)
                      ? currentRoles.filter((label) => label !== role.label)
                      : [...currentRoles, role.label],
                  )
                }
                style={{
                  borderColor: isSelected ? colors.primary : "#EEE1FF",
                  boxShadow: isSelected
                    ? "0 12px 28px rgba(108, 78, 245, 0.12)"
                    : "none",
                  height: roleCardHeight,
                  justifyContent: "center",
                  paddingHorizontal: isCompactHeight ? 14 : 17,
                }}
              >
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    backgroundColor: role.background,
                    height: roleIconSize,
                    width: roleIconSize,
                  }}
                >
                  <Image
                    accessibilityLabel={role.label}
                    contentFit="contain"
                    source={`sf:${role.icon}`}
                    style={{
                      height: isCompactHeight ? 20 : 22,
                      tintColor: role.accent,
                      width: isCompactHeight ? 20 : 22,
                    }}
                  />
                </View>
                <Text
                  className="text-[17px] font-bold leading-[23px] text-text-primary"
                  style={{ marginTop: isCompactHeight ? 14 : 18 }}
                >
                  {role.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-[18px]"
          disabled={selectedRoles.length === 0}
          onPress={handleContinue}
          style={{
            backgroundColor: colors.primary,
            boxShadow: "0 18px 34px rgba(108, 78, 245, 0.18)",
            height: buttonHeight,
            marginTop: buttonTopGap,
            opacity: selectedRoles.length > 0 ? 1 : 0.82,
          }}
        >
          <Text className="text-[17px] font-bold leading-[24px] text-white">
            Select a role to continue
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
