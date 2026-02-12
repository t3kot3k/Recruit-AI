import { getIdToken } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { authenticated = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    ...fetchOptions.headers,
  };

  // Add authorization header for authenticated requests
  if (authenticated) {
    try {
      const token = await getIdToken();
      if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
  }

  // Add Content-Type for JSON requests
  if (fetchOptions.body && typeof fetchOptions.body === "string") {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle no content responses
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.detail || "An error occurred",
      response.status,
      data
    );
  }

  return data as T;
}

// User endpoints
export const userApi = {
  getProfile: () => request<UserProfile>("/users/me"),

  updateProfile: (data: { display_name?: string; consent_marketing?: boolean }) =>
    request<UserProfile>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccount: () =>
    request<void>("/users/me", {
      method: "DELETE",
    }),

  getStats: () =>
    request<UserStats>("/users/me/stats"),
};

// CV endpoints
export const cvApi = {
  analyze: (file: File, jobDescription: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    return request<CVAnalysisResult | CVAnalysisPreview>("/cv/analyze", {
      method: "POST",
      body: formData,
      authenticated: true,
    });
  },

  analyzePublic: (file: File, jobDescription: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    return request<CVAnalysisPreview>("/cv/analyze", {
      method: "POST",
      body: formData,
      authenticated: false,
    });
  },

  optimize: (file: File, jobDescription: string, analysisId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);
    if (analysisId) formData.append("analysis_id", analysisId);

    return request<OptimizedCV>("/cv/optimize", {
      method: "POST",
      body: formData,
      authenticated: true,
    });
  },

  exportPdf: async (cv: OptimizedCV, template: string = "classic"): Promise<Blob> => {
    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}/cv/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...cv, template }),
    });
    if (!response.ok) throw new ApiError("Export failed", response.status);
    return response.blob();
  },

  getAnalyses: (limit = 10) =>
    request<CVAnalysisResult[]>(`/cv/analyses?limit=${limit}`),

  getAnalysis: (id: string) =>
    request<CVAnalysisResult>(`/cv/analyses/${id}`),

  deleteAnalysis: (id: string) =>
    request<void>(`/cv/analyses/${id}`, {
      method: "DELETE",
    }),
};

// Cover letter endpoints
export const coverLetterApi = {
  generate: (data: CoverLetterRequest) =>
    request<CoverLetterResponse>("/cover-letters/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (limit = 20) =>
    request<CoverLetterListItem[]>(`/cover-letters?limit=${limit}`),

  get: (id: string) =>
    request<CoverLetterResponse>(`/cover-letters/${id}`),

  update: (id: string, content: string) =>
    request<CoverLetterResponse>(`/cover-letters/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  delete: (id: string) =>
    request<void>(`/cover-letters/${id}`, {
      method: "DELETE",
    }),
};

// Application endpoints
export const applicationApi = {
  create: (data: ApplicationCreate) =>
    request<ApplicationResponse>("/applications/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (limit = 50) =>
    request<ApplicationResponse[]>(`/applications/?limit=${limit}`),

  get: (id: string) =>
    request<ApplicationResponse>(`/applications/${id}`),

  update: (id: string, data: Partial<ApplicationCreate>) =>
    request<ApplicationResponse>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/applications/${id}`, {
      method: "DELETE",
    }),
};

// Photo endpoints
export const photoApi = {
  enhance: async (
    file: File,
    background: string = "blur",
    brightness: number = 1.1,
    contrast: number = 1.1,
    sharpness: number = 1.2,
  ): Promise<Blob> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("background", background);
    formData.append("brightness", brightness.toString());
    formData.append("contrast", contrast.toString());
    formData.append("sharpness", sharpness.toString());

    const token = await getIdToken();
    const response = await fetch(`${API_BASE_URL}/photos/enhance`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(data?.detail || "Enhancement failed", response.status, data);
    }
    return response.blob();
  },
};

// Subscription endpoints
export const subscriptionApi = {
  getStatus: () =>
    request<SubscriptionStatus>("/subscriptions/status"),

  getPlanStatus: () =>
    request<PlanStatus>("/subscriptions/plan-status"),

  createCheckout: (successUrl: string, cancelUrl: string) =>
    request<CheckoutSessionResponse>("/subscriptions/checkout", {
      method: "POST",
      body: JSON.stringify({
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    }),

  createPortal: (returnUrl: string) =>
    request<PortalSessionResponse>(`/subscriptions/portal?return_url=${encodeURIComponent(returnUrl)}`, {
      method: "POST",
    }),
};

// Types
interface CompletenessStatus {
  has_cv: boolean;
  has_photo: boolean;
  has_letter: boolean;
  has_application: boolean;
}

interface UserStats {
  cv_count: number;
  letter_count: number;
  photo_count: number;
  application_count: number;
  latest_cv_score: number | null;
  completeness: CompletenessStatus;
}

interface UserProfile {
  uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  plan: "free" | "premium";
  free_uses_remaining: number;
  created_at: string | null;
}

interface CVAnalysisResult {
  id: string;
  user_id: string;
  overall_score: number;
  ats_compatibility: number;
  keyword_matches: KeywordMatch[];
  missing_keywords: string[];
  sections: CVSection[];
  summary: string;
  improvement_tips: string[];
  created_at: string;
}

interface CVAnalysisPreview {
  overall_score: number;
  preview_keywords: KeywordMatch[];
  summary_preview: string;
  upgrade_message: string;
}

interface KeywordMatch {
  keyword: string;
  found: boolean;
  importance: "low" | "medium" | "high";
  suggestion: string | null;
}

interface CVSection {
  name: string;
  score: number;
  feedback: string;
  suggestions: string[];
}

interface CoverLetterRequest {
  job_title: string;
  company_name: string;
  job_description: string;
  tone: "classic" | "startup" | "corporate";
  additional_context?: string;
}

interface CoverLetterResponse {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  tone: string;
  content: string;
  word_count: number;
  created_at: string;
}

interface CoverLetterListItem {
  id: string;
  job_title: string;
  company_name: string;
  tone: string;
  word_count: number;
  created_at: string;
}

interface OptimizedCVSection {
  title: string;
  organization: string;
  period: string;
  bullets: string[];
  details: string | null;
}

interface OptimizedCV {
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_location: string | null;
  contact_linkedin: string | null;
  summary: string;
  experience: OptimizedCVSection[];
  education: OptimizedCVSection[];
  skills: string[];
  certifications: string[];
  estimated_score: number;
}

type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

interface ApplicationCreate {
  company_name: string;
  position: string;
  status: ApplicationStatus;
  job_url?: string;
  cv_analysis_id?: string;
  cover_letter_id?: string;
  notes?: string;
}

interface ApplicationResponse {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  job_url: string | null;
  cv_analysis_id: string | null;
  cover_letter_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SubscriptionStatus {
  plan: "free" | "premium";
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

interface PlanStatus {
  plan: "free" | "premium";
  subscription_status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "none";
  free_uses_remaining: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

interface PortalSessionResponse {
  portal_url: string;
}

export { ApiError };
export type {
  UserProfile,
  UserStats,
  CompletenessStatus,
  CVAnalysisResult,
  CVAnalysisPreview,
  KeywordMatch,
  CVSection,
  OptimizedCV,
  OptimizedCVSection,
  CoverLetterRequest,
  CoverLetterResponse,
  CoverLetterListItem,
  ApplicationCreate,
  ApplicationResponse,
  ApplicationStatus,
  SubscriptionStatus,
  PlanStatus,
};
