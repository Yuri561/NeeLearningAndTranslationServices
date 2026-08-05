import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tutorApi } from "./tutorApi";

export const tutorKeys = {
  services: (teacherId: number) => ["tutor", teacherId, "services"] as const,
  availability: (teacherId: number) => ["tutor", teacherId, "availability"] as const,
  bookings: (teacherId: number) => ["tutor", teacherId, "bookings"] as const,
};

export const useTutorServices = (teacherId?: number, email?: string) =>
  useQuery({
    queryKey: [...tutorKeys.services(teacherId ?? 0), email ?? ""] as const,
    queryFn: () => tutorApi.getServices({ teacherId: teacherId!, email }),
    enabled: Boolean(teacherId),
    retry: 1,
  });

export const useTutorAvailability = (teacherId?: number) =>
  useQuery({
    queryKey: ["tutor-availability", teacherId ?? 0] as const,
    queryFn: () => tutorApi.getAvailability(teacherId!),
    enabled: Boolean(teacherId),
    retry: 1,
  });

export const useTutorBookings = (teacherId?: number) =>
  useQuery({
    queryKey: tutorKeys.bookings(teacherId ?? 0),
    queryFn: () => tutorApi.getBookings(teacherId!),
    enabled: Boolean(teacherId),
    retry: 1,
  });

export const useCreateTutorService = (teacherId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.createService,
    onSuccess: () => {
      if (teacherId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(teacherId) });
    },
  });
};

export const useUpdateTutorService = (teacherId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.updateService,
    onSuccess: () => {
      if (teacherId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(teacherId) });
    },
  });
};

export const useDeleteTutorService = (teacherId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.deleteService,
    onSuccess: () => {
      if (teacherId) queryClient.invalidateQueries({ queryKey: tutorKeys.services(teacherId) });
    },
  });
};

export const useUpdateBookingStatus = (teacherId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tutorApi.updateBookingStatus,
    onSuccess: () => {
      if (teacherId) queryClient.invalidateQueries({ queryKey: tutorKeys.bookings(teacherId) });
    },
  });
};
