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
  CVAnalysisResult,
  CVAnalysisPreview,
  KeywordMatch,
  CVSection,
  CoverLetterRequest,
  CoverLetterResponse,
  CoverLetterListItem,
  SubscriptionStatus,
  PlanStatus,
};
