import { API_BASE_PATH } from "../../config/api";
import { apiRequest } from "../apiClient";
import type { AdminService } from "../../types/adminApi";
import { normalizeService, unwrapList } from "./responseAdapters";

export const servicesApi = {
  list: async () => {
    const response = await apiRequest<unknown>(`${API_BASE_PATH}/services/`, {}, true);
    return unwrapList(response).map(normalizeService);
  },

  getById: async (serviceId: number | string) => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/services/${encodeURIComponent(String(serviceId))}`,
      {},
      true
    );
    return normalizeService(response);
  },

  getByTeacher: async (teacherId: number | string): Promise<AdminService[]> => {
    const response = await apiRequest<unknown>(
      `${API_BASE_PATH}/services/teacher/${encodeURIComponent(String(teacherId))}/`,
      {},
      true
    );
    return unwrapList(response).map(normalizeService);
  },
};
