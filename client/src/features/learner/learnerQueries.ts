import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/apiClient";
import { learnerApi } from "./learnerApi";
import { toLocalAvailability } from "../availability/availability.utils";
import type { Booking, LearnerProfile } from "./learnerTypes";

export const learnerKeys = {
  bookings: (learnerId: number) => ["learner", learnerId, "bookings"] as const,
  services: ["learner", "services"] as const,
  availability: ["learner", "availability"] as const,
  tutorAvailability: (tutorId: number) =>
    ["tutor-availability", tutorId] as const,
  availabilityDetail: (availabilityId: number) =>
    ["learner", "availability", availabilityId] as const,
  translationLanguages: ["learner", "translation", "languages"] as const,
  translationFile: (fileId: number) => ["learner", "translation", "file", fileId] as const,
  translationRequestFilesRoot: ["learner", "translation", "request-files"] as const,
  translationRequestFiles: (translationRequestId: number) =>
    ["learner", "translation", "request-files", translationRequestId] as const,
  learnerTranslationRequests: (learnerId: number) =>
    ["learner", "translation", "requests", learnerId] as const,
  profile: ["learner", "profile", "me"] as const,
  profileByUserId: (userId: number) => ["learner", "profile", "user", userId] as const,
};

export const useLearnerBookings = (learnerId?: number) =>
  useQuery({
    queryKey: learnerKeys.bookings(learnerId ?? 0),
    queryFn: () => learnerApi.getBookings(learnerId!),
    enabled: Boolean(learnerId),
    staleTime: 30_000,
  });

export const useCreateBooking = (learnerId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: learnerApi.createBooking,
    onSuccess: (booking) => {
      if (!learnerId) return;
      const normalizedBooking: Booking = {
        ...booking,
        learner_id: booking.learner_id ?? learnerId,
        tutor_id: booking.tutor_id ?? null,
      };

      queryClient.setQueryData<Booking[]>(
        learnerKeys.bookings(learnerId),
        (current = []) => [
          normalizedBooking,
          ...current.filter((item) => item.id !== normalizedBooking.id),
        ],
      );
      queryClient.invalidateQueries({ queryKey: learnerKeys.bookings(learnerId) });
    },
  });
};

export const useLearningServices = () =>
  useQuery({
    queryKey: learnerKeys.services,
    queryFn: learnerApi.getServices,
    staleTime: 5 * 60_000,
  });

export const useMyLearnerProfile = () =>
  useQuery({
    queryKey: learnerKeys.profile,
    queryFn: async () => {
      try {
        return await learnerApi.getMyLearnerProfile();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 2,
    staleTime: 5 * 60_000,
  });

export const useUpdateMyLearnerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: learnerApi.updateMyLearnerProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData<LearnerProfile>(learnerKeys.profile, profile);
      queryClient.invalidateQueries({ queryKey: learnerKeys.profile });
    },
  });
};

export const useLearnerProfileByUserId = (userId?: number) =>
  useQuery({
    queryKey: learnerKeys.profileByUserId(userId ?? 0),
    queryFn: () => learnerApi.getLearnerProfileByUserId(userId!),
    enabled: Number.isInteger(userId) && (userId ?? 0) > 0,
    staleTime: 5 * 60_000,
  });

const updateCachedProfile = (
  queryClient: ReturnType<typeof useQueryClient>,
  profile: LearnerProfile
) => {
  queryClient.setQueryData<LearnerProfile>(learnerKeys.profile, profile);
  queryClient.setQueryData<LearnerProfile>(
    learnerKeys.profileByUserId(profile.user_id),
    profile
  );
};

export const useUploadMyProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: learnerApi.uploadMyProfilePicture,
    onSuccess: (profile) => updateCachedProfile(queryClient, profile),
  });
};

export const useDeleteMyProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: learnerApi.deleteMyProfilePicture,
    onSuccess: (profile) => updateCachedProfile(queryClient, profile),
  });
};

export const useAllAvailability = () =>
  useQuery({
    queryKey: learnerKeys.availability,
    queryFn: () => learnerApi.getAllAvailability(),
    select: (slots) => slots.map(toLocalAvailability),
    staleTime: 5 * 60_000,
  });

export const useTutorAvailability = (tutorId?: number | null) =>
  useQuery({
    queryKey: learnerKeys.tutorAvailability(tutorId ?? 0),
    queryFn: () => learnerApi.getAvailabilityByTutor(tutorId!),
    select: (slots) => slots.map(toLocalAvailability),
    enabled: Boolean(tutorId),
    staleTime: 5 * 60_000,
  });

export const useAvailabilityDetails = (availabilityIds: number[]) =>
  useQueries({
    queries: [...new Set(availabilityIds)].map((availabilityId) => ({
      queryKey: learnerKeys.availabilityDetail(availabilityId),
      queryFn: () => learnerApi.getAvailabilityById(availabilityId),
      staleTime: 5 * 60_000,
    })),
  });

export const useTranslationLanguages = () =>
  useQuery({
    queryKey: learnerKeys.translationLanguages,
    queryFn: learnerApi.getSupportedLanguages,
    staleTime: 60 * 60_000,
  });

export const useTranslateText = () =>
  useMutation({
    mutationFn: learnerApi.translateText,
  });

export const useUploadTranslationFile = () =>
  useMutation({
    mutationFn: learnerApi.uploadTranslationFile,
  });

export const useDeleteTranslationFile = (translationRequestId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: learnerApi.deleteFileById,
    onSuccess: (_deleted, fileId) => {
      queryClient.removeQueries({ queryKey: learnerKeys.translationFile(fileId) });
      if (translationRequestId) {
        queryClient.invalidateQueries({
          queryKey: learnerKeys.translationRequestFiles(translationRequestId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: learnerKeys.translationRequestFilesRoot,
        });
      }
    },
  });
};

export const useTranslationFile = (fileId?: number) =>
  useQuery({
    queryKey: learnerKeys.translationFile(fileId ?? 0),
    queryFn: () => learnerApi.getFileById(fileId!),
    enabled: Number.isInteger(fileId) && (fileId ?? 0) > 0,
    staleTime: 5 * 60_000,
  });

export const useTranslationFileDetails = (fileIds: number[]) =>
  useQueries({
    queries: [...new Set(fileIds)]
      .filter((fileId) => Number.isFinite(fileId) && fileId > 0)
      .map((fileId) => ({
        queryKey: learnerKeys.translationFile(fileId),
        queryFn: () => learnerApi.getFileById(fileId),
        staleTime: 5 * 60_000,
      })),
  });

export const useTranslationRequestFiles = (translationRequestId?: number) =>
  useQuery({
    queryKey: learnerKeys.translationRequestFiles(translationRequestId ?? 0),
    queryFn: () => learnerApi.getFilesByTranslationRequest(translationRequestId!),
    enabled: Boolean(translationRequestId),
    staleTime: 5 * 60_000,
  });

export const useTranslationRequestFileLists = (translationRequestIds: number[]) =>
  useQueries({
    queries: [...new Set(translationRequestIds)]
      .filter((translationRequestId) => Number.isInteger(translationRequestId) && translationRequestId > 0)
      .map((translationRequestId) => ({
        queryKey: learnerKeys.translationRequestFiles(translationRequestId),
        queryFn: () => learnerApi.getFilesByTranslationRequest(translationRequestId),
        staleTime: 5 * 60_000,
      })),
  });
