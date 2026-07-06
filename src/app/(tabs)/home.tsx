import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, type Href } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { experienceLevels } from "@/data/experienceLevels";
import { targetRoles } from "@/data/roles";
import { useGoalSetupStore } from "@/store/goalSetupStore";

const signInHref = "/sign-in" as Href;

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const selectedRoleId = useGoalSetupStore((state) => state.selectedRoleId);
  const selectedExperienceLevelId = useGoalSetupStore(
    (state) => state.selectedExperienceLevelId,
  );
  const selectedRole = targetRoles.find((role) => role.id === selectedRoleId);
  const selectedExperienceLevel = experienceLevels.find(
    (level) => level.id === selectedExperienceLevelId,
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
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          gap: 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          paddingTop: insets.top + 34,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-[28px] bg-[#F6F2FF] p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
            <Image
              accessibilityLabel="CareerFox AI"
              contentFit="contain"
              source="sf:sparkles"
              style={{ height: 30, tintColor: colors.primary, width: 30 }}
            />
          </View>
          <Text className="mt-5 text-[30px] font-bold leading-[36px] text-text-primary">
            Your coaching plan is ready
          </Text>
          <Text className="mt-3 text-[16px] font-semibold leading-[24px] text-[#8F92A8]">
            CareerFox AI will use your goal setup to tune lessons, practice, and feedback.
          </Text>
        </View>

        <View className="gap-3">
          <View className="rounded-[24px] border border-[#EEE1FF] bg-white p-5">
            <Text className="text-[13px] font-bold uppercase leading-[18px] text-[#8F92A8]">
              Target role
            </Text>
            <Text className="mt-2 text-[20px] font-bold leading-[27px] text-text-primary">
              {selectedRole?.title ?? "Not selected"}
            </Text>
          </View>

          <View className="rounded-[24px] border border-[#EEE1FF] bg-white p-5">
            <Text className="text-[13px] font-bold uppercase leading-[18px] text-[#8F92A8]">
              Experience level
            </Text>
            <Text className="mt-2 text-[20px] font-bold leading-[27px] text-text-primary">
              {selectedExperienceLevel?.label ?? "Not selected"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
