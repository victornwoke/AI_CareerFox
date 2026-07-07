import { useAuth } from "@clerk/expo";
import { useEffect } from "react";

import {
  setGoalSetupStorageUserId,
  useGoalSetupStore,
} from "@/store/goalSetupStore";

const signedOutScope = "signed-out";
let hydratedGoalSetupScope: string | null = null;

export function GoalSetupStorageSync() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const storageUserId = userId ?? null;
    const scopeKey = storageUserId ?? signedOutScope;

    if (hydratedGoalSetupScope === scopeKey) {
      return;
    }

    setGoalSetupStorageUserId(storageUserId);
    hydratedGoalSetupScope = scopeKey;
    void useGoalSetupStore.persist.rehydrate();
  }, [isLoaded, userId]);

  return null;
}
