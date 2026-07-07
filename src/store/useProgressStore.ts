import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { careerFoxStorage } from "@/store/careerFoxStorage";

type ProgressStateData = {
  coins: number;
  completedMissionIds: string[];
  readinessScore: number;
  streak: number;
  unlockedAchievementIds: string[];
  xp: number;
};

type ProgressStateActions = {
  addCoins: (coins: number) => void;
  addXp: (xp: number) => void;
  clearProgressTestingState: () => Promise<void>;
  completeMission: (missionId: string) => void;
  resetProgressState: () => void;
  setReadinessScore: (score: number) => void;
  setStreak: (streak: number) => void;
  unlockAchievement: (achievementId: string) => void;
  updateProgressState: (updates: Partial<ProgressStateData>) => void;
};

export type ProgressState = ProgressStateData & ProgressStateActions;
type PersistedProgressState = Partial<ProgressStateData>;

const initialProgressState: ProgressStateData = {
  coins: 0,
  completedMissionIds: [],
  readinessScore: 0,
  streak: 0,
  unlockedAchievementIds: [],
  xp: 0,
};

const addUniqueId = (ids: string[], id: string) =>
  ids.includes(id) ? ids : [...ids, id];

const clampReadinessScore = (score: number) => Math.max(0, Math.min(100, score));

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...initialProgressState,
      addCoins: (coins) =>
        set((state) => ({ coins: Math.max(0, state.coins + coins) })),
      addXp: (xp) => set((state) => ({ xp: Math.max(0, state.xp + xp) })),
      clearProgressTestingState: async () => {
        await useProgressStore.persist.clearStorage();
        set(initialProgressState);
      },
      completeMission: (missionId) =>
        set((state) => ({
          completedMissionIds: addUniqueId(state.completedMissionIds, missionId),
        })),
      resetProgressState: () => set(initialProgressState),
      setReadinessScore: (score) =>
        set({ readinessScore: clampReadinessScore(score) }),
      setStreak: (streak) => set({ streak: Math.max(0, streak) }),
      unlockAchievement: (achievementId) =>
        set((state) => ({
          unlockedAchievementIds: addUniqueId(
            state.unlockedAchievementIds,
            achievementId,
          ),
        })),
      updateProgressState: (updates) =>
        set((state) => ({
          ...updates,
          coins:
            updates.coins === undefined ? state.coins : Math.max(0, updates.coins),
          readinessScore:
            updates.readinessScore === undefined
              ? state.readinessScore
              : clampReadinessScore(updates.readinessScore),
          streak:
            updates.streak === undefined
              ? state.streak
              : Math.max(0, updates.streak),
          xp: updates.xp === undefined ? state.xp : Math.max(0, updates.xp),
        })),
    }),
    {
      merge: (persistedState, currentState): ProgressState => ({
        ...currentState,
        ...initialProgressState,
        ...(persistedState as PersistedProgressState | undefined),
      }),
      name: "careerfox-progress-store",
      partialize: (state): ProgressStateData => ({
        coins: state.coins,
        completedMissionIds: state.completedMissionIds,
        readinessScore: state.readinessScore,
        streak: state.streak,
        unlockedAchievementIds: state.unlockedAchievementIds,
        xp: state.xp,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
