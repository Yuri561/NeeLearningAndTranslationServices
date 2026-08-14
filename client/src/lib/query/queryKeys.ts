export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  admin: {
    services: ["admin", "services"] as const,
    service: (id: number | string) => ["admin", "services", id] as const,
    tutorServices: (tutorId: number | string) =>
      ["admin", "services", "tutor", tutorId] as const,
    availability: ["admin", "availability"] as const,
    availabilitySlot: (id: number | string) => ["admin", "availability", id] as const,
    tutorAvailability: (tutorId: number | string) =>
      ["admin", "availability", "tutor", tutorId] as const,
    bookings: ["admin", "bookings"] as const,
    booking: (id: number | string) => ["admin", "bookings", id] as const,
    learnerBookings: (learnerId: number | string) =>
      ["admin", "bookings", "learner", learnerId] as const,
    tutorBookings: (tutorId: number | string) =>
      ["admin", "bookings", "tutor", tutorId] as const,
    translationRequests: ["admin", "translation-requests"] as const,
    file: (id: number | string) => ["admin", "files", id] as const,
    requestFiles: (requestId: number | string) =>
      ["admin", "files", "translation-request", requestId] as const,
  },
};
