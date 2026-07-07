import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";

type VerificationModalProps = {
  email: string;
  visible: boolean;
  onClose: () => void;
  onResendCode: () => Promise<string | undefined>;
  onVerifyCode: (code: string) => Promise<string | undefined>;
};

const codeLength = 6;
const createEmptyDigits = () => Array.from({ length: codeLength }, () => "");

export function VerificationModal({
  email,
  visible,
  onClose,
  onResendCode,
  onVerifyCode,
}: VerificationModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(createEmptyDigits);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;

    const focusTimer = setTimeout(() => inputRefs.current[0]?.focus(), 250);

    return () => clearTimeout(focusTimer);
  }, [visible]);

  const closeModal = () => {
    setDigits(createEmptyDigits());
    setIsSubmitting(false);
    setIsResending(false);
    setError("");
    onClose();
  };

  const submitCode = async (submittedCode = digits.join("")) => {
    if (isSubmitting) {
      return;
    }

    if (submittedCode.length !== codeLength) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const nextError = await onVerifyCode(submittedCode);

    if (nextError) {
      setError(nextError);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setDigits(createEmptyDigits());
  };

  const updateDigit = (value: string, index: number) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);

    if (nextValue && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextValue && index === codeLength - 1 && nextDigits.every(Boolean)) {
      void submitCode(nextDigits.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendCode = async () => {
    if (isResending) {
      return;
    }

    setIsResending(true);
    setError("");

    const nextError = await onResendCode();

    if (nextError) {
      setError(nextError);
    } else {
      setDigits(createEmptyDigits());
      inputRefs.current[0]?.focus();
    }

    setIsResending(false);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={closeModal}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <View
          className="flex-1 items-center px-6"
          style={{
            minHeight: height,
            paddingTop: Math.max(insets.top + 12, 32),
          }}
        >
          <View className="h-32 w-32 items-center justify-center rounded-full bg-verification-icon-background">
            <SymbolIcon
              accessibilityLabel="Verification email icon"
              color={colors.primary}
              name="envelope"
              size={62}
            />
            <View className="absolute right-8 top-[34px] h-6 w-6 items-center justify-center rounded-full bg-success">
              <SymbolIcon
                accessibilityLabel="Verified"
                color={colors.white}
                name="checkmark"
                size={14}
              />
            </View>
          </View>

          <Text className="mt-14 text-center text-[28px] font-bold leading-[34px] text-text-primary">
            Check your email
          </Text>
          <Text className="mt-5 text-center text-[16px] font-semibold leading-[23px] text-auth-muted">
            We sent a 6-digit verification code to
          </Text>
          <Text className="mt-1 text-center text-[16px] font-bold leading-[23px] text-primary">
            {email}
          </Text>

          <View className="mt-10 flex-row justify-between self-stretch">
            {digits.map((digit, index) => (
              <TextInput
                accessibilityLabel={`Verification code digit ${index + 1}`}
                keyboardType="number-pad"
                key={`digit-${index}`}
                maxLength={1}
                onChangeText={(value) => updateDigit(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                returnKeyType="done"
                selectTextOnFocus
                style={[styles.codeInput, {
                  borderColor: digit ? colors.primary : colors.verificationCodeBorder,
                }]}
                textContentType="oneTimeCode"
                value={digit}
              />
            ))}
          </View>

          <View className="relative self-stretch">
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                className="absolute left-0 right-0 top-2 text-center text-[12px] font-semibold leading-[18px] text-error"
              >
                {error}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-9 h-[58px] w-full items-center justify-center"
            disabled={isSubmitting}
            onPress={() => void submitCode()}
            style={{
              boxShadow: "0 18px 34px rgba(108, 78, 245, 0.18)",
              opacity: isSubmitting ? 0.84 : 1,
            }}
          >
            <LinearGradient
              colors={gradients.primary}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
              style={styles.primaryButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-[17px] font-bold text-white">
                  Verify Email
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <View className="mt-7 flex-row justify-center">
            <Text className="text-[15px] font-medium leading-[22px] text-auth-muted">
              Didn’t receive code?{" "}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isResending}
              onPress={() => void resendCode()}
            >
              <Text className="text-[15px] font-bold leading-[22px] text-primary">
                {isResending ? "Sending..." : "Resend"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  codeInput: {
    backgroundColor: colors.authFieldBackground,
    borderRadius: 16,
    borderWidth: 1.5,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    height: 56,
    textAlign: "center",
    width: 48,
  },
  primaryButtonGradient: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    overflow: "hidden",
  },
});
