import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { careerFoxStorage } from "@/store/careerFoxStorage";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export type JobApplication = {
  companyName: string;
  createdAt: string;
  deadline?: string;
  id: string;
  jobUrl?: string;
  location?: string;
  nextAction?: string;
  notes?: string;
  roleTitle: string;
  source?: string;
  status: ApplicationStatus;
  updatedAt: string;
};

type ApplicationStateData = {
  activeApplicationId: string | null;
  applications: JobApplication[];
};

type ApplicationStateActions = {
  addApplication: (application: JobApplication) => void;
  clearApplicationTestingState: () => Promise<void>;
  removeApplication: (applicationId: string) => void;
  resetApplicationState: () => void;
  setActiveApplicationId: (applicationId: string | null) => void;
  updateApplication: (
    applicationId: string,
    updates: Partial<Omit<JobApplication, "createdAt" | "id">>,
  ) => void;
  updateApplicationState: (updates: Partial<ApplicationStateData>) => void;
};

export type ApplicationState = ApplicationStateData & ApplicationStateActions;
type PersistedApplicationState = Partial<ApplicationStateData>;

const initialApplicationState: ApplicationStateData = {
  activeApplicationId: null,
  applications: [],
};

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set) => ({
      ...initialApplicationState,
      addApplication: (application) =>
        set((state) => ({
          activeApplicationId: application.id,
          applications: [application, ...state.applications],
        })),
      clearApplicationTestingState: async () => {
        await useApplicationStore.persist.clearStorage();
        set(initialApplicationState);
      },
      removeApplication: (applicationId) =>
        set((state) => ({
          activeApplicationId:
            state.activeApplicationId === applicationId
              ? null
              : state.activeApplicationId,
          applications: state.applications.filter(
            (application) => application.id !== applicationId,
          ),
        })),
      resetApplicationState: () => set(initialApplicationState),
      setActiveApplicationId: (applicationId) =>
        set({ activeApplicationId: applicationId }),
      updateApplication: (applicationId, updates) =>
        set((state) => ({
          applications: state.applications.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  ...updates,
                  updatedAt: updates.updatedAt ?? new Date().toISOString(),
                }
              : application,
          ),
        })),
      updateApplicationState: (updates) => set(updates),
    }),
    {
      merge: (persistedState, currentState): ApplicationState => ({
        ...currentState,
        ...initialApplicationState,
        ...(persistedState as PersistedApplicationState | undefined),
      }),
      name: "careerfox-application-store",
      partialize: (state): ApplicationStateData => ({
        activeApplicationId: state.activeApplicationId,
        applications: state.applications,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => careerFoxStorage),
    },
  ),
);
