import { apiRequest } from "../../lib/apiClient";
import type {
  ServicePayload,
  TutorAvailability,
  TutorBooking,
  TutorService,
} from "./tutorTypes";

type ServiceWithTutor = TutorService & {
  tutor?: {
    tutor_id?: number | string | null;
    id?: number | string | null;
    email?: string | null;
  } | null;
};

const normalizeTutorService = (service: ServiceWithTutor): TutorService => ({
  id: Number(service.id),
  name: service.name,
  description: service.description,
  category: service.category,
  language: service.language,
  duration_minutes: service.duration_minutes,
  price: service.price,
  meeting_platform: service.meeting_platform ?? null,
  is_active: service.is_active,
  created_at: service.created_at,
});

export const tutorApi = {
  getServices: async ({ tutorId }: { tutorId: number; email?: string }) => {
    const services = await apiRequest<ServiceWithTutor[]>(
      `/api/v1/services/tutor/${encodeURIComponent(tutorId)}`,
      {},
      true
    );
    return services.map(normalizeTutorService);
  },

  getService: (serviceId: number) =>
    apiRequest<TutorService>(`/api/v1/services/${serviceId}`, {}, true),

  createService: (payload: ServicePayload) =>
    apiRequest<TutorService>(
      "/api/v1/services/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    ),

  updateService: ({ serviceId, payload }: { serviceId: number; payload: ServicePayload }) =>
    apiRequest<TutorService>(
      `/api/v1/services/${serviceId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true
    ),

  deleteService: (serviceId: number) =>
    apiRequest<unknown>(
      `/api/v1/services/${serviceId}`,
      {
        method: "DELETE",
      },
      true
    ),

  getAvailability: (tutorId: number) =>
    apiRequest<TutorAvailability[]>(
      `/api/v1/availability/tutor/${tutorId}`,
      {},
      true
    ),

  getBookings: async (tutorId: number) => {
    return apiRequest<TutorBooking[]>(
      `/api/v1/bookings/tutor/${encodeURIComponent(tutorId)}`,
      {},
      true
    );
  },

  updateBookingStatus: ({ bookingId, status }: { bookingId: number; status: string }) =>
    apiRequest<TutorBooking>(
      `/api/v1/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      true
    ),
};
