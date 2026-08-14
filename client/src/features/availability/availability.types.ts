export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export interface Availability {
  id: number;
  day: WeekDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
  tutor_id?: number | null;
}

export interface CreateAvailabilityRequest {
  day: WeekDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export type UpdateAvailabilityRequest = CreateAvailabilityRequest;

export type AvailabilityFormValue = {
  day: WeekDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
};
