import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

export default function SignUpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-center text-[28px] font-bold"
          style={{ color: colors.textPrimary }}
        >
          Sign Up
        </Text>
        <Text
          className="mt-3 text-center text-[15px] leading-6"
          style={{ color: colors.textSecondary }}
        >
          Create your CareerFox AI account to continue.
        </Text>
      </View>
    </SafeAreaView>
  );
}
