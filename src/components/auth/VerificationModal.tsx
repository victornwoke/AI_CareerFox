import { useRouter, type Href } from "expo-router";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

type VerificationModalProps = {
  email: string;
  visible: boolean;
  onClose: () => void;
};

const codeLength = 6;
const goalSetupHref = "/target-role" as Href;
const createEmptyDigits = () => Array.from({ length: codeLength }, () => "");

export function VerificationModal({
  email,
  visible,
  onClose,
}: VerificationModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(createEmptyDigits);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const focusTimer = setTimeout(() => inputRefs.current[0]?.focus(), 250);

    return () => clearTimeout(focusTimer);
  }, [visible]);

  const closeModal = () => {
    setDigits(createEmptyDigits());
    setIsSubmitting(false);
    onClose();
  };

  const submitCode = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      closeModal();
      router.replace(goalSetupHref);
    }, 650);
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
      submitCode();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <View
          className="flex-1 items-center px-6"
          style={{ minHeight: height, paddingTop: insets.top + 126 }}
        >
          <View className="h-32 w-32 items-center justify-center rounded-full bg-[#E6DEFF]">
            <Image
              accessibilityLabel="Verification email icon"
              contentFit="contain"
              source="sf:envelope"
              style={{ height: 62, tintColor: colors.primary, width: 62 }}
            />
            <View className="absolute right-8 top-[34px] h-6 w-6 items-center justify-center rounded-full bg-success">
              <Image
                accessibilityLabel="Verified"
                contentFit="contain"
                source="sf:checkmark"
                style={{ height: 14, tintColor: colors.white, width: 14 }}
              />
            </View>
          </View>

          <Text className="mt-14 text-center text-[28px] font-bold leading-[34px] text-text-primary">
            Check your email
          </Text>
          <Text className="mt-5 text-center text-[16px] font-semibold leading-[23px] text-[#8F92A8]">
            We sent a 6-digit verification code to
          </Text>
          <Text className="mt-1 text-center text-[16px] font-bold leading-[23px] text-primary">
            {email}
          </Text>

          <View className="mt-10 flex-row justify-between self-stretch">
            {digits.map((digit, index) => (
              <TextInput
                accessibilityLabel={`Verification code digit ${index + 1}`}
                className="h-[56px] w-[48px] rounded-[16px] border-[1.5px] border-[#E2DBFF] bg-[#F6F2FF] text-center text-[20px] font-bold text-text-primary"
                inputMode="numeric"
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
                style={{
                  borderColor: digit ? colors.primary : "#E2DBFF",
                }}
                textContentType="oneTimeCode"
                value={digit}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-9 h-[58px] w-full items-center justify-center rounded-[16px]"
            disabled={isSubmitting}
            onPress={submitCode}
            style={{
              backgroundColor: colors.primary,
              boxShadow: "0 18px 34px rgba(108, 78, 245, 0.18)",
              opacity: isSubmitting ? 0.84 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[17px] font-bold text-white">
                Verify Email
              </Text>
            )}
          </Pressable>

          <View className="mt-7 flex-row justify-center">
            <Text className="text-[15px] font-medium leading-[22px] text-[#8F92A8]">
              Didn’t receive code?{" "}
            </Text>
            <Pressable accessibilityRole="button" onPress={closeModal}>
              <Text className="text-[15px] font-bold leading-[22px] text-primary">
                Resend
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
