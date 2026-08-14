import { apiRequest } from "../../lib/apiClient";
import { learnerApi } from "../learner/learnerApi";
import type { AvailabilitySlot, Booking } from "../learner/learnerTypes";
import type {
  AdminUser,
  CreateTutorInput,
  TutorProfile,
  TutorProfileUser,
} from "./adminTypes";

type RawTutorProfile = Partial<
  Omit<TutorProfile, "full_name" | "specialization" | "meeting_platform">
> & {
  full_name?: string | null;
  email?: string | null;
  name?: string | null;
  specialization?: string[] | string | null;
  meeting_platform?: string[] | string | null;
  user?: TutorProfileUser | null;
};

const toStringArray = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeTutorProfile = (profile: RawTutorProfile): TutorProfile => ({
  id: Number(profile.id ?? profile.user_id ?? profile.user?.id ?? 0),
  user_id: profile.user_id ?? profile.user?.id ?? null,
  full_name:
    profile.full_name ??
    profile.name ??
    profile.user?.full_name ??
    `Tutor #${profile.id ?? profile.user_id ?? profile.user?.id ?? "Unknown"}`,
  email: profile.email ?? profile.user?.email ?? null,
  bio: profile.bio ?? null,
  specialization: toStringArray(profile.specialization),
  years_of_experience: profile.years_of_experience ?? null,
  hourly_rate: profile.hourly_rate ?? null,
  meeting_platform: toStringArray(profile.meeting_platform),
  is_verified: Boolean(profile.is_verified),
  is_active: profile.is_active ?? profile.user?.is_active ?? true,
  created_at: profile.created_at ?? profile.user?.created_at ?? null,
});

export const adminApi = {
  createTutor: (input: CreateTutorInput) =>
    apiRequest<AdminUser>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        role: "tutor",
      }),
    }),

  getTutorProfiles: async () => {
    const profiles = await apiRequest<RawTutorProfile[]>(
      "/api/v1/tutor-profiles/",
      {},
      true
    );

    return profiles.map(normalizeTutorProfile);
  },

  getUsers: () => apiRequest<AdminUser[]>("/api/v1/users/", {}, true),
  getBookings: () => apiRequest<Booking[]>("/api/v1/bookings/", {}, true),
  getServices: learnerApi.getServices,
  getAvailability: () =>
    apiRequest<AvailabilitySlot[]>("/api/v1/availability/", {}, true),
};
