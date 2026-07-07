import { useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";

import { identifyAnalyticsUser } from "@/lib/analytics";
import { useCareerStore } from "@/store/useCareerStore";

export function AnalyticsIdentitySync() {
  const { isLoaded, user } = useUser();
  const selectedExperienceLevel = useCareerStore(
    (state) => state.selectedExperienceLevel,
  );
  const selectedTargetRole = useCareerStore((state) => state.selectedTargetRole);
  const previousIdentityKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      previousIdentityKey.current = null;
      return;
    }

    const signupDate = user.createdAt?.toISOString() ?? null;
    const identityKey = [
      user.id,
      signupDate,
      selectedTargetRole ?? "no-role",
      selectedExperienceLevel ?? "no-level",
    ].join(":");

    if (previousIdentityKey.current === identityKey) {
      return;
    }

    identifyAnalyticsUser({
      experienceLevelId: selectedExperienceLevel,
      signupDate,
      targetRoleId: selectedTargetRole,
      userId: user.id,
    });
    previousIdentityKey.current = identityKey;
  }, [isLoaded, selectedExperienceLevel, selectedTargetRole, user]);

  return null;
}
