import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/apiClient", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "../../lib/apiClient";
import { passwordService } from "./password.service";

const request = vi.mocked(apiRequest);

describe("password service", () => {
  beforeEach(() => request.mockReset());

  it("calls the public forgot-password endpoint with only the email", async () => {
    request.mockResolvedValue("Sent");
    await passwordService.forgotPassword({ email: "user@example.com" });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email: "user@example.com" }) }
    );
  });

  it("submits the URL token and new password without confirmation", async () => {
    request.mockResolvedValue("Reset");
    await passwordService.resetPassword({ token: "one-time-token", new_password: "SecurePassword123!" });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token: "one-time-token", new_password: "SecurePassword123!" }),
      }
    );
  });

  it("marks change-password as authenticated and sends exact API field names", async () => {
    request.mockResolvedValue("Changed");
    await passwordService.changePassword({
      current_password: "CurrentPassword123!",
      new_password: "NewPassword456!",
    });
    expect(request).toHaveBeenCalledWith(
      "/api/v1/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          current_password: "CurrentPassword123!",
          new_password: "NewPassword456!",
        }),
      },
      true
    );
  });
});

