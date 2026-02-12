import { create } from "zustand";

interface CVAnalysisResult {
  id: string;
  overall_score: number;
  ats_compatibility: number;
  keyword_matches: { keyword: string; found: boolean; importance: string; suggestion: string | null }[];
  missing_keywords: string[];
  sections: { name: string; score: number; feedback: string; suggestions: string[] }[];
  summary: string;
  improvement_tips: string[];
}

interface CVStore {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  cvFile: File | null;
  analysisResult: CVAnalysisResult | null;

  setJobTitle: (v: string) => void;
  setCompanyName: (v: string) => void;
  setJobDescription: (v: string) => void;
  setCvFile: (f: File | null) => void;
  setAnalysisResult: (r: CVAnalysisResult | null) => void;
  reset: () => void;
}

export const useCVStore = create<CVStore>((set) => ({
  jobTitle: "",
  companyName: "",
  jobDescription: "",
  cvFile: null,
  analysisResult: null,

  setJobTitle: (v) => set({ jobTitle: v }),
  setCompanyName: (v) => set({ companyName: v }),
  setJobDescription: (v) => set({ jobDescription: v }),
  setCvFile: (f) => set({ cvFile: f }),
  setAnalysisResult: (r) => set({ analysisResult: r }),
  reset: () =>
    set({
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      cvFile: null,
      analysisResult: null,
    }),
}));
