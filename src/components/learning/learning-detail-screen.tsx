import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";

type LearningDetailScreenProps = {
  description: string;
  icon: SymbolIconName;
  iconBackground: string;
  iconColor: string;
  nextDescription?: string;
  nextTitle?: string;
  title: string;
};

export function LearningDetailScreen({
  description,
  icon,
  iconBackground,
  iconColor,
  nextDescription = "Structured lessons, practice prompts, XP rewards, and saved progress will be added here as this path grows.",
  nextTitle = "Coming next",
  title,
}: LearningDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F6F2FF]">
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top + 12, 32),
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          onPress={() => router.back()}
          style={{ boxShadow: "0 8px 20px rgba(13, 19, 43, 0.06)" }}
        >
          <SymbolIcon
            accessibilityLabel="Back"
            color={colors.textPrimary}
            name="chevron.right"
            size={20}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </Pressable>

        <View
          className="mt-6 rounded-[28px] bg-white px-6 py-8"
          style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-[28px]"
            style={{ backgroundColor: iconBackground }}
          >
            <SymbolIcon
              accessibilityLabel={title}
              color={iconColor}
              name={icon}
              size={38}
            />
          </View>
          <Text className="mt-6 text-[30px] font-bold leading-[36px] text-text-primary">
            {title}
          </Text>
          <Text className="mt-3 text-[16px] font-semibold leading-[24px] text-[#8F92A8]">
            {description}
          </Text>
          <View className="mt-8 rounded-[22px] bg-[#F6F2FF] px-5 py-5">
            <Text className="text-[16px] font-bold leading-[22px] text-text-primary">
              {nextTitle}
            </Text>
            <Text className="mt-2 text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
              {nextDescription}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
