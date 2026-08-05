import type { WeekDay } from "../availability/availability.types";

export type Booking = {
  id: number;
  learner_id?: number;
  student_id?: number;
  service_id: number | null;
  teacher_id: number | null;
  tutor_id?: number | null;
  availability_id: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string | null;
};

export type CreateBookingPayload = {
  student_id: number;
  learner_id?: number;
  service_id?: number | null;
  teacher_id?: number | null;
  tutor_id?: number | null;
  availability_id?: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "Pending" | "Confirmed" | "Cancelled";
  notes?: string;
};

export type LearningService = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
  language: string;
};

export type ServiceTutor = {
  id: number;
  full_name: string;
  email?: string;
  bio: string | null;
  specialization: string[];
  years_of_experience: number;
  hourly_rate: number | null;
  meeting_platform: string[];
  is_verified: boolean;
};

export type LearningServiceWithTutor = LearningService & {
  is_active: boolean;
  tutor: ServiceTutor;
};

export type AvailabilitySlot = {
  id: number;
  day: WeekDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
  teacher_id?: number | null;
  booking_date?: string | null;
};

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface SupportedLanguagesResponse {
  success: boolean;
  languages: SupportedLanguage[];
}

export interface TranslateRequest {
  texts: string[];
  target: string;
  provider?: string;
}

export interface TranslationItem {
  original: string;
  translated: string;
  provider: string;
  error: string | null;
}

export interface TranslateResponse {
  translations: TranslationItem[];
  provider: string;
  count: number;
}

export type TranslationFile = {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  uploaded_by_user_id: number;
  related_translation_request_id: number | null;
};

export type LearnerProfile = {
  id: number;
  user_id: number;
  bio: string | null;
  learning_goals: string | null;
  preferred_language: string | null;
  profile_picture_url: string | null;
  created_at: string;
};

export type UpdateLearnerProfilePayload = {
  bio: string;
  learning_goals: string;
  preferred_language: string;
};

/** @deprecated Use LearnerProfile. Kept as an alias for older imports. */
export type StudentProfile = LearnerProfile;

/** @deprecated Use UpdateLearnerProfilePayload. Kept as an alias for older imports. */
export type UpdateStudentProfilePayload = UpdateLearnerProfilePayload;

export type LearnerMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "red" | "amber" | "green";
};

export type MockLesson = {
  id: number;
  title: string;
  category: string;
  duration: string;
  level: string;
  progress?: number;
};
