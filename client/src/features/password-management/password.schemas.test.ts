import { describe, expect, it } from "vitest";
import { changePasswordSchema, emailSchema, resetPasswordSchema } from "./password.schemas";

const strongPassword = "SecurePassword123!";

describe("password-management schemas", () => {
  it("normalizes and validates email addresses", () => {
    expect(emailSchema.parse(" user@example.com ")).toBe("user@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("requires matching reset passwords", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: strongPassword,
      confirmPassword: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("rejects leading or trailing password spaces", () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: ` ${strongPassword}`,
        confirmPassword: ` ${strongPassword}`,
      }).success
    ).toBe(false);
  });

  it("requires a new password to differ from the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: strongPassword,
      newPassword: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "newPassword")).toBe(true);
    }
  });
});

