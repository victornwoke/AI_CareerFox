import { useAuth } from "@clerk/expo";
import { useEffect } from "react";

import {
  getCareerFoxStorageScopeKey,
  setCareerFoxStorageUserId,
} from "@/store/careerFoxStorage";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useCareerStore } from "@/store/useCareerStore";
import { useInterviewStore } from "@/store/useInterviewStore";
import { useProgressStore } from "@/store/useProgressStore";

let hydratedCareerFoxStorageScope: string | null = null;

export function CareerFoxStorageSync() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const storageUserId = userId ?? null;
    const scopeKey = getCareerFoxStorageScopeKey(storageUserId);

    if (hydratedCareerFoxStorageScope === scopeKey) {
      return;
    }

    setCareerFoxStorageUserId(storageUserId);
    hydratedCareerFoxStorageScope = scopeKey;

    void Promise.all([
      Promise.resolve(useCareerStore.persist.rehydrate()),
      Promise.resolve(useApplicationStore.persist.rehydrate()),
      Promise.resolve(useInterviewStore.persist.rehydrate()),
      Promise.resolve(useProgressStore.persist.rehydrate()),
    ]);
  }, [isLoaded, userId]);

  return null;
}
