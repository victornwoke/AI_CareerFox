import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { careerFoxStorage } from "@/store/careerFoxStorage";

export type PracticeMode = "text" | "voice";

type CareerStateData = {
  cloudProvider: string | null;
  preferredPracticeMode: PracticeMode;
  selectedExperienceLevel: string | null;
  selectedTargetRole: string | null;
  setupCompleted: boolean;
};

type CareerStateActions = {
  clearCareerTestingState: () => Promise<void>;
  markSetupCompleted: () => void;
  resetCareerState: () => void;
  setCloudProvider: (provider: string | null) => void;
  setPreferredPracticeMode: (mode: PracticeMode) => void;
  setSelectedExperienceLevel: (experienceLevelId: string | null) => void;
  setSelectedTargetRole: (targetRoleId: string | null) => void;
  updateCareerState: (updates: Partial<CareerStateData>) => void;
};

export type CareerState = CareerStateData & CareerStateActions;
type PersistedCareerState = Partial<CareerStateData>;

const initialCareerState: CareerStateData = {
  cloudProvider: null,
  preferredPracticeMode: "text",
  selectedExperienceLevel: null,
  selectedTargetRole: null,
  setupCompleted: false,
};

export const useCareerStore = create<CareerState>()(
  persist(
    (set) => ({
      ...initialCareerState,
      clearCareerTestingState: async () => {
        await useCareerStore.persist.clearStorage();
        set(initialCareerState);
      },
      markSetupCompleted: () => set({ setupCompleted: true }),
      resetCareerState: () => set(initialCareerState),
      setCloudProvider: (provider) => set({ cloudProvider: provider }),
      setPreferredPracticeMode: (mode) => set({ preferredPracticeMode: mode }),
      setSelectedExperienceLevel: (experienceLevelId) =>
        set({ selectedExperienceLevel: experienceLevelId }),
      setSelectedTargetRole: (targetRoleId) =>
        set({ selectedTargetRole: targetRoleId }),
      updateCareerState: (updates) => set(updates),
    }),
    {
      merge: (persistedState, currentState): CareerState => ({
        ...currentState,
        ...initialCareerState,
        ...(persistedState as PersistedCareerState | undefined),
      }),
      name: "careerfox-career-store",
      partialize: (state): CareerStateData => ({
        cloudProvider: state.cloudProvider,
        preferredPracticeMode: state.preferredPracticeMode,
        selectedExperienceLevel: state.selectedExperienceLevel,
        selectedTargetRole: state.selectedTargetRole,
        setupCompleted: state.setupCompleted,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
