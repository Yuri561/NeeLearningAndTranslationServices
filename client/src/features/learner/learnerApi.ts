import { ApiError, apiRequest } from "../../lib/apiClient";
import type {
  Booking,
  CreateBookingPayload,
  AvailabilitySlot,
  LearningServiceWithTutor,
  SupportedLanguagesResponse,
  LearnerProfile,
  TranslationFile,
  TranslateRequest,
  TranslateResponse,
  UpdateLearnerProfilePayload,
} from "./learnerTypes";

type RawLearningServiceTutor = Omit<
  LearningServiceWithTutor["tutor"],
  "id" | "meeting_platform" | "specialization"
> & {
  id?: number | null;
  tutor_id?: number | null;
  meeting_platform?: string[] | null;
  specialization?: string[] | null;
};

type RawLearningServiceWithTutor = Omit<LearningServiceWithTutor, "tutor"> & {
  tutor: RawLearningServiceTutor;
};

type RawAvailabilityByTeacherResponse = AvailabilitySlot[] | {
  availability?: AvailabilitySlot[];
  slots?: AvailabilitySlot[];
};

const normalizeCollection = <T>(
  response: T[] | Record<string, unknown>,
  keys: string[]
) => {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
};

const toNullableNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const toStringArray = (value?: string[] | null) => (Array.isArray(value) ? value : []);

const normalizeLearningService = (
  service: RawLearningServiceWithTutor
): LearningServiceWithTutor => ({
  ...service,
  tutor: {
    ...service.tutor,
    id: toNullableNumber(service.tutor.id ?? service.tutor.tutor_id) ?? 0,
    meeting_platform: toStringArray(service.tutor.meeting_platform),
    specialization: toStringArray(service.tutor.specialization),
  },
});

export const learnerApi = {
  getBookings: async (learnerId: number) => {
    const bookings = await apiRequest<Booking[]>("/api/v1/bookings/", {}, true);
    return bookings.filter(
      (booking) =>
        String(booking.student_id ?? "") === String(learnerId) ||
        String(booking.learner_id ?? "") === String(learnerId)
    );
  },

  createBooking: (payload: CreateBookingPayload) =>
    apiRequest<Booking>(
      "/api/v1/bookings/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    ),

  getServices: async () => {
    const services = await apiRequest<RawLearningServiceWithTutor[]>(
      "/api/v1/services/with-tutors"
    );

    return services.map(normalizeLearningService);
  },

  getAvailability: () =>
    apiRequest<AvailabilitySlot[]>("/api/v1/availability/"),

  getAvailabilityByTeacher: async (teacherId: number) => {
    const response = await apiRequest<RawAvailabilityByTeacherResponse>(
      `/api/v1/availability/tutor/${teacherId}`
    );

    return normalizeCollection<AvailabilitySlot>(response, [
      "availability",
      "slots",
    ]);
  },

  getAvailabilityById: (availabilityId: number) =>
    apiRequest<AvailabilitySlot>(`/api/v1/availability/${availabilityId}`),

  getSupportedLanguages: () =>
    apiRequest<SupportedLanguagesResponse>("/api/v1/translate/languages"),

  translateText: (input: TranslateRequest) =>
    apiRequest<TranslateResponse>("/api/v1/translate/", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  uploadTranslationFile: (formData: FormData) =>
    apiRequest<TranslationFile>(
      "/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
      },
      true
    ),

  getFileById: (fileId: number) =>
    apiRequest<TranslationFile>(`/api/v1/files/${fileId}`, {}, true),

  deleteFileById: (fileId: number) =>
    apiRequest<void>(
      `/api/v1/files/${fileId}`,
      {
        method: "DELETE",
      },
      true
    ),

  getFilesByTranslationRequest: async (translationRequestId: number) => {
    try {
      return await apiRequest<TranslationFile[]>(
        `/api/v1/files/translation-request/${translationRequestId}`,
        {},
        true
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  getMyLearnerProfile: () =>
    apiRequest<LearnerProfile>("/api/v1/learner-profiles/me", {}, true),

  getLearnerProfileByUserId: (userId: number) =>
    apiRequest<LearnerProfile>(
      `/api/v1/learner-profiles/${encodeURIComponent(userId)}`,
      {},
      true
    ),

  updateMyLearnerProfile: (payload: UpdateLearnerProfilePayload) =>
    apiRequest<LearnerProfile>(
      "/api/v1/learner-profiles/me",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true
    ),

  uploadMyProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<LearnerProfile>(
      "/api/v1/learner-profiles/me/profile-picture",
      {
        method: "POST",
        body: formData,
      },
      true
    );
  },

  deleteMyProfilePicture: () =>
    apiRequest<LearnerProfile>(
      "/api/v1/learner-profiles/me/profile-picture",
      { method: "DELETE" },
      true
    ),

  // Compatibility names for code that still uses the former student terminology.
  getMyStudentProfile: () =>
    apiRequest<LearnerProfile>("/api/v1/learner-profiles/me", {}, true),

  updateMyStudentProfile: (payload: UpdateLearnerProfilePayload) =>
    apiRequest<LearnerProfile>(
      "/api/v1/learner-profiles/me",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true
    ),
};
