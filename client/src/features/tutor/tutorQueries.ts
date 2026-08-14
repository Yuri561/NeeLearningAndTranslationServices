import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tutorApi } from "./tutorApi";

export const tutorKeys = {
  services: (tutorId: number) => ["tutor", tutorId, "services"] as const,
  availability: (tutorId: number) => ["tutor", tutorId, "availability"] as const,
  bookings: (tutorId: number) => ["tutor", tutorId, "bookings"] as const,
};

export const useTutorServices = (tutorId?: number, email?: string) =>
  useQuery({
    queryKey: [...tutorKeys.services(tutorId ?? 0), email ?? ""] as const,
    queryFn: () => tutorApi.getServices({ tutorId: tutorId!, email }),
    enabled: Boolean(tutorId),
    retry: 1,
  });

export const useTutorAvailability = (tutorId?: number) =>
  useQuery({
    queryKey: ["tutor-availability", tutorId ?? 0] as const,
    queryFn: () => tutorApi.getAvailability(tutorId!),
    enabled: Boolean(tutorId),
    retry: 1,
  });

export const useTutorBookings = (tutorId?: number) =>
  useQuery({
    queryKey: tutorKeys.bookings(tutorId ?? 0),
    queryFn: () => tutorApi.getBookings(tutorId!),
    enabled: Boolean(tutorId),
    retry: 1,
  });

export const useCreateTutorService = (tutorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.createService,
    onSuccess: () => {
      if (tutorId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(tutorId) });
      queryClient.invalidateQueries({ queryKey: ["learner", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

export const useUpdateTutorService = (tutorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.updateService,
    onSuccess: () => {
      if (tutorId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(tutorId) });
      queryClient.invalidateQueries({ queryKey: ["learner", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

export const useDeleteTutorService = (tutorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.deleteService,
    onSuccess: () => {
      if (tutorId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(tutorId) });
      queryClient.invalidateQueries({ queryKey: ["learner", "services"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

export const useUpdateBookingStatus = (tutorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.updateBookingStatus,
    onSuccess: () => {
      if (tutorId) queryClient.invalidateQueries({ queryKey: tutorKeys.bookings(tutorId) });
      queryClient.invalidateQueries({ queryKey: ["learner"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
  });
};
