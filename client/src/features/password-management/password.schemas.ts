import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(1, "Enter a new password.")
  .min(8, "The password must contain at least 8 characters.")
  .refine((value) => value === value.trim(), {
    message: "The password cannot begin or end with a space.",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "The password must contain an uppercase letter.",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "The password must contain a lowercase letter.",
  })
  .refine((value) => /\d/.test(value), {
    message: "The password must contain a number.",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "The password must contain a special character.",
  });

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Enter your current password.")
      .refine((value) => value === value.trim(), {
        message: "The current password cannot begin or end with a space.",
      }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "The new password must be different from the current password.",
    path: ["newPassword"],
  });

