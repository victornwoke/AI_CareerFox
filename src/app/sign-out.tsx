import { useAuth } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SymbolIcon } from "@/components/ui/SymbolIcon";
import { colors, gradients } from "@/constants/colors";

const signInHref = "/sign-in" as Href;

export default function SignOutScreen() {
  const { isLoaded, signOut } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isActive = true;

    const completeSignOut = async () => {
      try {
        await signOut();

        if (isActive) {
          router.replace(signInHref);
        }
      } catch {
        if (isActive) {
          setErrorMessage("We could not sign you out. Please try again.");
        }
      }
    };

    void completeSignOut();

    return () => {
      isActive = false;
    };
  }, [isLoaded, router, signOut]);

  return (
    <View className="flex-1 items-center justify-center bg-[#F7F4FF] px-6">
      <View
        className="w-full max-w-[340px] items-center rounded-[28px] bg-white px-7 py-8"
        style={{ boxShadow: "0 12px 28px rgba(13, 19, 43, 0.08)" }}
      >
        {errorMessage ? (
          <>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-soft-error">
              <SymbolIcon color={colors.error} name="xmark.circle.fill" size={30} />
            </View>
            <Text className="mt-5 text-center text-[20px] font-bold leading-[26px] text-text-primary">
              Sign-out failed
            </Text>
            <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
              {errorMessage}
            </Text>
            <Pressable
              accessibilityLabel="Try sign out again"
              accessibilityRole="button"
              className="mt-6 w-full overflow-hidden rounded-[18px]"
              onPress={() => {
                setErrorMessage(null);
                void signOut()
                  .then(() => router.replace(signInHref))
                  .catch(() =>
                    setErrorMessage("We could not sign you out. Please try again."),
                  );
              }}
              style={{ boxShadow: "0 12px 24px rgba(108, 78, 245, 0.22)" }}
            >
              <LinearGradient
                colors={gradients.primary}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={{
                  alignItems: "center",
                  minHeight: 56,
                  justifyContent: "center",
                }}
              >
                <Text className="text-[16px] font-bold leading-[22px] text-white">
                  Try again
                </Text>
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text className="mt-5 text-center text-[20px] font-bold leading-[26px] text-text-primary">
              Signing you out
            </Text>
            <Text className="mt-2 text-center text-[14px] font-semibold leading-[21px] text-[#8F92A8]">
              Closing your CareerFox session securely.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
