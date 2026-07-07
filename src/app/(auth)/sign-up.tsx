import { useSignUp } from "@clerk/expo";
import { Link, useRouter, type Href } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthField } from "@/components/auth/AuthField";
import { VerificationModal } from "@/components/auth/VerificationModal";
import { colors, gradients } from "@/constants/colors";
import { images } from "@/constants/images";
import { componentStyles } from "@/constants/theme";
import {
  useSocialAuth,
  type SocialAuthProvider,
} from "@/hooks/useSocialAuth";
import { getClerkErrorMessage } from "@/lib/clerkErrors";

const goalSetupHref = "/target-role" as Href;

function getNameParts(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");

  return {
    firstName,
    lastName: lastName || undefined,
  };
}

export default function SignUpScreen() {
  const router = useRouter();
  const { fetchStatus, signUp } = useSignUp();
  const { startSocialAuth } = useSocialAuth();
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [error, setError] = useState("");
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<SocialAuthProvider | null>(null);
  const isLoading = fetchStatus === "fetching";
  const isAuthLoading = isLoading || socialLoadingProvider !== null;

  const completeSignUp = async () => {
    let didNavigate = false;

    const { error: finalizeError } = await signUp.finalize({
      navigate: () => {
        didNavigate = true;
        router.replace(goalSetupHref);
      },
    });

    if (finalizeError) {
      return getClerkErrorMessage(finalizeError);
    }

    const userId = signUp.createdUserId;
    if (userId) {
      posthog.identify(userId, {
        $set_once: { first_sign_up_date: new Date().toISOString() },
      });
    }
    posthog.capture('user_signed_up', { method: 'email' });

    if (!didNavigate) {
      router.replace(goalSetupHref);
    }

    return undefined;
  };

  const handleSubmit = async () => {
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Complete all fields to create your account.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { firstName, lastName } = getNameParts(fullName);

    try {
      const { error: signUpError } = await signUp.password({
        emailAddress: email.trim(),
        firstName,
        lastName,
        password,
      });

      if (signUpError) {
        setError(getClerkErrorMessage(signUpError));
        return;
      }

      if (signUp.isTransferable) {
        setError("An account already exists for this email. Please sign in.");
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        setError(getClerkErrorMessage(verificationError));
        return;
      }

      setIsVerificationVisible(true);
    } catch (requestError) {
      setError(getClerkErrorMessage(requestError));
      return;
    }
  };

  const verifyEmailCode = async (code: string) => {
    try {
      const { error: verificationError } =
        await signUp.verifications.verifyEmailCode({ code });

      if (verificationError) {
        return getClerkErrorMessage(verificationError);
      }

      if (signUp.status !== "complete") {
        return "We could not finish verification. Please check the code and try again.";
      }

      const finalizeError = await completeSignUp();

      if (finalizeError) {
        return finalizeError;
      }

      setIsVerificationVisible(false);

      return undefined;
    } catch (requestError) {
      return getClerkErrorMessage(requestError);
    }
  };

  const resendEmailCode = async () => {
    try {
      const { error: resendError } = await signUp.verifications.sendEmailCode();

      if (resendError) {
        return getClerkErrorMessage(resendError);
      }

      return undefined;
    } catch (requestError) {
      return getClerkErrorMessage(requestError);
    }
  };

  const handleSocialAuth = async (provider: SocialAuthProvider) => {
    setError("");
    setSocialLoadingProvider(provider);

    const nextError = await startSocialAuth(provider);

    if (nextError) {
      setError(nextError);
    } else {
      posthog.capture('user_signed_up', { method: provider.toLowerCase() });
    }

    setSocialLoadingProvider(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        automaticallyAdjustContentInsets={false}
        className="flex-1"
        contentContainerStyle={{
          minHeight: height,
          paddingBottom: insets.bottom + 24,
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="min-h-full bg-background">
          <View
            className="items-center rounded-b-[48px] px-6"
            style={{
              backgroundColor: colors.primary,
              height: 244,
              paddingTop: Math.max(insets.top + 12, 32),
            }}
          >
            <Image
              accessibilityLabel="CareerFox coach mascot"
              contentFit="contain"
              source={images.careerFoxCoach}
              style={{ height: 90, width: 96 }}
            />
            <Text className="mt-5 text-center text-[25px] font-bold leading-[31px] text-white">
              Create your account
            </Text>
            <Text className="mt-3 text-center text-[16px] font-medium leading-[22px] text-white/70">
              Join 50,000+ career climbers
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
                icon="person"
                onChangeText={setFullName}
                placeholder="Full Name"
                textContentType="name"
                value={fullName}
              />
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
                textContentType="newPassword"
                value={password}
              />
              <AuthField
                icon="lock"
                onChangeText={setConfirmPassword}
                onToggleSecure={() =>
                  setIsConfirmPasswordHidden((current) => !current)
                }
                placeholder="Confirm Password"
                secureTextEntry={isConfirmPasswordHidden}
                showToggle
                textContentType="newPassword"
                value={confirmPassword}
              />
            </View>

            <View className="mt-2 h-5 justify-center">
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
              disabled={isAuthLoading}
              onPress={() => void handleSubmit()}
              style={[componentStyles.primaryButton, styles.submitButton, {
                opacity: isAuthLoading ? 0.84 : 1,
              }]}
            >
              <LinearGradient
                colors={gradients.primary}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text className="text-[17px] font-bold text-white">
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <View className="my-5 flex-row items-center gap-4">
              <View className="h-px flex-1 bg-auth-divider" />
              <Text className="text-[13px] font-medium leading-[18px] text-auth-muted">
                or continue with
              </Text>
              <View className="h-px flex-1 bg-auth-divider" />
            </View>

            <View className="flex-row gap-3">
              {(["Google", "LinkedIn"] satisfies SocialAuthProvider[]).map((provider) => (
                <Pressable
                  accessibilityRole="button"
                  disabled={isAuthLoading}
                  key={provider}
                  onPress={() => void handleSocialAuth(provider)}
                  style={[styles.socialButton, {
                    opacity: isAuthLoading ? 0.7 : 1,
                  }]}
                >
                  <View style={styles.socialPlaceholder} />
                  {socialLoadingProvider === provider ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text className="text-[15px] font-bold text-text-primary">
                      {provider}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-7 px-6">
            <Text className="text-center text-[15px] font-medium leading-[22px] text-auth-muted">
              Already have an account?{" "}
              <Link href="/sign-in">
                <Text className="font-bold text-primary">Sign in</Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>

      <VerificationModal
        email={email || "alex@example.com"}
        onClose={() => setIsVerificationVisible(false)}
        onResendCode={resendEmailCode}
        onVerifyCode={verifyEmailCode}
        visible={isVerificationVisible}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.authBorder,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 46,
    justifyContent: "center",
  },
  socialPlaceholder: {
    backgroundColor: colors.socialPlaceholder,
    borderRadius: 999,
    height: 20,
    width: 20,
  },
  submitButton: {
    marginTop: 8,
    overflow: "hidden",
  },
  submitGradient: {
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
});
