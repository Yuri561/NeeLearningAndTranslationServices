import { apiRequest } from "../../lib/apiClient";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  PasswordActionResponse,
  ResetPasswordRequest,
} from "./password.types";

const normalizeResponse = (response: string | { message?: string }, fallback: string) =>
  typeof response === "string" ? response : response?.message ?? fallback;

export const passwordService = {
  forgotPassword: async (data: ForgotPasswordRequest): Promise<PasswordActionResponse> => {
    const response = await apiRequest<string | { message?: string }>(
      "/api/v1/auth/forgot-password",
      { method: "POST", body: JSON.stringify(data) }
    );
    return normalizeResponse(response, "Password reset link requested.");
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<PasswordActionResponse> => {
    const response = await apiRequest<string | { message?: string }>(
      "/api/v1/auth/reset-password",
      { method: "POST", body: JSON.stringify(data) }
    );
    return normalizeResponse(response, "Password reset successfully.");
  },

  changePassword: async (data: ChangePasswordRequest): Promise<PasswordActionResponse> => {
    const response = await apiRequest<string | { message?: string }>(
      "/api/v1/auth/change-password",
      { method: "POST", body: JSON.stringify(data) },
      true
    );
    return normalizeResponse(response, "Password changed successfully.");
  },
};

