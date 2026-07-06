import { useAuth } from "@clerk/expo";
import { type Href, Redirect, Stack } from "expo-router";

const goalSetupHref = "/target-role" as Href;

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={goalSetupHref} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
