import type { AuthUser } from "../auth/authTypes";
import type {
  AvailabilitySlot,
  Booking,
  LearningServiceWithTutor,
} from "../learner/learnerTypes";

export type AdminUser = AuthUser;

export type CreateTutorInput = {
  full_name: string;
  email: string;
  password: string;
};

export type TutorProfileUser = {
  id?: number;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  created_at?: string;
};

export type TutorProfile = {
  id: number;
  user_id?: number | null;
  full_name: string;
  email?: string | null;
  bio?: string | null;
  specialization: string[];
  years_of_experience?: number | null;
  hourly_rate?: number | null;
  meeting_platform: string[];
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string | null;
};

export type AdminDashboardData = {
  users: AdminUser[];
  services: LearningServiceWithTutor[];
  availability: AvailabilitySlot[];
  bookings: Booking[];
};
