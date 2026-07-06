import "../../global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { useEffect } from "react";

import { setGoalSetupStorageUserId } from "@/store/goalSetupStore";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file.");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GoalSetupStorageSync />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}

function GoalSetupStorageSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setGoalSetupStorageUserId(isSignedIn ? userId : null);
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
