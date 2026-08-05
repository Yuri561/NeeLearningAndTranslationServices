import { ApiError } from "../../lib/apiClient";

const readableApiMessage = (message: string) =>
  message
    .split(",")[0]
    .replace(/^(?:\d+\.)?(?:current_password|new_password|email|token):\s*/i, "")
    .trim();

export type PasswordAction = "forgot" | "reset" | "change";

export const getPasswordErrorMessage = (
  error: unknown,
  action: PasswordAction
) => {
  if (!(error instanceof ApiError)) {
    return "We could not complete this request. Please try again.";
  }

  const safeMessage = readableApiMessage(error.message);

  if (error.status === 429) return "Too many attempts. Please wait before trying again.";
  if (error.status >= 500) return "We could not complete this request. Please try again.";

  if (action === "forgot") {
    return "We could not send the reset link. Please try again.";
  }

  if (action === "reset" && [400, 401, 403, 404].includes(error.status)) {
    return safeMessage.toLowerCase().includes("expired")
      ? "This password-reset link has expired. Please request a new one."
      : "This password-reset link is invalid or has expired. Please request a new one.";
  }

  if (action === "change" && error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (action === "change" && error.status === 403) {
    return "This password change is not allowed for your account.";
  }
  if (
    action === "change" &&
    error.status === 400 &&
    /current password|incorrect password/i.test(safeMessage)
  ) {
    return "The current password is incorrect.";
  }

  if ([400, 422].includes(error.status) && safeMessage) return safeMessage;
  return "We could not complete this request. Please try again.";
};

