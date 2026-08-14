import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "../../lib/api/bookings.api";
import { queryKeys } from "../../lib/query/queryKeys";

export const useAdminBookings = () =>
  useQuery({
    queryKey: queryKeys.admin.bookings,
    queryFn: bookingsApi.list,
    retry: 1,
  });

export const useAdminBooking = (bookingId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.booking(bookingId ?? "none"),
    queryFn: () => bookingsApi.getById(bookingId as number | string),
    enabled: bookingId !== undefined && bookingId !== "",
    retry: 1,
  });

export const useAdminLearnerBookings = (learnerId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.learnerBookings(learnerId ?? "none"),
    queryFn: () => bookingsApi.getByLearner(learnerId as number | string),
    enabled: learnerId !== undefined && learnerId !== "",
    retry: 1,
  });

export const useAdminTutorBookings = (tutorId?: number | string) =>
  useQuery({
    queryKey: queryKeys.admin.tutorBookings(tutorId ?? "none"),
    queryFn: () => bookingsApi.getByTutor(tutorId as number | string),
    enabled: tutorId !== undefined && tutorId !== "",
    retry: 1,
  });
