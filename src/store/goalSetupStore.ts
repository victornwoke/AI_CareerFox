import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

type GoalSetupState = {
  selectedExperienceLevelId: string | null;
  selectedRoleId: string | null;
  resetGoalSetup: () => void;
  setSelectedExperienceLevelId: (experienceLevelId: string) => void;
  setSelectedRoleId: (roleId: string) => void;
};

const goalSetupStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
};

export const useGoalSetupStore = create<GoalSetupState>()(
  persist(
    (set) => ({
      selectedExperienceLevelId: null,
      selectedRoleId: null,
      resetGoalSetup: () =>
        set({
          selectedExperienceLevelId: null,
          selectedRoleId: null,
        }),
      setSelectedExperienceLevelId: (experienceLevelId) =>
        set({ selectedExperienceLevelId: experienceLevelId }),
      setSelectedRoleId: (roleId) => set({ selectedRoleId: roleId }),
    }),
    {
      name: "careerfox-goal-setup",
      storage: createJSONStorage(() => goalSetupStorage),
    },
  ),
);
