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

  getByTutor: async (
    tutorId: number | string
  ): Promise<AdminAvailability[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/availability/tutor/${encodeURIComponent(String(tutorId))}`,
      {},
      true
    );
    return unwrapList(response).map(normalizeAvailability);
  },
};
