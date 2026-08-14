import type {
  AdminAvailability,
  AdminBooking,
  AdminFile,
  AdminService,
  AdminTranslationRequest,
  ApiRecord,
} from "../../types/adminApi";

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const unwrapList = <T = unknown>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!isRecord(value)) return [];

  for (const key of ["items", "results", "data", "value", "files"]) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested as T[];
  }

  return [];
};

const scalar = (record: ApiRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const text = (record: ApiRecord, keys: string[]) => {
  const value = scalar(record, keys);
  return typeof value === "string" ? value : undefined;
};

const numberish = (record: ApiRecord, keys: string[]) => {
  const value = scalar(record, keys);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
};

const idish = (record: ApiRecord, keys: string[]) => {
  const value = scalar(record, keys);
  if (typeof value === "number" || typeof value === "string") return value;
  return undefined;
};

const boolish = (record: ApiRecord, keys: string[]) => {
  const value = scalar(record, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return undefined;
};

const fallbackId = (record: ApiRecord) =>
  idish(record, ["id", "service_id", "availability_id", "booking_id", "file_id", "request_id"]) ??
  crypto.randomUUID();

const nestedText = (record: ApiRecord, keys: string[], nestedKeys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) {
      const nestedValue = text(value, nestedKeys);
      if (nestedValue) return nestedValue;
    }
  }
  return undefined;
};

export const normalizeService = (value: unknown): AdminService => {
  const record = isRecord(value) ? value : {};

  return {
    id: fallbackId(record),
    name: text(record, ["name", "title"]),
    description: text(record, ["description"]),
    category: text(record, ["category"]),
    language: text(record, ["language"]),
    durationMinutes: numberish(record, ["duration_minutes", "duration", "durationMinutes"]),
    price: numberish(record, ["price", "amount"]),
    isActive: boolish(record, ["is_active", "active", "enabled"]),
    tutorId: idish(record, ["tutor_id", "user_id"]),
    createdAt: text(record, ["created_at", "createdAt"]),
    raw: record,
  };
};

export const normalizeAvailability = (value: unknown): AdminAvailability => {
  const record = isRecord(value) ? value : {};

  return {
    id: fallbackId(record),
    tutorId: idish(record, ["tutor_id", "user_id"]),
    date: text(record, ["date", "booking_date", "availability_date"]),
    day: text(record, ["day", "day_of_week", "weekday"]),
    startTime: text(record, ["start_time", "startTime"]),
    endTime: text(record, ["end_time", "endTime"]),
    isActive: boolish(record, ["is_active", "active", "available"]),
    createdAt: text(record, ["created_at", "createdAt"]),
    raw: record,
  };
};

export const normalizeBooking = (value: unknown): AdminBooking => {
  const record = isRecord(value) ? value : {};

  return {
    id: fallbackId(record),
    learnerId: idish(record, ["learner_id"]),
    tutorId: idish(record, ["tutor_id"]),
    serviceId: idish(record, ["service_id"]),
    availabilityId: idish(record, ["availability_id"]),
    bookingDate: text(record, ["booking_date", "date"]),
    startTime: text(record, ["start_time", "startTime"]),
    endTime: text(record, ["end_time", "endTime"]),
    status: text(record, ["status"]),
    paymentStatus: text(record, ["payment_status", "paymentStatus"]),
    notes: text(record, ["notes", "message"]),
    createdAt: text(record, ["created_at", "createdAt"]),
    raw: record,
  };
};

export const normalizeFile = (value: unknown): AdminFile => {
  const record = isRecord(value) ? value : {};

  return {
    id: idish(record, ["id", "file_id"]),
    fileName: text(record, ["file_name", "filename", "name", "original_filename"]),
    fileType: text(record, ["file_type", "mime_type", "content_type"]),
    fileSize: numberish(record, ["file_size", "size"]),
    fileUrl: text(record, ["file_url", "url", "download_url", "path"]),
    createdAt: text(record, ["created_at", "createdAt"]),
    uploadedByUserId: idish(record, ["uploaded_by_user_id", "user_id"]),
    translationRequestId: idish(record, [
      "related_translation_request_id",
      "translation_request_id",
    ]),
    raw: record,
  };
};

export const normalizeTranslationRequest = (value: unknown): AdminTranslationRequest => {
  const record = isRecord(value) ? value : {};

  return {
    id: fallbackId(record),
    learnerId: idish(record, [
      "learner_id",
      "user_id",
      "submitted_by_user_id",
      "created_by_user_id",
    ]),
    learnerName:
      text(record, ["learner_name", "user_name", "full_name", "submitted_by_name"]) ??
      nestedText(record, ["learner", "user", "submitted_by"], ["full_name", "name", "email"]),
    learnerEmail:
      text(record, ["learner_email", "user_email", "email", "submitted_by_email"]) ??
      nestedText(record, ["learner", "user", "submitted_by"], ["email"]),
    sourceLanguage: text(record, [
      "source_language",
      "source_lang",
      "source",
      "from_language",
      "from",
    ]),
    targetLanguage: text(record, [
      "target_language",
      "target_lang",
      "target",
      "to_language",
      "to",
    ]),
    status: text(record, ["status", "request_status", "state"]) ?? "pending",
    originalText: text(record, ["original_text", "source_text", "text", "content", "input_text"]),
    translatedText: text(record, ["translated_text", "translation", "output_text", "result"]),
    notes: text(record, ["notes", "message", "description", "special_instructions"]),
    createdAt: text(record, ["created_at", "createdAt", "requested_at", "submitted_at"]),
    updatedAt: text(record, ["updated_at", "updatedAt", "completed_at"]),
    raw: record,
  };
};
