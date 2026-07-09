import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter, type Href } from "expo-router";
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

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";
import { targetRoles } from "@/data/roles";
import { trackTargetRoleSelected } from "@/lib/analytics";
import { useCareerStore } from "@/store/useCareerStore";

const signInHref = "/sign-in" as Href;
const experienceLevelHref = "/experience-level" as Href;
const popularRoleIds = [
  "software-engineer",
  "cloud-engineer",
  "devops-engineer",
  "data-analyst",
] as const;
const popularRoleIdSet = new Set<string>(popularRoleIds);
const cloudRoleIds: readonly string[] = ["cloud-engineer", "devops-engineer"];
const cloudProviders = ["AWS", "Azure", "GCP", "Multi-cloud"] as const;

export default function TargetRoleScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isPhone = width < 744;
  const isCompactPhone = isPhone && (width < 390 || height < 760);
  const horizontalPadding = width < 360 ? 18 : isCompactPhone ? 20 : 24;
  const topPadding = Math.max(
    insets.top + (isCompactPhone ? 8 : 12),
    isCompactPhone ? 24 : 32,
  );
  const roleCardMinHeight = isCompactPhone ? 82 : 92;
  const roleCardPaddingX = isCompactPhone ? 16 : 18;
  const roleCardPaddingY = isCompactPhone ? 14 : 16;
  const roleIconWrapSize = isCompactPhone ? 50 : 56;
  const roleIconSize = isCompactPhone ? 24 : 26;
  const roleTitleSize = isCompactPhone ? 16 : 18;
  const roleTitleLeading = isCompactPhone ? 22 : 24;
  const [searchQuery, setSearchQuery] = useState("");
  const selectedRoleId = useCareerStore((state) => state.selectedTargetRole);
  const setSelectedRoleId = useCareerStore(
    (state) => state.setSelectedTargetRole,
  );
  const cloudProvider = useCareerStore((state) => state.cloudProvider);
  const setCloudProvider = useCareerStore((state) => state.setCloudProvider);
  const isCloudRole = Boolean(
    selectedRoleId && cloudRoleIds.includes(selectedRoleId),
  );
  const isSearching = searchQuery.trim().length > 0;

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return targetRoles.filter((role) => popularRoleIdSet.has(role.id));
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

  const handleRoleSelect = useCallback(
    (roleId: string) => {
      const selectedRole = targetRoles.find((role) => role.id === roleId);

      setSelectedRoleId(roleId);
      if (!cloudRoleIds.includes(roleId)) {
        setCloudProvider(null);
      }
      trackTargetRoleSelected({
        roleCategory: selectedRole?.category ?? null,
        roleId,
        roleTitle: selectedRole?.title ?? null,
      });
    },
    [setSelectedRoleId, setCloudProvider],
  );

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={signInHref} />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          minHeight: height,
          paddingBottom: insets.bottom + (isCompactPhone ? 16 : 24),
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[6px] overflow-hidden rounded-full bg-[#EEE7FF]">
          <View className="h-full w-[49%] rounded-full bg-primary" />
        </View>

        <View
          className="flex-row items-center gap-3"
          style={{ marginTop: isCompactPhone ? 6 : 8 }}
        >
          <View
            className="items-center justify-center rounded-full bg-[#EEE9FF]"
            style={{
              height: isCompactPhone ? 56 : 64,
              width: isCompactPhone ? 56 : 64,
            }}
          >
            <SymbolIcon
              accessibilityLabel="Target role"
              color={colors.primary}
              name="target"
              size={isCompactPhone ? 26 : 30}
            />
          </View>
          <View className="flex-1">
            <Text
              className="font-bold text-text-primary"
              style={{
                fontSize: isCompactPhone ? 24 : 28,
                lineHeight: isCompactPhone ? 29 : 32,
              }}
            >
              Select your target role
            </Text>
            <Text
              className="mt-1 font-semibold text-[#8F92A8]"
              style={{
                fontSize: isCompactPhone ? 14 : 15,
                lineHeight: isCompactPhone ? 19 : 20,
              }}
            >
              This helps us personalize your coaching for you.
            </Text>
          </View>
        </View>

        <View
          className="mt-5 flex-row items-center gap-3 rounded-[18px] border border-[#E9E0FF] bg-[#F6F2FF] px-5"
          style={{ height: isCompactPhone ? 52 : 58 }}
        >
          <SymbolIcon
            accessibilityLabel="Search"
            color="#8F92A8"
            name="magnifyingglass"
            size={isCompactPhone ? 20 : 22}
          />
          <TextInput
            accessibilityLabel="Search target roles"
            autoCapitalize="words"
            className="flex-1 font-semibold text-text-primary"
            onChangeText={setSearchQuery}
            placeholder="Search roles"
            placeholderTextColor="#8F92A8"
            returnKeyType="search"
            style={{ fontSize: isCompactPhone ? 15 : 16 }}
            value={searchQuery}
          />
        </View>

        <View
          className="flex-row items-center justify-between"
          style={{ marginTop: isCompactPhone ? 18 : 28 }}
        >
          <Text
            className="font-bold text-text-primary"
            style={{
              fontSize: isCompactPhone ? 17 : 18,
              lineHeight: isCompactPhone ? 22 : 24,
            }}
          >
            {isSearching ? "Search results" : "Popular roles"}
          </Text>
          <Text className="text-[13px] font-bold leading-[18px] text-[#8F92A8]">
            {filteredRoles.length} options
          </Text>
        </View>

        <View className="mt-3 gap-2.5">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;

            return (
              <Pressable
                accessibilityLabel={role.title}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                className="flex-row items-center rounded-[24px] border-[2px] bg-white"
                key={role.id}
                onPress={() => handleRoleSelect(role.id)}
                style={{
                  backgroundColor: isSelected ? "#F3F0FF" : colors.white,
                  borderColor: isSelected ? colors.primary : "#EEE1FF",
                  boxShadow: isSelected
                    ? "0 12px 28px rgba(108, 78, 245, 0.12)"
                    : "none",
                  minHeight: roleCardMinHeight,
                  paddingHorizontal: roleCardPaddingX,
                  paddingVertical: roleCardPaddingY,
                }}
              >
                <View
                  className="items-center justify-center rounded-[22px]"
                  style={{
                    backgroundColor: role.iconBackground,
                    height: roleIconWrapSize,
                    width: roleIconWrapSize,
                  }}
                >
                  <SymbolIcon
                    accessibilityLabel={role.title}
                    color={role.iconColor}
                    name={role.icon}
                    size={roleIconSize}
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text
                    className="font-bold"
                    style={{
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontSize: roleTitleSize,
                      lineHeight: roleTitleLeading,
                    }}
                  >
                    {role.title}
                  </Text>
                </View>

                {isSelected ? (
                  <SymbolIcon
                    accessibilityLabel="Selected"
                    color={colors.primary}
                    name="checkmark.circle.fill"
                    size={24}
                    style={{ marginRight: 8 }}
                  />
                ) : null}

                <SymbolIcon
                  accessibilityLabel="Open role"
                  color="#B8A5E8"
                  name="chevron.right"
                  size={20}
                />
              </Pressable>
            );
          })}
        </View>

        {isCloudRole ? (
          <View
            className="rounded-[24px] border border-[#E9E0FF] bg-[#F6F2FF]"
            style={{
              marginTop: isCompactPhone ? 14 : 20,
              padding: isCompactPhone ? 16 : 20,
            }}
          >
            <Text className="text-[15px] font-bold leading-[21px] text-text-primary">
              Cloud provider focus
            </Text>
            <Text className="mt-1 text-[13px] font-semibold leading-[18px] text-[#8F92A8]">
              Optional — sharpens interview and CV keyword feedback.
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {cloudProviders.map((provider) => {
                const isProviderSelected = cloudProvider === provider;

                return (
                  <Pressable
                    accessibilityLabel={provider}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isProviderSelected }}
                    className="rounded-full px-4 py-2.5"
                    key={provider}
                    onPress={() =>
                      setCloudProvider(isProviderSelected ? null : provider)
                    }
                    style={{
                      backgroundColor: isProviderSelected
                        ? colors.primary
                        : colors.white,
                      borderColor: isProviderSelected
                        ? colors.primary
                        : "#DDD4FF",
                      borderWidth: 1.5,
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold leading-[20px]"
                      style={{
                        color: isProviderSelected
                          ? colors.white
                          : colors.primary,
                      }}
                    >
                      {provider}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="items-center justify-center"
          disabled={!selectedRoleId}
          onPress={handleContinue}
          style={{
            boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)",
            opacity: selectedRoleId ? 1 : 0.72,
            marginTop: isCompactPhone ? 18 : 28,
            minHeight: isCompactPhone ? 58 : 64,
          }}
        >
          <LinearGradient
            colors={gradients.primary}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={{
              alignItems: "center",
              alignSelf: "stretch",
              borderRadius: 18,
              flex: 1,
              justifyContent: "center",
              minHeight: isCompactPhone ? 58 : 64,
              overflow: "hidden",
            }}
          >
            <Text
              className="font-bold text-white"
              style={{
                fontSize: isCompactPhone ? 16 : 17,
                lineHeight: isCompactPhone ? 22 : 24,
              }}
            >
              Continue
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}
