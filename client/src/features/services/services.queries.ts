import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "../../lib/api/services.api";
import { queryKeys } from "../../lib/query/queryKeys";

export const useAdminServices = () =>
  useQuery({
    queryKey: queryKeys.admin.services,
    queryFn: servicesApi.list,
    retry: 1,
  });

export const useAdminService = (serviceId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.service(serviceId ?? "none"),
    queryFn: () => servicesApi.getById(serviceId as number | string),
    enabled: serviceId !== undefined && serviceId !== "",
    retry: 1,
  });

export const useAdminTutorServices = (tutorId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.tutorServices(tutorId ?? "none"),
    queryFn: () => servicesApi.getByTutor(tutorId as number | string),
    enabled: tutorId !== undefined && tutorId !== "",
    retry: 1,
  });
