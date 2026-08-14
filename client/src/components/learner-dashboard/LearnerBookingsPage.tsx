import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import {
  useAvailabilityDetails,
  useLearnerBookings,
  useLearningServices,
} from "../../features/learner/learnerQueries";
import type {
  AvailabilitySlot,
  Booking,
  LearningServiceWithTutor,
} from "../../features/learner/learnerTypes";
import { useCreatePayPalOrder } from "../../features/payments/paymentQueries";
import { PayPalCheckout } from "../../features/payments/PayPalCheckout";
import { bookingPaymentStatus, isPaymentCompleted, paymentStatusName } from "../../features/payments/paymentStatus";

const PAGE_LOADED_AT = Date.now();

const bookingBelongsToLearner = (booking: Booking, learnerId?: number) =>
  Boolean(
    learnerId &&
      String(booking.learner_id ?? "") === String(learnerId),
  );

const formatDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatShortDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const timeParts = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return { hours, minutes };
};

const formatTime = (time: string) => {
  const { hours, minutes } = timeParts(time);
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

const formatDuration = (start: string, end: string) => {
  const startParts = timeParts(start);
  const endParts = timeParts(end);
  const startTotal = startParts.hours * 60 + startParts.minutes;
  let endTotal = endParts.hours * 60 + endParts.minutes;
  if (endTotal < startTotal) endTotal += 1440;
  const total = Math.max(0, endTotal - startTotal);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}`;
};

type StatusTone = { badge: string; dot: string };

const STATUS_TONES: Record<string, StatusTone> = {
  pending: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  completed: { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
};

const statusName = (status?: string) => status?.trim() || "Unknown";
const statusTone = (status?: string) =>
  STATUS_TONES[statusName(status).toLowerCase()] ?? {
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  };

const StatusBadge = ({ status }: { status?: string }) => {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] font-bold ring-1 ring-inset ${tone.badge}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {statusName(status)}
    </span>
  );
};

const PaymentBadge = ({ status }: { status?: string | null }) => {
  const completed = isPaymentCompleted(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] font-bold ring-1 ring-inset ${completed ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
      <FiCreditCard /> {paymentStatusName(status)}
    </span>
  );
};

const BookingSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
    <div className="animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 w-24 rounded-full bg-slate-100" />
        <div className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 h-6 w-2/3 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </div>
  </div>
);

const DetailField = ({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-haiti-navy shadow-sm">
      <Icon className="size-4" />
    </span>
    <div className="min-w-0">
      <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-0.5 break-words text-sm font-bold text-slate-800">{value}</div>
    </div>
  </div>
);

const BookingCard = ({
  booking,
  availability,
  service,
  availabilityLoading,
  availabilityError,
  onSelect,
}: {
  booking: Booking;
  availability?: AvailabilitySlot;
  service?: LearningServiceWithTutor;
  availabilityLoading: boolean;
  availabilityError: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="group w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_5px_24px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(6,67,159,.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy sm:p-6"
    aria-label={`View booking ${booking.id} details`}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
        <FiHash className="text-haiti-red" /> Booking {booking.id}
      </span>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={booking.status} />
        {bookingPaymentStatus(booking.payment_status, booking.status) ? <PaymentBadge status={bookingPaymentStatus(booking.payment_status, booking.status)} /> : null}
      </div>
    </div>

    <h2 className="mt-5 text-xl font-extrabold leading-snug text-slate-900 transition group-hover:text-haiti-navy">
      {service?.name ?? "Learning session"}
    </h2>
    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
      <FiUser className="text-haiti-red" />
      {service?.tutor.full_name ?? "Tutor assigned to this service"}
    </p>

    <div className="mt-6 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-slate-50 p-3.5">
        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400"><FiCalendar /> Date</p>
        <p className="mt-1.5 text-sm font-extrabold text-slate-800">{formatShortDate(booking.booking_date)}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3.5">
        <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400"><FiClock /> Time</p>
        <p className="mt-1.5 text-sm font-extrabold text-slate-800">{formatTime(booking.start_time)}</p>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
      <div className="min-w-0 text-xs text-slate-500">
        {availabilityLoading ? (
          <span className="inline-flex items-center gap-2"><span className="size-3 animate-spin rounded-full border-2 border-slate-200 border-t-haiti-navy" /> Loading availability</span>
        ) : availabilityError ? (
          <span className="text-red-500">Availability details unavailable</span>
        ) : (
          <span className="inline-flex items-center gap-1.5"><FiMapPin className="text-haiti-navy" /> {availability?.day ?? "Scheduled session"}</span>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-haiti-navy">
        View details <FiArrowRight className="transition group-hover:translate-x-1" />
      </span>
    </div>
  </button>
);

const BookingDetails = ({
  booking,
  availability,
  service,
  availabilityLoading,
  availabilityError,
  onClose,
}: {
  booking: Booking;
  availability?: AvailabilitySlot;
  service?: LearningServiceWithTutor;
  availabilityLoading: boolean;
  availabilityError: boolean;
  onClose: () => void;
}) => {
  const createPayPalOrder = useCreatePayPalOrder();
  const [paymentError, setPaymentError] = useState("");
  const [paypalOrderId, setPayPalOrderId] = useState<string | null>(null);
  const effectivePaymentStatus = bookingPaymentStatus(booking.payment_status, booking.status);

  const payWithPayPal = () => {
    if (createPayPalOrder.isPending || isPaymentCompleted(effectivePaymentStatus)) return;
    setPaymentError("");
    createPayPalOrder.mutate(booking.id, {
      onSuccess: (order) => {
        if (!order.paypal_order_id) {
          setPaymentError("PayPal did not provide an order ID. Please try again.");
          return;
        }
        setPayPalOrderId(order.paypal_order_id);
      },
      onError: (error) => {
        const reason = error instanceof Error ? error.message : "PayPal payment could not be prepared.";
        setPaymentError(`${reason} You have not been charged. Please try again.`);
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

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title">
      <button type="button" aria-label="Close booking details" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
      <article className="relative h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-haiti-red">Booking details</p>
            <p className="mt-0.5 text-sm text-slate-400">{formatDate(booking.booking_date)} at {formatTime(booking.start_time)}</p>
          </div>
          <button ref={(node) => node?.focus()} type="button" onClick={onClose} aria-label="Close details" className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"><FiX className="size-5" /></button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Learning session</p>
              <h2 id="booking-detail-title" className="mt-2 text-2xl font-extrabold leading-tight text-slate-900">{service?.name ?? "Learning session"}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500"><FiUser className="text-haiti-red" /> {service?.tutor.full_name ?? "Tutor assigned to this service"}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={booking.status} />
              {effectivePaymentStatus ? <PaymentBadge status={effectivePaymentStatus} /> : null}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <DetailField icon={FiCalendar} label="Booking date" value={formatDate(booking.booking_date)} />
            <DetailField icon={FiClock} label="Duration" value={formatDuration(booking.start_time, booking.end_time)} />
            <DetailField icon={FiClock} label="Start time" value={formatTime(booking.start_time)} />
            <DetailField icon={FiClock} label="End time" value={formatTime(booking.end_time)} />
          </div>

          <section className="mt-7">
            <h3 className="text-sm font-extrabold text-slate-900">Session notes</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="flex items-start gap-3 text-sm leading-6 text-slate-600"><FiFileText className="mt-1 shrink-0 text-haiti-navy" /> {booking.notes?.trim() || "No notes were added to this booking."}</p>
            </div>
          </section>

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Lesson payment</h3>
                <div className="mt-2"><PaymentBadge status={effectivePaymentStatus} /></div>
              </div>
              {!isPaymentCompleted(effectivePaymentStatus) && !paypalOrderId ? (
                <button type="button" onClick={payWithPayPal} disabled={createPayPalOrder.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0070ba] px-5 text-sm font-bold text-white transition hover:bg-[#005ea6] disabled:cursor-not-allowed disabled:opacity-60">
                  {createPayPalOrder.isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Redirecting to PayPal...</> : <><FiCreditCard /> Pay with PayPal</>}
                </button>
              ) : null}
            </div>
            {paymentError ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{paymentError}</p> : null}
            {paypalOrderId ? (
              <div className="mt-4">
                <PayPalCheckout paypalOrderId={paypalOrderId} onCompleted={() => setPaymentError("")} />
              </div>
            ) : null}
          </section>

          <section className="mt-7">
            <h3 className="text-sm font-extrabold text-slate-900">Availability details</h3>
            {availabilityLoading ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-sm font-semibold text-haiti-navy">
                <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-haiti-navy" /> Loading selected availability…
              </div>
            ) : availabilityError || !availability ? (
              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                <p className="text-sm font-bold text-amber-800">Schedule confirmed from your booking.</p>
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  The original availability window could not be refreshed, but your booked date and time are shown above.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailField icon={FiCalendar} label="Booked day" value={formatDate(booking.booking_date)} />
                  <DetailField icon={FiClock} label="Booked time" value={`${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`} />
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Weekly window</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900">{availability.day}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${availability.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}><FiCheck /> {availability.is_active ? "Active" : "Inactive"}</span>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">{formatTime(availability.start_time)} — {formatTime(availability.end_time)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDuration(availability.start_time, availability.end_time)} availability window</p>
              </div>
            )}
          </section>

          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Link to="/dashboard/learner/availability" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-haiti-navy">View availability</Link>
            <Link to="/dashboard/learner/services" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-haiti-navy text-sm font-bold text-white transition hover:bg-haiti-navy-dark">Book another session <FiArrowRight /></Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export const LearnerBookingsPage = () => {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const bookingsQuery = useLearnerBookings(user?.id);
  const servicesQuery = useLearningServices();
  const bookings = useMemo(
    () => (bookingsQuery.data ?? []).filter((booking) => bookingBelongsToLearner(booking, user?.id)),
    [bookingsQuery.data, user?.id],
  );
  const availabilityIds = useMemo(
    () => bookings.map((booking) => booking.availability_id).filter((id): id is number => Number.isFinite(id)),
    [bookings],
  );
  const uniqueAvailabilityIds = useMemo(() => [...new Set(availabilityIds)], [availabilityIds]);
  const availabilityQueries = useAvailabilityDetails(availabilityIds);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const routeMode = location.pathname.endsWith("/upcoming")
    ? "upcoming"
    : location.pathname.endsWith("/history")
      ? "history"
      : "all";

  const availabilityById = useMemo(() => {
    const map = new Map<number, AvailabilitySlot>();
    uniqueAvailabilityIds.forEach((id, index) => {
      const detail = availabilityQueries[index]?.data;
      if (detail) map.set(id, detail);
    });
    return map;
  }, [availabilityQueries, uniqueAvailabilityIds]);
  const availabilityStateById = (id: number | null) => {
    if (!id) return undefined;
    const index = uniqueAvailabilityIds.indexOf(id);
    return availabilityQueries[index];
  };
  const servicesById = useMemo(
    () => new Map((servicesQuery.data ?? []).map((service) => [service.id, service])),
    [servicesQuery.data],
  );
  const statuses = useMemo(
    () => [...new Set(bookings.map((booking) => statusName(booking.status)))].sort(),
    [bookings],
  );
  const filteredBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => {
          const service = booking.service_id ? servicesById.get(booking.service_id) : undefined;
          const term = search.trim().toLowerCase();
          const bookingTime = new Date(`${booking.booking_date}T${booking.end_time}`).getTime();
          const isUpcoming = bookingTime >= PAGE_LOADED_AT;
          const matchesRoute =
            routeMode === "all" ||
            (routeMode === "upcoming" && isUpcoming) ||
            (routeMode === "history" && !isUpcoming);
          const matchesSearch =
            !term ||
            String(booking.id).includes(term) ||
            statusName(booking.status).toLowerCase().includes(term) ||
            Boolean(service && service.name.toLowerCase().includes(term)) ||
            Boolean(service && service.tutor.full_name.toLowerCase().includes(term));

          return (
            matchesRoute &&
            matchesSearch &&
            (!dateFilter || booking.booking_date === dateFilter) &&
            (statusFilter === "all" || statusName(booking.status) === statusFilter)
          );
        })
        .sort((a, b) =>
          routeMode === "upcoming"
            ? `${a.booking_date}T${a.start_time}`.localeCompare(`${b.booking_date}T${b.start_time}`)
            : `${b.booking_date}T${b.start_time}`.localeCompare(`${a.booking_date}T${a.start_time}`),
        ),
    [bookings, dateFilter, routeMode, search, servicesById, statusFilter],
  );
  const upcomingCount = bookings.filter(
    (booking) => new Date(`${booking.booking_date}T${booking.end_time}`).getTime() >= PAGE_LOADED_AT,
  ).length;
  const selectedAvailabilityState = selected ? availabilityStateById(selected.availability_id) : undefined;

  return (
    <section>
      <div className="overflow-hidden rounded-3xl bg-haiti-navy px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.16)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Your learning journey</p>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{routeMode === "upcoming" ? "Upcoming Sessions" : routeMode === "history" ? "Booking History" : "My Bookings"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Track your scheduled tutoring, speaking practice, Q&amp;A, and translation-support sessions in one calm, organized place.</p>
          </div>
          {!bookingsQuery.isLoading && !bookingsQuery.isError && (
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-2xl font-extrabold">{bookings.length}</p><p className="text-xs font-semibold text-blue-100">total bookings</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-2xl font-extrabold">{upcomingCount}</p><p className="text-xs font-semibold text-blue-100">upcoming</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-2 -mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,.07)] sm:mx-5 sm:-mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-3 px-1 text-sm text-slate-500"><FiCalendar className="text-haiti-red" /><span><strong className="text-slate-800">{routeMode === "upcoming" ? "Upcoming" : routeMode === "history" ? "History" : "Session history"}</strong> &middot; Select a booking for the full details</span></div>
        <label className="relative">
          <span className="sr-only">Search bookings</span>
          <FiSearch className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Search bookings"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-48"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filter by booking date</span>
          <input
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            type="date"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-40"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filter by booking status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-44">
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-slate-400" />
        </label>
      </div>

      {bookingsQuery.isLoading && <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading bookings">{Array.from({ length: 6 }, (_, index) => <BookingSkeleton key={index} />)}</div>}

      {bookingsQuery.isError && (
        <div className="mt-8 grid min-h-72 place-items-center rounded-3xl border border-red-100 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-haiti-red"><FiRefreshCw className="size-5" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">We couldn&apos;t load your bookings</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "Please check your connection and try again."}</p>
            <button type="button" onClick={() => bookingsQuery.refetch()} disabled={bookingsQuery.isFetching} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-bold text-white transition hover:bg-haiti-navy-dark disabled:opacity-60"><FiRefreshCw className={bookingsQuery.isFetching ? "animate-spin" : ""} /> Try again</button>
          </div>
        </div>
      )}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && filteredBookings.length > 0 && (
        <div className="mt-8 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBookings.map((booking) => {
            const availabilityState = availabilityStateById(booking.availability_id);
            return <BookingCard key={booking.id} booking={booking} service={booking.service_id ? servicesById.get(booking.service_id) : undefined} availability={booking.availability_id ? availabilityById.get(booking.availability_id) : undefined} availabilityLoading={availabilityState?.isLoading ?? false} availabilityError={availabilityState?.isError ?? false} onSelect={() => setSelected(booking)} />;
          })}
        </div>
      )}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && filteredBookings.length === 0 && (
        <div className="mt-8 grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-haiti-navy"><FiCalendar className="size-6" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">{bookings.length ? `No ${statusFilter.toLowerCase()} bookings` : "Your learning calendar is ready"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{bookings.length ? "Choose another status to see more sessions." : "Explore available services and schedule your first tutoring, practice, or support session."}</p>
            {bookings.length ? (
              <button type="button" onClick={() => setStatusFilter("all")} className="mt-5 rounded-xl bg-haiti-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-haiti-navy-dark">View all bookings</button>
            ) : (
              <Link to="/dashboard/learner/services" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-haiti-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-haiti-navy-dark">Explore services <FiArrowRight /></Link>
            )}
          </div>
        </div>
      )}

      {selected && <BookingDetails booking={selected} service={selected.service_id ? servicesById.get(selected.service_id) : undefined} availability={selected.availability_id ? availabilityById.get(selected.availability_id) : undefined} availabilityLoading={selectedAvailabilityState?.isLoading ?? false} availabilityError={selectedAvailabilityState?.isError ?? false} onClose={() => setSelected(null)} />}
    </section>
  );
};
