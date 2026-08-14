import { z } from "zod";

export const tutorServiceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required."),
  description: z.string().trim().min(1, "Description is required."),
  category: z.string().trim().min(1, "Category is required."),
  language: z.string().trim().min(1, "Language is required."),
  duration_minutes: z.coerce
    .number()
    .int("Duration must be a whole number.")
    .min(0, "Duration cannot be negative."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  meeting_platform: z
    .string()
    .trim()
    .url("Enter a complete meeting URL, including https://.")
    .or(z.literal("")),
  is_active: z.boolean(),
});

export type TutorServiceFormValues = z.input<typeof tutorServiceSchema>;
