import type {
  Availability,
  AvailabilityFormValue,
  CreateAvailabilityRequest,
  WeekDay,
} from "./availability.types";
import { WEEK_DAYS } from "./availability.types";

const UTC_ANCHOR = Date.UTC(2024, 0, 1); // Monday
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const parseTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?Z?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
};

const localDayFromDate = (date: Date): WeekDay =>
  WEEK_DAYS[(date.getDay() + 6) % 7];

const utcDayFromDate = (date: Date): WeekDay =>
  WEEK_DAYS[(date.getUTCDay() + 6) % 7];

const pad = (value: number) => String(value).padStart(2, "0");

export const toLocalAvailability = <T extends Availability>(availability: T): T => {
  const start = parseTime(availability.start_time);
  const end = parseTime(availability.end_time);
  if (!start || !end) return availability;

  const dayIndex = WEEK_DAYS.indexOf(availability.day);
  const startDate = new Date(
    UTC_ANCHOR + dayIndex * DAY + start.hours * 60 * MINUTE + start.minutes * MINUTE
  );
  let endDate = new Date(
    UTC_ANCHOR + dayIndex * DAY + end.hours * 60 * MINUTE + end.minutes * MINUTE
  );
  if (endDate <= startDate) endDate = new Date(endDate.getTime() + DAY);

  return {
    ...availability,
    day: localDayFromDate(startDate),
    start_time: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`,
    end_time: `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
  } as T;
};

export const toUtcRequest = (
  value: AvailabilityFormValue
): CreateAvailabilityRequest | { error: string } => {
  const start = parseTime(value.start_time);
  const end = parseTime(value.end_time);
  if (!start || !end) return { error: "Enter a valid start and end time." };

  const dayIndex = WEEK_DAYS.indexOf(value.day);
  const startDate = new Date(2024, 0, 1 + dayIndex, start.hours, start.minutes);
  const endDate = new Date(2024, 0, 1 + dayIndex, end.hours, end.minutes);
  if (startDate >= endDate) {
    return { error: "The end time must be later than the start time." };
  }

  // A time-only API cannot represent a range whose UTC end is on the next day.
  if (startDate.getUTCDate() !== endDate.getUTCDate()) {
    return { error: "This time range crosses midnight in UTC. Choose a later start time." };
  }

  return {
    day: utcDayFromDate(startDate),
    start_time: `${pad(startDate.getUTCHours())}:${pad(startDate.getUTCMinutes())}:00.000Z`,
    end_time: `${pad(endDate.getUTCHours())}:${pad(endDate.getUTCMinutes())}:00.000Z`,
    is_active: value.is_active,
  };
};

export const minutesFromTime = (value: string) => {
  const parsed = parseTime(value);
  return parsed ? parsed.hours * 60 + parsed.minutes : Number.NaN;
};

export const formatLocalTime = (value: string) => {
  const parsed = parseTime(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2024, 0, 1, parsed.hours, parsed.minutes));
};

export const sortAvailability = (items: Availability[]) =>
  [...items].sort((a, b) => {
    const dayDifference = WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day);
    return dayDifference || minutesFromTime(a.start_time) - minutesFromTime(b.start_time);
  });

export const validateAvailabilityRows = (
  rows: AvailabilityFormValue[],
  existing: Availability[],
  editingId?: number
) => {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row.day || !row.start_time || !row.end_time) {
      return `Slot ${index + 1}: Day, start time, and end time are required.`;
    }
    const start = minutesFromTime(row.start_time);
    const end = minutesFromTime(row.end_time);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      return `Slot ${index + 1}: The end time must be later than the start time.`;
    }

    const comparable = [
      ...existing
        .filter((slot) => slot.id !== editingId)
        .map((slot) => ({ ...slot, source: "existing" })),
      ...rows.slice(0, index).map((slot) => ({ ...slot, source: "new" })),
    ];
    const conflict = comparable.find((slot) => {
      if (slot.day !== row.day) return false;
      const existingStart = minutesFromTime(slot.start_time);
      const existingEnd = minutesFromTime(slot.end_time);
      return start < existingEnd && end > existingStart;
    });
    if (conflict) {
      const duplicate =
        start === minutesFromTime(conflict.start_time) &&
        end === minutesFromTime(conflict.end_time);
      return `Slot ${index + 1}: ${
        duplicate
          ? "An identical time slot already exists for this day."
          : "This time overlaps another availability slot for this day."
      }`;
    }
  }
  return null;
};
