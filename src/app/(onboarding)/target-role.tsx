import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, type Href, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { useGoalSetupStore } from "@/store/goalSetupStore";

const signInHref = "/sign-in" as Href;
const experienceLevelHref = "/experience-level" as Href;

export default function TargetRoleScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const selectedRoleId = useGoalSetupStore((state) => state.selectedRoleId);
  const setSelectedRoleId = useGoalSetupStore((state) => state.setSelectedRoleId);
  const isCompactHeight = height < 780;

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return targetRoles;
    }

    return targetRoles.filter((role) => {
      const searchableText = [
        role.title,
        role.category,
        role.description,
        ...role.popularKeywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery]);

  const handleContinue = useCallback(() => {
    if (!selectedRoleId) {
      return;
    }

    router.push(experienceLevelHref);
  }, [router, selectedRoleId]);

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[6px] overflow-hidden rounded-full bg-[#EEE7FF]">
          <View className="h-full w-[49%] rounded-full bg-primary" />
        </View>

        <View className="mt-8 flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEE9FF]">
            <Image
              accessibilityLabel="Target role"
              contentFit="contain"
              source="sf:target"
              style={{ height: 30, tintColor: colors.primary, width: 30 }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] font-bold leading-[32px] text-text-primary">
              Select your target role
            </Text>
            <Text className="mt-1 text-[15px] font-semibold leading-[20px] text-[#8F92A8]">
              This helps us personalize your coaching for you.
            </Text>
          </View>
        </View>

        <View className="mt-6 h-[58px] flex-row items-center gap-3 rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-5">
          <Image
            accessibilityLabel="Search"
            contentFit="contain"
            source="sf:magnifyingglass"
            style={{ height: 22, tintColor: "#8F92A8", width: 22 }}
          />
          <TextInput
            accessibilityLabel="Search target roles"
            autoCapitalize="words"
            className="flex-1 text-[16px] font-semibold text-text-primary"
            onChangeText={setSearchQuery}
            placeholder="Search roles"
            placeholderTextColor="#8F92A8"
            returnKeyType="search"
            value={searchQuery}
          />
        </View>

        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold leading-[24px] text-text-primary">
            Popular roles
          </Text>
          <Text className="text-[13px] font-bold leading-[18px] text-[#8F92A8]">
            {filteredRoles.length} options
          </Text>
        </View>

        <View className="mt-4 gap-3">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;

            return (
              <Pressable
                accessibilityLabel={role.title}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                className="flex-row items-center rounded-[24px] border-[2px] bg-white"
                key={role.id}
                onPress={() => setSelectedRoleId(role.id)}
                style={{
                  backgroundColor: isSelected ? "#F3F0FF" : colors.white,
                  borderColor: isSelected ? colors.primary : "#EEE1FF",
                  boxShadow: isSelected
                    ? "0 12px 28px rgba(108, 78, 245, 0.12)"
                    : "none",
                  minHeight: 92,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                }}
              >
                <View
                  className="h-14 w-14 items-center justify-center rounded-[22px]"
                  style={{ backgroundColor: role.iconBackground }}
                >
                  <Image
                    accessibilityLabel={role.title}
                    contentFit="contain"
                    source={`sf:${role.icon}`}
                    style={{
                      height: 26,
                      tintColor: role.iconColor,
                      width: 26,
                    }}
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text
                    className="text-[18px] font-bold leading-[24px]"
                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                  >
                    {role.title}
                  </Text>
                </View>

                {isSelected ? (
                  <Image
                    accessibilityLabel="Selected"
                    contentFit="contain"
                    source="sf:checkmark.circle.fill"
                    style={{
                      height: 24,
                      marginRight: 8,
                      tintColor: colors.primary,
                      width: 24,
                    }}
                  />
                ) : null}

                <Image
                  accessibilityLabel="Open role"
                  contentFit="contain"
                  source="sf:chevron.right"
                  style={{ height: 20, tintColor: "#B8A5E8", width: 20 }}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-7 min-h-16 items-center justify-center rounded-[18px] bg-primary px-6"
          disabled={!selectedRoleId}
          onPress={handleContinue}
          style={{
            boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
            opacity: selectedRoleId ? 1 : 0.72,
          }}
        >
          <Text className="text-[17px] font-bold leading-[24px] text-white">
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
