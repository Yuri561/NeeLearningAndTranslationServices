import { API_BASE_PATH } from "../../config/api";
import { apiRequest } from "../apiClient";
import type { AdminAvailability } from "../../types/adminApi";
import { normalizeAvailability, unwrapList } from "./responseAdapters";

export const availabilityApi = {
  list: async () => {
    const response = await apiRequest<unknown>(`${API_BASE_PATH}/availability/`, {}, true);
    return unwrapList(response).map(normalizeAvailability);
  },

  getById: async (availabilityId: number | string) => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/availability/${encodeURIComponent(String(availabilityId))}`,
      {},
      true
    );
    return normalizeAvailability(response);
  },

  getByTeacher: async (
    teacherId: number | string
  ): Promise<AdminAvailability[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/availability/teacher/${encodeURIComponent(String(teacherId))}/`,
      {},
      true
    );
    return unwrapList(response).map(normalizeAvailability);
  },
};
