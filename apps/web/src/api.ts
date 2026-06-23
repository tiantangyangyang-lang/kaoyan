import type {
  AuthUser,
  Math2QuestionDetail,
  Math2QuestionPage,
  PaperSessionMap,
  QuestionStateMap,
  QuestionAnimation,
  SubjectCode,
} from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000/api";

export class ApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: options.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as {
    error?: string;
  } & T;
  if (!response.ok) throw new ApiError(payload.error ?? "request_failed");
  return payload;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await apiRequest<{ user: AuthUser }>("/auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.code === "authentication_required") {
      return null;
    }
    return null;
  }
}

export async function registerAccount(email: string, password: string) {
  return apiRequest<{ status: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function resendVerification(email: string) {
  return apiRequest<{ status: string }>("/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyAccount(token: string) {
  return apiRequest<{ user: AuthUser }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function loginAccount(email: string, password: string) {
  return apiRequest<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAccount() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}

export async function saveCloudLearningState(
  subject: SubjectCode,
  questionStates: QuestionStateMap,
  paperSessions: PaperSessionMap,
) {
  return apiRequest<{ status: string }>(`/learning-state/${subject}`, {
    method: "PUT",
    body: JSON.stringify({ questionStates, paperSessions }),
  });
}

export async function loadCloudLearningState(subject: SubjectCode) {
  const result = await apiRequest<{
    data: {
      questionStates: QuestionStateMap;
      paperSessions: PaperSessionMap;
      updatedAt: string;
    } | null;
  }>(`/learning-state/${subject}`);
  return result.data;
}

export async function loadMath2QuestionPage(input: {
  page?: number;
  pageSize?: number;
  year?: number;
  type?: "multiple_choice" | "fill_in_blank" | "solution";
} = {}) {
  const params = new URLSearchParams();
  if (input.page !== undefined) params.set("page", String(input.page));
  if (input.pageSize !== undefined) {
    params.set("pageSize", String(input.pageSize));
  }
  if (input.year !== undefined) params.set("year", String(input.year));
  if (input.type !== undefined) params.set("type", input.type);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const result = await apiRequest<{ data: Math2QuestionPage }>(
    `/content/math2/questions${suffix}`,
    { credentials: "omit" },
  );
  return result.data;
}

export async function loadMath2QuestionDetail(stableId: string) {
  const result = await apiRequest<{ data: Math2QuestionDetail }>(
    `/content/math2/questions/${encodeURIComponent(stableId)}`,
    { credentials: "omit" },
  );
  return result.data;
}

export async function loadQuestionAnimation(
  questionId: string,
  signal?: AbortSignal,
) {
  const result = await apiRequest<{ animation: QuestionAnimation }>(
    `/question-animations/${encodeURIComponent(questionId)}`,
    { signal },
  );
  return result.animation;
}

export async function getQuestionAnimationAvailability(
  questionId: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ available: boolean }>(
    `/question-animations/${encodeURIComponent(questionId)}/availability`,
    { signal },
  );
}
