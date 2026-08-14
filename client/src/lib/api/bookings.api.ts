import { API_BASE_PATH } from "../../config/api";
import { apiRequest } from "../apiClient";
import type { AdminBooking } from "../../types/adminApi";
import { normalizeBooking, unwrapList } from "./responseAdapters";

export const bookingsApi = {
  list: async () => {
    const response = await apiRequest<unknown>(`${API_BASE_PATH}/bookings/`, {}, true);
    return unwrapList(response).map(normalizeBooking);
  },

  getById: async (bookingId: number | string) => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/bookings/${encodeURIComponent(String(bookingId))}`,
      {},
      true
    );
    return normalizeBooking(response);
  },

  getByLearner: async (learnerId: number | string): Promise<AdminBooking[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/bookings/learner/${encodeURIComponent(String(learnerId))}`,
      {},
      true
    );
    return unwrapList(response).map(normalizeBooking);
  },

  getByTutor: async (tutorId: number | string): Promise<AdminBooking[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/bookings/tutor/${encodeURIComponent(String(tutorId))}`,
      {},
      true
    );
    return unwrapList(response).map(normalizeBooking);
  },
};
