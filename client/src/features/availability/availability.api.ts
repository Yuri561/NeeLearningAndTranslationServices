import { API_BASE_PATH } from "../../config/api";
import { apiRequest } from "../../lib/apiClient";
import type {
  Availability,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
} from "./availability.types";

const path = `${API_BASE_PATH}/availability`;

export const availabilityService = {
  getById: (availabilityId: number) =>
    apiRequest<Availability>(`${path}/${availabilityId}`, {}, true),
  getByTutorId: (tutorId: number) =>
    apiRequest<Availability[]>(`${path}/tutor/${tutorId}`, {}, true),
  createBulk: (availability: CreateAvailabilityRequest[]) =>
    apiRequest<Availability[]>(
      `${path}/bulk`,
      { method: "POST", body: JSON.stringify(availability) },
      true
    ),
  update: (availabilityId: number, data: UpdateAvailabilityRequest) =>
    apiRequest<Availability>(
      `${path}/${availabilityId}`,
      { method: "PUT", body: JSON.stringify(data) },
      true
    ),
  delete: (availabilityId: number) =>
    apiRequest<string>(`${path}/${availabilityId}`, { method: "DELETE" }, true),
};
