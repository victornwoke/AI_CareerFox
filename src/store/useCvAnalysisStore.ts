import { create } from "zustand";

export type CvAnalysisRequest = {
  cvInputType: "file" | "text";
  cvFile?: {
    base64: string;
    mimeType?: string | null;
    name: string;
  };
  cvText?: string;
  jobDescriptionFile?: {
    base64: string;
    mimeType?: string | null;
    name: string;
  };
  jobDescription?: string;
  roleId: string | null;
};

type CvAnalysisState = {
  request: CvAnalysisRequest | null;
  setRequest: (request: CvAnalysisRequest | null) => void;
};

export const useCvAnalysisStore = create<CvAnalysisState>((set) => ({
  request: null,
  setRequest: (request) => set({ request }),
}));
