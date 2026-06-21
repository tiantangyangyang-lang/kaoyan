import type {
  AuthUser,
  PaperSessionMap,
  QuestionStateMap,
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
    credentials: "include",
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
