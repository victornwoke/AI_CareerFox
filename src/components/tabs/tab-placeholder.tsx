import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";

type TabPlaceholderProps = {
  accentColor?: string;
  description: string;
  iconName: string;
  title: string;
};

export function TabPlaceholder({
  accentColor = colors.primary,
  description,
  iconName,
  title,
}: TabPlaceholderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F7F4FF]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          paddingTop: insets.top + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="items-center rounded-[28px] border border-[#EEE1FF] bg-white px-6 py-8"
          style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
        >
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <SymbolIcon
              accessibilityLabel={title}
              color={accentColor}
              name={iconName}
              size={30}
            />
          </View>

          <Text className="mt-5 text-center text-[28px] font-bold leading-[34px] text-text-primary">
            {title}
          </Text>
          <Text className="mt-3 text-center text-[16px] font-semibold leading-[24px] text-[#8F92A8]">
            {description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
