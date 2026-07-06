import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

type ExperienceOption = {
  background: string;
  icon: string;
  id: string;
  label: string;
  years: string;
};

const signInHref = "/sign-in" as Href;

const experienceOptions: ExperienceOption[] = [
  {
    background: "#E9F9F0",
    icon: "🎓",
    id: "student-intern",
    label: "Student / Intern",
    years: "0–1 year experience",
  },
  {
    background: "#EAF0FF",
    icon: "🌱",
    id: "junior",
    label: "Junior",
    years: "1–3 years experience",
  },
  {
    background: "#F1EDFF",
    icon: "⚡",
    id: "mid-level",
    label: "Mid-Level",
    years: "3–6 years experience",
  },
  {
    background: "#FFF0E6",
    icon: "🚀",
    id: "senior",
    label: "Senior",
    years: "6–10 years experience",
  },
  {
    background: "#FFEAF4",
    icon: "👑",
    id: "lead-principal",
    label: "Lead / Principal",
    years: "10+ years experience",
  },
];

export default function ExperienceLevelScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [selectedExperienceId, setSelectedExperienceId] = useState("junior");
  const isCompactHeight = height < 780;
  const topPadding = insets.top + (isCompactHeight ? 12 : 22);
  const bottomPadding = insets.bottom + (isCompactHeight ? 12 : 18);
  const progressHeight = 6;
  const progressToHeaderGap = isCompactHeight ? 16 : 24;
  const headerToCopyGap = isCompactHeight ? 8 : 10;
  const copyBlockHeight = isCompactHeight ? 44 : 50;
  const copyToListGap = 8;
  const optionGap = isCompactHeight ? 8 : 12;
  const buttonTopGap = isCompactHeight ? 16 : 28;
  const buttonHeight = isCompactHeight ? 54 : 58;
  const headerIconSize = isCompactHeight ? 52 : 64;
  const maxOptionHeight = isCompactHeight ? 76 : 84;
  const availableOptionHeight = Math.floor(
    (height -
      topPadding -
      bottomPadding -
      progressHeight -
      progressToHeaderGap -
      headerIconSize -
      headerToCopyGap -
      copyBlockHeight -
      copyToListGap -
      optionGap * (experienceOptions.length - 1) -
      buttonTopGap -
      buttonHeight) /
      experienceOptions.length,
  );
  const optionHeight = Math.max(64, Math.min(maxOptionHeight, availableOptionHeight));
  const optionIconSize = Math.min(isCompactHeight ? 50 : 64, optionHeight - 18);
  const radioSize = isCompactHeight ? 30 : 38;

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
        <View className="flex-row gap-3 overflow-hidden rounded-full" style={{ height: progressHeight }}>
          <View className="h-full flex-1 rounded-full bg-primary" />
          <View className="h-full flex-1 rounded-full bg-primary" />
        </View>

        <View
          className="flex-row items-center gap-3"
          style={{ marginTop: progressToHeaderGap }}
        >
          <View
            className="items-center justify-center rounded-full bg-[#EEE9FF]"
            style={{ height: headerIconSize, width: headerIconSize }}
          >
            <Image
              accessibilityLabel="Experience level"
              contentFit="contain"
              source="sf:waveform.path.ecg"
              style={{
                height: isCompactHeight ? 25 : 28,
                tintColor: colors.primary,
                width: isCompactHeight ? 25 : 28,
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] font-bold leading-[32px] text-text-primary">
              Experience Level
            </Text>
            <Text className="text-[15px] font-semibold leading-[20px] text-[#8F92A8]">
              Helps calibrate question difficulty
            </Text>
          </View>
        </View>

        <Text
          className="text-[17px] font-medium leading-[25px] text-[#8F92A8]"
          style={{ height: copyBlockHeight, marginTop: headerToCopyGap }}
        >
          Where are you in your career? We will tailor questions to match your level.
        </Text>

        <View style={{ gap: optionGap, marginTop: copyToListGap }}>
          {experienceOptions.map((option) => {
            const isSelected = selectedExperienceId === option.id;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                className="flex-row items-center rounded-[24px] border-[2px] bg-white"
                key={option.id}
                onPress={() => setSelectedExperienceId(option.id)}
                style={{
                  backgroundColor: isSelected ? "#F3F0FF" : colors.background,
                  borderColor: isSelected ? colors.primary : "#EEE1FF",
                  height: optionHeight,
                  paddingHorizontal: isCompactHeight ? 18 : 32,
                }}
              >
                <View
                  className="items-center justify-center rounded-[24px]"
                  style={{
                    backgroundColor: option.background,
                    height: optionIconSize,
                    width: optionIconSize,
                  }}
                >
                  <Text className="text-[26px] leading-[32px]">{option.icon}</Text>
                </View>

                <View className="flex-1" style={{ marginLeft: isCompactHeight ? 18 : 28 }}>
                  <Text
                    className="text-[20px] font-bold leading-[27px]"
                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-[16px] font-bold leading-[22px] text-[#8F92A8]">
                    {option.years}
                  </Text>
                </View>

                <View
                  className="items-center justify-center rounded-full border-[3px]"
                  style={{
                    borderColor: isSelected ? colors.primary : "#E9D4FF",
                    height: radioSize,
                    width: radioSize,
                  }}
                >
                  {isSelected ? (
                    <View
                      className="rounded-full bg-primary"
                      style={{
                        height: isCompactHeight ? 12 : 14,
                        width: isCompactHeight ? 12 : 14,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-[18px]"
          style={{
            backgroundColor: colors.primary,
            boxShadow: "0 18px 34px rgba(108, 78, 245, 0.18)",
            height: buttonHeight,
            marginTop: buttonTopGap,
          }}
        >
          <Text className="text-[17px] font-bold leading-[24px] text-white">
            Continue to Dashboard →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
