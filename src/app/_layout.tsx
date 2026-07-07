import "../../global.css";

import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";

import { CareerFoxStorageSync } from "@/components/auth/CareerFoxStorageSync";
import { GoalSetupStorageSync } from "@/components/auth/GoalSetupStorageSync";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file.");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <CareerFoxStorageSync />
      <GoalSetupStorageSync />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
