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
  is_active: service.is_active,
  created_at: service.created_at,
});

export const tutorApi = {
  getServices: async ({
    teacherId,
    email,
  }: {
    teacherId: number;
    email?: string;
  }) => {
    const services = await apiRequest<ServiceWithTutor[]>(
      "/api/v1/services/with-tutors",
      {},
      true
    );
    const normalizedEmail = email?.toLowerCase();
    return services
      .filter((service) => {
        const tutorId = service.tutor?.tutor_id ?? service.tutor?.id;
        const tutorEmail = service.tutor?.email?.toLowerCase();
        return (
          String(tutorId ?? "") === String(teacherId) ||
          (normalizedEmail && tutorEmail === normalizedEmail)
        );
      })
      .map(normalizeTutorService);
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

  getAvailability: (teacherId: number) =>
    apiRequest<TutorAvailability[]>(
      `/api/v1/availability/tutor/${teacherId}`,
      {},
      true
    ),

  getBookings: async (teacherId: number) => {
    const bookings = await apiRequest<TutorBooking[]>("/api/v1/bookings/", {}, true);
    return bookings.filter(
      (booking) =>
        String(booking.teacher_id ?? "") === String(teacherId) ||
        String(booking.tutor_id ?? "") === String(teacherId)
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
