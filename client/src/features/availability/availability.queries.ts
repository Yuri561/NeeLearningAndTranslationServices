import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { availabilityService } from "./availability.api";
import type { CreateAvailabilityRequest, UpdateAvailabilityRequest } from "./availability.types";
import { availabilityApi as adminAvailabilityApi } from "../../lib/api/availability.api";
import { queryKeys } from "../../lib/query/queryKeys";

export const availabilityKeys = {
  tutor: (tutorId: number) => ["tutor-availability", tutorId] as const,
};

export const useTutorAvailabilityView = (tutorId?: number) =>
  useQuery({
    queryKey: availabilityKeys.tutor(tutorId ?? 0),
    queryFn: () => availabilityService.getByTutorId(tutorId!),
    enabled: Boolean(tutorId),
    retry: 1,
  });

const useSyncAvailability = (tutorId?: number) => {
  const queryClient = useQueryClient();
  return () => {
    if (!tutorId) return Promise.resolve();
    const ownAvailability = queryClient.invalidateQueries({
      queryKey: availabilityKeys.tutor(tutorId),
    });
    queryClient.invalidateQueries({ queryKey: ["learner", "availability"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "availability"] });
    return ownAvailability;
  };
};

export const useCreateAvailability = (tutorId?: number) => {
  const sync = useSyncAvailability(tutorId);
  return useMutation({
    mutationFn: (payload: CreateAvailabilityRequest[]) => availabilityService.createBulk(payload),
    onSuccess: sync,
  });
};

export const useUpdateAvailability = (tutorId?: number) => {
  const sync = useSyncAvailability(tutorId);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAvailabilityRequest }) =>
      availabilityService.update(id, data),
    onSuccess: sync,
  });
};

export const useDeleteAvailability = (tutorId?: number) => {
  const sync = useSyncAvailability(tutorId);
  return useMutation({ mutationFn: availabilityService.delete, onSuccess: sync });
};

// Existing admin dashboard queries use the normalized admin response model.
export const useAdminAvailability = () =>
  useQuery({
    queryKey: queryKeys.admin.availability,
    queryFn: adminAvailabilityApi.list,
    retry: 1,
  });

export const useAdminAvailabilitySlot = (availabilityId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.availabilitySlot(availabilityId ?? "none"),
    queryFn: () => adminAvailabilityApi.getById(availabilityId as number | string),
    enabled: availabilityId !== undefined && availabilityId !== "",
    retry: 1,
  });

export const useAdminTutorAvailability = (tutorId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.tutorAvailability(tutorId ?? "none"),
    queryFn: () => adminAvailabilityApi.getByTutor(tutorId as number | string),
    enabled: tutorId !== undefined && tutorId !== "",
    retry: 1,
  });
