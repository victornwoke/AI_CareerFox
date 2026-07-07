import { useAuth } from "@clerk/expo";
import { type Href, Redirect } from "expo-router";
import { useSyncExternalStore } from "react";

import { useCareerStore } from "@/store/useCareerStore";

const goalSetupHref = "/target-role" as Href;
const homeHref = "/home" as Href;
const onboardingHref = "/onboarding" as Href;

const subscribeToCareerStoreHydration = (onStoreChange: () => void) => {
  const unsubscribeFromHydrate = useCareerStore.persist.onHydrate(onStoreChange);
  const unsubscribeFromFinishHydration =
    useCareerStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeFromHydrate();
    unsubscribeFromFinishHydration();
  };
};

const getCareerStoreHydrationSnapshot = () =>
  useCareerStore.persist.hasHydrated();

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const setupCompleted = useCareerStore((state) => state.setupCompleted);
  const hasHydratedCareerStore = useSyncExternalStore(
    subscribeToCareerStoreHydration,
    getCareerStoreHydrationSnapshot,
    getCareerStoreHydrationSnapshot,
  );

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    if (!hasHydratedCareerStore) {
      return null;
    }

    return <Redirect href={setupCompleted ? homeHref : goalSetupHref} />;
  }

  return <Redirect href={onboardingHref} />;
}
