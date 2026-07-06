import { Link } from "expo-router";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VerificationModal } from "@/components/auth/VerificationModal";
import { colors } from "@/constants/colors";
import { images } from "@/constants/images";
import { radii, spacing } from "@/constants/theme";

type AuthFieldProps = {
  icon: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  textContentType?: "emailAddress" | "password";
  value: string;
  onToggleSecure?: () => void;
};

function AuthField({
  icon,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle,
  textContentType,
  value,
  onToggleSecure,
}: AuthFieldProps) {
  return (
    <View
      className="input-field flex-row items-center gap-3"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radii.lg,
        height: 56,
        paddingHorizontal: spacing.card,
      }}
    >
      <Image
        contentFit="contain"
        source={`sf:${icon}`}
        style={{ height: 22, tintColor: colors.textSecondary, width: 22 }}
      />
      <TextInput
        autoCapitalize="none"
        className="flex-1 text-[16px] font-semibold text-text-primary"
        inputMode={textContentType === "emailAddress" ? "email" : "text"}
        keyboardType={
          textContentType === "emailAddress" ? "email-address" : "default"
        }
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        value={value}
      />
      {showToggle ? (
        <Pressable
          accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
          accessibilityRole="button"
          className="h-10 w-10 items-end justify-center"
          onPress={onToggleSecure}
        >
          <Image
            contentFit="contain"
            source="sf:eye"
            style={{ height: 22, tintColor: colors.textSecondary, width: 22 }}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);

  const handleSubmit = () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsVerificationVisible(true);
    }, 550);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ minHeight: height, paddingBottom: 32 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="min-h-full bg-background">
          <View
            className="items-center rounded-b-[48px] px-6"
            style={{
              backgroundColor: colors.primary,
              height: 300,
              paddingTop: insets.top + 70,
            }}
          >
            <Image
              accessibilityLabel="CareerFox coach mascot"
              contentFit="contain"
              source={images.careerFoxCoach}
              style={{ height: 90, width: 96 }}
            />
            <Text className="mt-5 text-center text-[25px] font-bold leading-[31px] text-white">
              Welcome back!
            </Text>
            <Text className="mt-3 text-center text-[16px] font-medium leading-[22px] text-white/70">
              Sign in to continue your journey
            </Text>
          </View>

          <View
            className="mx-6 -mt-9 rounded-[24px] bg-white px-6 pb-6 pt-6"
            style={{
              borderCurve: "continuous",
              boxShadow: "0 18px 44px rgba(108, 78, 245, 0.09)",
            }}
          >
            <View className="gap-3.5">
              <AuthField
                icon="envelope"
                onChangeText={setEmail}
                placeholder="Email address"
                textContentType="emailAddress"
                value={email}
              />
              <AuthField
                icon="lock"
                onChangeText={setPassword}
                onToggleSecure={() =>
                  setIsPasswordHidden((current) => !current)
                }
                placeholder="Password"
                secureTextEntry={isPasswordHidden}
                showToggle
                textContentType="password"
                value={password}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-4 items-end"
              onPress={() => setError("Password reset is coming soon.")}
            >
              <Text className="text-[15px] font-bold leading-[20px] text-primary">
                Forgot password?
              </Text>
            </Pressable>

            <View className="mt-1 h-5 justify-center">
              {error ? (
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-[12px] font-semibold text-error"
                >
                  {error}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-2 h-[56px] items-center justify-center rounded-[16px]"
              disabled={isLoading}
              onPress={handleSubmit}
              style={{
                backgroundColor: colors.primary,
                boxShadow: "0 16px 30px rgba(108, 78, 245, 0.22)",
                opacity: isLoading ? 0.84 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-[17px] font-bold text-white">Sign In</Text>
              )}
            </Pressable>

            <View className="my-5 flex-row items-center gap-4">
              <View className="h-px flex-1 bg-[#EEE7FF]" />
              <Text className="text-[13px] font-medium leading-[18px] text-[#8F92A8]">
                or
              </Text>
              <View className="h-px flex-1 bg-[#EEE7FF]" />
            </View>

            <View className="flex-row gap-2">
              {["Google", "Apple", "LinkedIn"].map((provider) => (
                <Pressable
                  accessibilityRole="button"
                  className="h-[46px] flex-1 items-center justify-center rounded-[18px] border border-[#E9E0FF] bg-white px-1"
                  key={provider}
                >
                  <Text className="text-[13px] font-bold text-[#8F92A8]">
                    {provider}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-7 px-6">
            <Text className="text-center text-[15px] font-medium leading-[22px] text-[#8F92A8]">
              Don’t have an account?{" "}
              <Link href="/sign-up">
                <Text className="font-bold text-primary">Sign up</Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>

      <VerificationModal
        email={email || "alex@example.com"}
        onClose={() => setIsVerificationVisible(false)}
        visible={isVerificationVisible}
      />
    </KeyboardAvoidingView>
  );
}
