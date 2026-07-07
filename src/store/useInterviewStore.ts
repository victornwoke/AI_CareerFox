import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { careerFoxStorage } from "@/store/careerFoxStorage";
import type { PracticeMode } from "@/store/useCareerStore";

export type InterviewPracticeHistoryItem = {
  feedbackSummary?: string;
  id: string;
  mode: PracticeMode;
  practicedAt: string;
  questionId: string;
  readinessScore?: number;
};

type InterviewStateData = {
  activeQuestionId: string | null;
  completedQuestionIds: string[];
  lastFeedbackSummary: string | null;
  practiceHistory: InterviewPracticeHistoryItem[];
};

type InterviewStateActions = {
  addPracticeHistoryItem: (item: InterviewPracticeHistoryItem) => void;
  clearInterviewTestingState: () => Promise<void>;
  markQuestionCompleted: (questionId: string) => void;
  resetInterviewState: () => void;
  setActiveQuestionId: (questionId: string | null) => void;
  setLastFeedbackSummary: (summary: string | null) => void;
  updateInterviewState: (updates: Partial<InterviewStateData>) => void;
};

export type InterviewState = InterviewStateData & InterviewStateActions;
type PersistedInterviewState = Partial<InterviewStateData>;

const initialInterviewState: InterviewStateData = {
  activeQuestionId: null,
  completedQuestionIds: [],
  lastFeedbackSummary: null,
  practiceHistory: [],
};

const addUniqueId = (ids: string[], id: string) =>
  ids.includes(id) ? ids : [...ids, id];

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      ...initialInterviewState,
      addPracticeHistoryItem: (item) =>
        set((state) => ({
          lastFeedbackSummary:
            item.feedbackSummary ?? state.lastFeedbackSummary,
          practiceHistory: [item, ...state.practiceHistory],
        })),
      clearInterviewTestingState: async () => {
        await useInterviewStore.persist.clearStorage();
        set(initialInterviewState);
      },
      markQuestionCompleted: (questionId) =>
        set((state) => ({
          completedQuestionIds: addUniqueId(
            state.completedQuestionIds,
            questionId,
          ),
        })),
      resetInterviewState: () => set(initialInterviewState),
      setActiveQuestionId: (questionId) =>
        set({ activeQuestionId: questionId }),
      setLastFeedbackSummary: (summary) =>
        set({ lastFeedbackSummary: summary }),
      updateInterviewState: (updates) => set(updates),
    }),
    {
      merge: (persistedState, currentState): InterviewState => ({
        ...currentState,
        ...initialInterviewState,
        ...(persistedState as PersistedInterviewState | undefined),
      }),
      name: "careerfox-interview-store",
      partialize: (state): InterviewStateData => ({
        activeQuestionId: state.activeQuestionId,
        completedQuestionIds: state.completedQuestionIds,
        lastFeedbackSummary: state.lastFeedbackSummary,
        practiceHistory: state.practiceHistory,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
