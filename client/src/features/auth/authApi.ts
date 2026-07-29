import { apiRequest } from "../../lib/apiClient";
import type {
  AuthToken,
  AuthUser,
  ChangePasswordInput,
  ChangePasswordResult,
  GoogleAuthorization,
  LoginInput,
  RegisterInput,
} from "./authTypes";

type AuthUserRecord = Partial<AuthUser> & {
  fullName?: unknown;
  name?: unknown;
};

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : value === undefined || value === null ? fallback : String(value);

const normalizeAuthUser = (value: unknown): AuthUser => {
  const record = value && typeof value === "object" ? (value as AuthUserRecord) : {};

  return {
    id: Number(record.id ?? 0),
    email: text(record.email),
    full_name: text(record.full_name ?? record.fullName ?? record.name),
    role: record.role ?? "learner",
    auth_provider: text(record.auth_provider),
    is_active: Boolean(record.is_active),
    created_at: text(record.created_at),
  };
};

export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<unknown>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(normalizeAuthUser),

  login: (input: LoginInput) =>
    apiRequest<AuthToken>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  logout: () =>
    apiRequest<unknown>(
      "/api/v1/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true
    ),

  getMe: () => apiRequest<unknown>("/api/v1/auth/me", {}, true).then(normalizeAuthUser),

  changePassword: async (input: ChangePasswordInput): Promise<ChangePasswordResult> => {
    const response = await apiRequest<string | ChangePasswordResult>(
      "/api/v1/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      true
    );

    return typeof response === "string"
      ? { message: response }
      : { message: response?.message ?? "Password changed successfully" };
  },

  getGoogleAuthorization: () =>
    apiRequest<GoogleAuthorization>("/api/v1/auth/google/login"),

  exchangeGoogleCode: (code: string) =>
    apiRequest<AuthToken>(
      `/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`
    ),
};
