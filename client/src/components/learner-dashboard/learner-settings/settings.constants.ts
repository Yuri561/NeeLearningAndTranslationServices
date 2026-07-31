export const MAX_PICTURE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_PICTURE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "ht", label: "Haitian Creole" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
];

export const initialsFrom = (name?: string) =>
  (name ?? "Learner")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "L";

export const checkPasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
};

