import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/apiClient";
import { getPasswordErrorMessage } from "./password.errors";

describe("password error messages", () => {
  it("does not reveal account existence during forgot-password", () => {
    expect(getPasswordErrorMessage(new ApiError("Email was not found", 404), "forgot"))
      .toBe("We could not send the reset link. Please try again.");
  });

  it("maps invalid reset tokens to a safe message", () => {
    expect(getPasswordErrorMessage(new ApiError("Invalid token", 400), "reset"))
      .toContain("invalid or has expired");
  });

  it("maps an explicitly incorrect current password", () => {
    expect(getPasswordErrorMessage(new ApiError("Current password is incorrect", 400), "change"))
      .toBe("The current password is incorrect.");
  });

  it("maps rate limiting without exposing backend details", () => {
    expect(getPasswordErrorMessage(new ApiError("Internal limiter data", 429), "reset"))
      .toBe("Too many attempts. Please wait before trying again.");
  });
});

