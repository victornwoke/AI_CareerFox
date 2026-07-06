import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { experienceLevels } from "@/data/experienceLevels";
import { useGoalSetupStore } from "@/store/goalSetupStore";

type ExperienceIcon = {
  background: string;
  color: string;
  symbol: string;
};

const signInHref = "/sign-in" as Href;
const targetRoleHref = "/target-role" as Href;
const homeHref = "/home" as Href;

const experienceIcons: Record<string, ExperienceIcon> = {
  entry: {
    background: "#E9F9F0",
    color: "#21C16B",
    symbol: "graduationcap",
  },
  mid: {
    background: "#F1EDFF",
    color: "#6C4EF5",
    symbol: "bolt",
  },
  senior: {
    background: "#FFF0E0",
    color: "#FF8A00",
    symbol: "rocket",
  },
  "lead-principal": {
    background: "#FFEAF4",
    color: "#FF5DA8",
    symbol: "crown",
  },
};

export default function ExperienceLevelScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const selectedExperienceLevelId = useGoalSetupStore(
    (state) => state.selectedExperienceLevelId,
  );
  const setSelectedExperienceLevelId = useGoalSetupStore(
    (state) => state.setSelectedExperienceLevelId,
  );
  const isCompactHeight = height < 780;

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(targetRoleHref);
  }, [router]);

  const handleContinue = useCallback(() => {
    if (!selectedExperienceLevelId) {
      return;
    }

    router.replace(homeHref);
  }, [router, selectedExperienceLevelId]);

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
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: width < 360 ? 20 : 24,
          paddingTop: insets.top + (isCompactHeight ? 22 : 34),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-3 overflow-hidden rounded-full">
          <View className="h-[6px] flex-1 rounded-full bg-primary" />
          <View className="h-[6px] flex-1 rounded-full bg-primary" />
        </View>

        <View className="mt-8 flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEE9FF]">
            <Image
              accessibilityLabel="Experience level"
              contentFit="contain"
              source="sf:waveform.path.ecg"
              style={{ height: 30, tintColor: colors.primary, width: 30 }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] font-bold leading-[32px] text-text-primary">
              Select experience level
            </Text>
            <Text className="mt-1 text-[15px] font-semibold leading-[20px] text-[#8F92A8]">
              Choose the option that best describes you.
            </Text>
          </View>
        </View>

        <View className="mt-8 gap-4">
          {experienceLevels.map((level) => {
            const isSelected = selectedExperienceLevelId === level.id;
            const icon = experienceIcons[level.id];

            return (
              <Pressable
                accessibilityLabel={`${level.label}, ${level.years}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                className="flex-row items-center rounded-[24px] border-[2px] bg-white"
                key={level.id}
                onPress={() => setSelectedExperienceLevelId(level.id)}
                style={{
                  backgroundColor: isSelected ? "#F3F0FF" : colors.white,
                  borderColor: isSelected ? colors.primary : "#EEE1FF",
                  minHeight: isCompactHeight ? 98 : 112,
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                }}
              >
                <View
                  className="h-16 w-16 items-center justify-center rounded-[24px]"
                  style={{ backgroundColor: icon.background }}
                >
                  <Image
                    accessibilityLabel={level.label}
                    contentFit="contain"
                    source={`sf:${icon.symbol}`}
                    style={{
                      height: 28,
                      tintColor: icon.color,
                      width: 28,
                    }}
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text
                    className="text-[19px] font-bold leading-[25px]"
                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                  >
                    {level.label}
                  </Text>
                  <Text className="mt-1 text-[15px] font-bold leading-[20px] text-[#8F92A8]">
                    {level.years}
                  </Text>
                </View>

                <View
                  className="h-10 w-10 items-center justify-center rounded-full border-[3px]"
                  style={{
                    borderColor: isSelected ? colors.primary : "#E9D4FF",
                  }}
                >
                  {isSelected ? (
                    <Image
                      accessibilityLabel="Selected"
                      contentFit="contain"
                      source="sf:checkmark"
                      style={{ height: 17, tintColor: colors.primary, width: 17 }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-7 flex-row gap-3">
          <Pressable
            accessibilityLabel="Go back to target role selection"
            accessibilityRole="button"
            className="h-16 w-16 items-center justify-center rounded-[18px] border-[2px] border-[#EEE1FF] bg-[#F6F2FF]"
            onPress={handleBack}
          >
            <Image
              accessibilityLabel="Back"
              contentFit="contain"
              source="sf:chevron.left"
              style={{ height: 22, tintColor: colors.primary, width: 22 }}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="min-h-16 flex-1 items-center justify-center rounded-[18px] bg-primary px-6"
            disabled={!selectedExperienceLevelId}
            onPress={handleContinue}
            style={{
              boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
              opacity: selectedExperienceLevelId ? 1 : 0.72,
            }}
          >
            <Text className="text-[17px] font-bold leading-[24px] text-white">
              Continue to Dashboard -&gt;
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
