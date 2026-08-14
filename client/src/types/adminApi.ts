export type ApiRecord = Record<string, unknown>;

export type AdminService = {
  id: number | string;
  name?: string;
  description?: string;
  category?: string;
  language?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: boolean;
  tutorId?: number | string;
  createdAt?: string;
  raw: ApiRecord;
};

export type AdminAvailability = {
  id: number | string;
  tutorId?: number | string;
  date?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  createdAt?: string;
  raw: ApiRecord;
};

export type AdminBooking = {
  id: number | string;
  learnerId?: number | string;
  tutorId?: number | string;
  serviceId?: number | string;
  availabilityId?: number | string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt?: string;
  raw: ApiRecord;
};

export type AdminFile = {
  id?: number | string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  createdAt?: string;
  uploadedByUserId?: number | string;
  translationRequestId?: number | string;
  raw: ApiRecord;
};

export type AdminTranslationRequest = {
  id: number | string;
  learnerId?: number | string;
  learnerName?: string;
  learnerEmail?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  status?: string;
  originalText?: string;
  translatedText?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  raw: ApiRecord;
};

export type CountDatum = {
  name: string;
  value: number;
};
