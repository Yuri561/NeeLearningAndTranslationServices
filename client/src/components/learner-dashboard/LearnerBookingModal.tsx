import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import {
  useCreateBooking,
  useTutorAvailability,
} from "../../features/learner/learnerQueries";
import { useCreatePayPalOrder } from "../../features/payments/paymentQueries";
import { PayPalCheckout } from "../../features/payments/PayPalCheckout";
import type {
  AvailabilitySlot,
  CreateBookingPayload,
  LearningServiceWithTutor,
} from "../../features/learner/learnerTypes";

type LearnerBookingModalProps = {
  service?: LearningServiceWithTutor | null;
  availability?: AvailabilitySlot | null;
  services?: LearningServiceWithTutor[];
  onClose: () => void;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const nextDateForDay = (day?: string | null) => {
  if (!day) return formatDateInput(new Date());

  const target = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(day);

  if (target < 0) return formatDateInput(new Date());

  const date = new Date();
  const diff = (target - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return formatDateInput(date);
};

const toTimeInput = (value?: string | null) => {
  if (!value) return "";
  const [hours = "", minutes = ""] = value.split(":");
  if (!hours || !minutes) return "";
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

const toApiTime = (value: string) => (value.length === 5 ? `${value}:00` : value);

const formatDuration = (minutes: number) => {
  if (!minutes) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} hr${hours === 1 ? "" : "s"}${rest ? ` ${rest} min` : ""}`;
};

const formatSlotLabel = (slot: AvailabilitySlot) => {
  const start = toTimeInput(slot.start_time) || slot.start_time;
  const end = toTimeInput(slot.end_time) || slot.end_time;
  return `${slot.day} - ${start} to ${end}`;
};

const isBookingResponseValid = (booking: unknown) =>
  Boolean(
    booking &&
    typeof booking === "object" &&
    "id" in booking &&
    Number.isFinite(Number((booking as { id?: unknown }).id)),
  );

const toOptionalInteger = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
};

export const LearnerBookingModal = ({
  service,
  availability,
  services = [],
  onClose,
}: LearnerBookingModalProps) => {
  const { data: user } = useCurrentUser();
  const createBooking = useCreateBooking(user?.id);
  const createPayPalOrder = useCreatePayPalOrder();
  const activeServices = useMemo(
    () => services.filter((item) => item.is_active),
    [services],
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    service?.id ? String(service.id) : "",
  );
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState(
    availability?.id ? String(availability.id) : "",
  );
  const selectedService = service ?? activeServices.find((item) => String(item.id) === selectedServiceId);
  const selectedTutorId = toOptionalInteger(selectedService?.tutor.id ?? availability?.tutor_id);
  const availabilityQuery = useTutorAvailability(selectedTutorId);
  const activeAvailability = useMemo(
    () => (availabilityQuery.data ?? []).filter((slot) => slot.is_active),
    [availabilityQuery.data],
  );
  const selectedAvailability =
    availability ?? activeAvailability.find((slot) => String(slot.id) === selectedAvailabilityId);
  const [bookingDate, setBookingDate] = useState(
    availability?.booking_date || nextDateForDay(availability?.day),
  );
  const [startTime, setStartTime] = useState(
    toTimeInput(availability?.start_time) || "09:00",
  );
  const [endTime, setEndTime] = useState(
    toTimeInput(availability?.end_time) || "10:00",
  );
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [paypalOrderId, setPayPalOrderId] = useState<string | null>(null);

  const preparePayPalPayment = (bookingId: number) => {
    setFormError("");
    setSuccessMessage(`Booking #${bookingId} was created. Preparing PayPal payment...`);
    createPayPalOrder.mutate(bookingId, {
      onSuccess: (order) => {
        if (!order.paypal_order_id) {
          setFormError("Your booking was created, but PayPal did not provide an order ID. Please try again from My Bookings.");
          setSuccessMessage("");
          return;
        }
        setPayPalOrderId(order.paypal_order_id);
        setSuccessMessage(`Booking #${bookingId} was created. Choose a secure PayPal payment method below.`);
      },
      onError: (error) => {
        setSuccessMessage("");
        const reason = error instanceof Error ? error.message : "PayPal payment could not be prepared.";
        setFormError(`Your booking was created, but PayPal checkout could not be prepared: ${reason} You have not been charged.`);
      },
    });
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submitBooking = () => {
    if (createdBookingId) {
      preparePayPalPayment(createdBookingId);
      return;
    }
    const learnerId = toOptionalInteger(user?.id);
    const serviceId = toOptionalInteger(selectedService?.id);
    const tutorId = toOptionalInteger(selectedService?.tutor.id ?? selectedAvailability?.tutor_id);
    const availabilityId = toOptionalInteger(selectedAvailability?.id);

    if (!learnerId) {
      setFormError("Your learner account could not be identified. Please sign in again.");
      return;
    }
    if (!serviceId && !availabilityId) {
      setFormError("Choose a service or availability before booking.");
      return;
    }
    if (!serviceId) {
      setFormError("Choose a service so the booking can be connected to the right tutor.");
      return;
    }
    if (!tutorId) {
      setFormError("This booking needs a tutor. Choose a service with an assigned tutor.");
      return;
    }
    if (!availabilityId) {
      setFormError("Choose an available time slot before creating the booking.");
      return;
    }
    if (!bookingDate) {
      setFormError("Choose a booking date.");
      return;
    }
    if (!startTime || !endTime) {
      setFormError("Choose a start and end time.");
      return;
    }
    if (endTime <= startTime) {
      setFormError("End time must be after the start time.");
      return;
    }
    if (!selectedService || !Number.isFinite(selectedService.price) || selectedService.price < 0) {
      setFormError("The selected service does not have a valid price.");
      return;
    }

    const payload: CreateBookingPayload = {
      learner_id: learnerId,
      service_id: serviceId,
      tutor_id: tutorId,
      availability_id: availabilityId,
      booking_date: bookingDate,
      start_time: toApiTime(startTime),
      end_time: toApiTime(endTime),
      total_price: selectedService.price,
      status: "Pending",
      notes: notes.trim(),
    };

    setFormError("");
    setSuccessMessage("");
    createBooking.mutate(payload, {
      onSuccess: (booking) => {
        if (!isBookingResponseValid(booking)) {
          setFormError("The booking was submitted, but the server returned incomplete details.");
          return;
        }
        const bookingId = Number(booking.id);
        setCreatedBookingId(bookingId);
        preparePayPalPayment(bookingId);
      },
      onError: (error) => {
        setFormError(error instanceof Error ? error.message : "Booking could not be created. Please try again.");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <button type="button" aria-label="Close booking form" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
      <article
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-haiti-red">Create booking</p>
            <h2 id="booking-modal-title" className="mt-0.5 text-lg font-extrabold text-slate-900">Book your learning session</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close booking form" className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy">
            <FiX className="size-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-haiti-navy"><FiBookOpen /> Service</p>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedService?.name ?? "Choose below"}</p>
              <p className="mt-1 text-xs text-slate-500">{selectedService ? formatDuration(selectedService.duration_minutes) : "Pick the service you want to book."}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><FiUser /> Tutor</p>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedService?.tutor.full_name ?? "Assigned by service"}</p>
              <p className="mt-1 text-xs text-slate-500">{selectedService?.tutor.email ?? "Choose a service to see the assigned tutor."}</p>
            </div>
          </div>

          {!service && (
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Service for this availability</span>
              <select
                value={selectedServiceId}
                onChange={(event) => {
                  setSelectedServiceId(event.target.value);
                  setSelectedAvailabilityId("");
                  if (formError) setFormError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Choose a service</option>
                {activeServices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.tutor.full_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {availability && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-haiti-navy"><FiCalendar /> Selected availability</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{availability.day}</p>
              <p className="mt-1 text-xs text-slate-500">{toTimeInput(availability.start_time)} to {toTimeInput(availability.end_time)}</p>
            </div>
          )}

          {!availability && (
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Available time slot</span>
              <select
                value={selectedAvailabilityId}
                disabled={!selectedTutorId || availabilityQuery.isLoading}
                onChange={(event) => {
                  const nextId = event.target.value;
                  const nextSlot = activeAvailability.find((slot) => String(slot.id) === nextId);
                  setSelectedAvailabilityId(nextId);
                  if (nextSlot) {
                    setBookingDate(nextSlot.booking_date || nextDateForDay(nextSlot.day));
                    setStartTime(toTimeInput(nextSlot.start_time) || startTime);
                    setEndTime(toTimeInput(nextSlot.end_time) || endTime);
                  }
                  if (formError) setFormError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {!selectedTutorId
                    ? "Choose a service first"
                    : availabilityQuery.isLoading
                      ? "Loading tutor availability..."
                      : "Choose an available time"}
                </option>
                {activeAvailability.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatSlotLabel(slot)}
                  </option>
                ))}
              </select>
              {availabilityQuery.isError && (
                <span className="mt-2 block text-xs font-semibold text-red-600">
                  Available times could not be loaded. Please try again from the Availability page.
                </span>
              )}
              {selectedTutorId && !availabilityQuery.isLoading && !availabilityQuery.isError && activeAvailability.length === 0 && (
                <span className="mt-2 block text-xs font-semibold text-slate-500">
                  This tutor has no active availability windows right now.
                </span>
              )}
            </label>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Booking date</span>
              <input
                type="date"
                value={bookingDate}
                onChange={(event) => {
                  setBookingDate(event.target.value);
                  if (formError) setFormError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Start time</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  if (formError) setFormError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">End time</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  if (formError) setFormError("");
                }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          {selectedService && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2"><FiClock className="text-haiti-red" /> {formatDuration(selectedService.duration_minutes)}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2"><FiCheck className="text-emerald-600" /> Status will be Pending</span>
            </div>
          )}

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Share goals, questions, preferred platform, or translation support details..."
              className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          {(formError || successMessage) && (
            <div className={`mt-4 flex gap-3 rounded-2xl border p-4 text-sm font-semibold ${formError ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
              {formError ? <FiAlertCircle className="mt-0.5 shrink-0" /> : <FiCheck className="mt-0.5 shrink-0" />}
              <span>{formError || successMessage}</span>
            </div>
          )}

          {paypalOrderId ? (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-haiti-navy">Secure PayPal checkout</p>
              <PayPalCheckout
                paypalOrderId={paypalOrderId}
                onCompleted={() => {
                  setFormError("");
                  setSuccessMessage("Payment successful. Your lesson booking is paid.");
                }}
              />
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
              Close
            </button>
            {!paypalOrderId ? <button
              type="button"
              onClick={submitBooking}
              disabled={createBooking.isPending || createPayPalOrder.isPending}
              className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(6,67,159,.2)] transition hover:-translate-y-0.5 hover:bg-haiti-navy-dark disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {createBooking.isPending ? (
                <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Creating booking...</>
              ) : createPayPalOrder.isPending ? (
                <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Preparing PayPal payment...</>
              ) : createdBookingId ? (
                <>Try PayPal again <FiArrowRight /></>
              ) : (
                <>Create booking &amp; continue to PayPal <FiArrowRight /></>
              )}
            </button> : null}
          </div>
        </div>
      </article>
    </div>
  );
};
