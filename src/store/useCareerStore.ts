import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { careerFoxStorage } from "@/store/careerFoxStorage";

export type PracticeMode = "text" | "voice";

type CareerStateData = {
  preferredPracticeMode: PracticeMode;
  selectedExperienceLevel: string | null;
  selectedTargetRole: string | null;
  setupCompleted: boolean;
};

type CareerStateActions = {
  clearCareerTestingState: () => Promise<void>;
  markSetupCompleted: () => void;
  resetCareerState: () => void;
  setPreferredPracticeMode: (mode: PracticeMode) => void;
  setSelectedExperienceLevel: (experienceLevelId: string | null) => void;
  setSelectedTargetRole: (targetRoleId: string | null) => void;
  updateCareerState: (updates: Partial<CareerStateData>) => void;
};

export type CareerState = CareerStateData & CareerStateActions;

const initialCareerState: CareerStateData = {
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
      setPreferredPracticeMode: (mode) => set({ preferredPracticeMode: mode }),
      setSelectedExperienceLevel: (experienceLevelId) =>
        set({ selectedExperienceLevel: experienceLevelId }),
      setSelectedTargetRole: (targetRoleId) =>
        set({ selectedTargetRole: targetRoleId }),
      updateCareerState: (updates) => set(updates),
    }),
    {
      name: "careerfox-career-store",
      partialize: (state): CareerStateData => ({
        preferredPracticeMode: state.preferredPracticeMode,
        selectedExperienceLevel: state.selectedExperienceLevel,
        selectedTargetRole: state.selectedTargetRole,
        setupCompleted: state.setupCompleted,
      }),
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
