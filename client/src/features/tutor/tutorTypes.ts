export type TutorService = {
  id: number;
  name: string;
  description: string;
  category: string;
  language: string;
  duration_minutes: number;
  price: number;
  meeting_platform?: string | null;
  is_active?: boolean;
  created_at?: string | null;
};

export type TutorAvailability = {
  id: number;
  day?: string;
  date?: string;
  booking_date?: string | null;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  tutor_id?: number | null;
};

export type TutorBooking = {
  id: number;
  learner_id?: number;
  service_id?: number | null;
  tutor_id?: number | null;
  availability_id?: number | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  payment_status?: string | null;
  notes?: string | null;
};

export type ServicePayload = {
  name: string;
  description: string;
  category: string;
  language: string;
  duration_minutes: number;
  price: number;
  meeting_platform?: string;
  is_active: boolean;
};
