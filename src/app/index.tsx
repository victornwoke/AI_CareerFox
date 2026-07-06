import { useAuth } from "@clerk/expo";
import { type Href, Redirect } from "expo-router";

const goalSetupHref = "/target-role" as Href;
const onboardingHref = "/onboarding" as Href;

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href={goalSetupHref} />;
  }

  return <Redirect href={onboardingHref} />;
}
