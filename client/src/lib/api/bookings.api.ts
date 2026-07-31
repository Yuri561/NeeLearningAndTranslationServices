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

  getByStudent: async (studentId: number | string): Promise<AdminBooking[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/bookings/student/${encodeURIComponent(String(studentId))}/`,
      {},
      true
    );
    return unwrapList(response).map(normalizeBooking);
  },

  getByTeacher: async (teacherId: number | string): Promise<AdminBooking[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/bookings/teacher/${encodeURIComponent(String(teacherId))}/`,
      {},
      true
    );
    return unwrapList(response).map(normalizeBooking);
  },
};
