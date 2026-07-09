import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GeneratedPracticeQuestion } from "@/lib/interviewGeneratedQuestion";
import { careerFoxStorage } from "@/store/careerFoxStorage";
import type { PracticeMode } from "@/store/useCareerStore";

export type InterviewPracticeHistoryItem = {
  category?: "behavioral" | "technical" | "case" | "hr";
  categoryScores?: {
    clarity: number;
    confidence: number;
    relevance: number;
    starQuality: number;
    structure: number;
  };
  feedbackSummary?: string;
  id: string;
  mode: PracticeMode;
  practicedAt: string;
  questionId: string;
  readinessScore?: number;
};

type InterviewStateData = {
  activeQuestionId: string | null;
  answerDraftsByQuestionId: Record<string, string>;
  completedQuestionIds: string[];
  generatedPracticeQuestion: GeneratedPracticeQuestion | null;
  lastFeedbackSummary: string | null;
  practiceHistory: InterviewPracticeHistoryItem[];
};

type InterviewStateActions = {
  addPracticeHistoryItem: (item: InterviewPracticeHistoryItem) => void;
  clearInterviewTestingState: () => Promise<void>;
  clearGeneratedPracticeQuestion: () => void;
  markQuestionCompleted: (questionId: string) => void;
  resetInterviewState: () => void;
  setActiveQuestionId: (questionId: string | null) => void;
  setAnswerDraft: (questionId: string, answer: string) => void;
  setGeneratedPracticeQuestion: (
    generatedPracticeQuestion: GeneratedPracticeQuestion | null,
  ) => void;
  setLastFeedbackSummary: (summary: string | null) => void;
  updateInterviewState: (updates: Partial<InterviewStateData>) => void;
};

export type InterviewState = InterviewStateData & InterviewStateActions;
type PersistedInterviewState = Partial<InterviewStateData>;
type PersistedSafeInterviewState = Omit<
  InterviewStateData,
  "answerDraftsByQuestionId"
>;

const initialInterviewState: InterviewStateData = {
  activeQuestionId: null,
  answerDraftsByQuestionId: {},
  completedQuestionIds: [],
  generatedPracticeQuestion: null,
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
      clearGeneratedPracticeQuestion: () =>
        set({ generatedPracticeQuestion: null }),
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
      setAnswerDraft: (questionId, answer) =>
        set((state) => ({
          answerDraftsByQuestionId: {
            ...state.answerDraftsByQuestionId,
            [questionId]: answer,
          },
        })),
      setGeneratedPracticeQuestion: (generatedPracticeQuestion) =>
        set({ generatedPracticeQuestion }),
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
      partialize: (state): PersistedSafeInterviewState => ({
        activeQuestionId: state.activeQuestionId,
        completedQuestionIds: state.completedQuestionIds,
        generatedPracticeQuestion: state.generatedPracticeQuestion,
        lastFeedbackSummary: state.lastFeedbackSummary,
        practiceHistory: state.practiceHistory,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
