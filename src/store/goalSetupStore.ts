import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

const storageName = "careerfox-goal-setup";
let goalSetupStorageUserId: string | null = null;

type GoalSetupState = {
  selectedExperienceLevelId: string | null;
  selectedRoleId: string | null;
  resetGoalSetup: () => void;
  setSelectedExperienceLevelId: (experienceLevelId: string) => void;
  setSelectedRoleId: (roleId: string) => void;
};

type PersistedGoalSetupState = Pick<
  GoalSetupState,
  "selectedExperienceLevelId" | "selectedRoleId"
>;

const getSecureStoreSafeSegment = (value: string) =>
  value.replace(/[^A-Za-z0-9._-]/g, "_") || "unknown";

const getScopedStorageName = (name: string) => {
  const userSegment = goalSetupStorageUserId ?? "signed-out";

  return `${getSecureStoreSafeSegment(name)}.${getSecureStoreSafeSegment(userSegment)}`;
};

const getWebStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const goalSetupStorage: StateStorage = {
  getItem: async (name) => {
    const scopedName = getScopedStorageName(name);

    if (Platform.OS === "web") {
      return getWebStorage()?.getItem(scopedName) ?? null;
    }

    const SecureStore = await import("expo-secure-store");

    return SecureStore.getItemAsync(scopedName);
  },
  removeItem: async (name) => {
    const scopedName = getScopedStorageName(name);

    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(scopedName);
      return;
    }

    const SecureStore = await import("expo-secure-store");

    await SecureStore.deleteItemAsync(scopedName);
  },
  setItem: async (name, value) => {
    const scopedName = getScopedStorageName(name);

    if (Platform.OS === "web") {
      getWebStorage()?.setItem(scopedName, value);
      return;
    }

    const SecureStore = await import("expo-secure-store");

    await SecureStore.setItemAsync(scopedName, value);
  },
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
      merge: (persistedState, currentState) => ({
        ...currentState,
        selectedExperienceLevelId:
          (persistedState as PersistedGoalSetupState | undefined)
            ?.selectedExperienceLevelId ?? null,
        selectedRoleId:
          (persistedState as PersistedGoalSetupState | undefined)
            ?.selectedRoleId ?? null,
      }),
      name: storageName,
      partialize: (state) => ({
        selectedExperienceLevelId: state.selectedExperienceLevelId,
        selectedRoleId: state.selectedRoleId,
      }),
      storage: createJSONStorage(() => goalSetupStorage),
    },
  ),
);

export function setGoalSetupStorageUserId(userId: string | null) {
  if (goalSetupStorageUserId === userId) {
    return;
  }

  goalSetupStorageUserId = userId;
  void useGoalSetupStore.persist.rehydrate();
}
