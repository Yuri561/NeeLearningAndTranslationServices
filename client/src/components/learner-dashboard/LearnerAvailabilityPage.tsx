import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCoffee,
  FiRefreshCw,
  FiSearch,
  FiSun,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  useLearnerAvailability,
  useLearningServices,
} from "../../features/learner/learnerQueries";
import type {
  AvailabilitySlot,
  LearningServiceWithTutor,
} from "../../features/learner/learnerTypes";
import { LearnerBookingModal } from "./LearnerBookingModal";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const timeParts = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return { hours, minutes };
};

const formatTime = (time: string) => {
  const { hours, minutes } = timeParts(time);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const durationMinutes = (start: string, end: string) => {
  const startParts = timeParts(start);
  const endParts = timeParts(end);
  const startTotal = startParts.hours * 60 + startParts.minutes;
  let endTotal = endParts.hours * 60 + endParts.minutes;
  if (endTotal < startTotal) endTotal += 24 * 60;
  return Math.max(0, endTotal - startTotal);
};

const formatDuration = (start: string, end: string) => {
  const total = durationMinutes(start, end);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}`;
};

const sortSlots = (slots: AvailabilitySlot[]) =>
  [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));

const AvailabilitySkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
    <div className="animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-slate-100" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="h-3 w-16 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 h-20 rounded-xl bg-slate-100" />
      <div className="mt-3 h-20 rounded-xl bg-slate-100" />
    </div>
  </div>
);

const TimeSlot = ({
  slot,
  tutorName,
  onSelect,
}: {
  slot: AvailabilitySlot;
  tutorName?: string;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={`View ${slot.day} availability from ${formatTime(slot.start_time)} to ${formatTime(slot.end_time)}`}
    className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-[0_8px_20px_rgba(6,67,159,.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
  >
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-haiti-navy shadow-sm transition group-hover:bg-haiti-navy group-hover:text-white">
      <FiClock className="size-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-extrabold text-slate-800">
        {formatTime(slot.start_time)} <span className="font-medium text-slate-300">—</span> {formatTime(slot.end_time)}
      </span>
      <span className="mt-0.5 block text-xs font-medium text-slate-400">
        {formatDuration(slot.start_time, slot.end_time)} window
        {tutorName && <> &middot; <span className="text-haiti-navy font-semibold">{tutorName}</span></>}
      </span>
    </span>
    <FiArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-haiti-navy" />
  </button>
);

const DayCard = ({
  day,
  slots,
  isToday,
  tutorMap,
  onSelect,
}: {
  day: string;
  slots: AvailabilitySlot[];
  isToday: boolean;
  tutorMap: Map<number, string>;
  onSelect: (slot: AvailabilitySlot) => void;
}) => (
  <article className={`rounded-2xl border bg-white p-5 shadow-[0_5px_24px_rgba(15,23,42,.035)] ${isToday ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200/80"}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 place-items-center rounded-xl ${isToday ? "bg-haiti-navy text-white" : "bg-blue-50 text-haiti-navy"}`}>
          <FiCalendar className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">{day}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{slots.length} {slots.length === 1 ? "time window" : "time windows"}</p>
        </div>
      </div>
      {isToday && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-haiti-red">Today</span>}
    </div>
    <div className="mt-5 space-y-3">
      {sortSlots(slots).map((slot) => (
        <TimeSlot
          key={slot.id}
          slot={slot}
          tutorName={slot.teacher_id ? tutorMap.get(slot.teacher_id) : undefined}
          onSelect={() => onSelect(slot)}
        />
      ))}
    </div>
  </article>
);

const AvailabilityDetails = ({
  slot,
  tutorName,
  onBook,
  onClose,
}: {
  slot: AvailabilitySlot;
  tutorName?: string;
  onBook: () => void;
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="availability-detail-title">
      <button type="button" aria-label="Close availability details" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
      <article className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-haiti-navy px-6 py-7 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><FiCalendar className="size-5" /></span>
            <button ref={(node) => node?.focus()} type="button" onClick={onClose} aria-label="Close details" className="grid size-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><FiX className="size-5" /></button>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Available learning time</p>
          <h2 id="availability-detail-title" className="mt-2 text-2xl font-extrabold text-white">{slot.day}</h2>
          {tutorName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-blue-200">
              <FiUser className="size-3.5" /> {tutorName}
            </p>
          )}
          <p className="mt-2 text-sm text-blue-100">A flexible window for tutoring, speaking practice, Q&amp;A, or language support.</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Starts</p>
              <p className="mt-2 text-lg font-extrabold text-slate-900">{formatTime(slot.start_time)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Ends</p>
              <p className="mt-2 text-lg font-extrabold text-slate-900">{formatTime(slot.end_time)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <span className="flex items-center gap-3 text-sm font-bold text-slate-700"><FiClock className="text-haiti-navy" /> {formatDuration(slot.start_time, slot.end_time)} availability</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><FiCheck strokeWidth={3} /> Active</span>
          </div>
          <button type="button" onClick={onBook} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-haiti-navy text-sm font-bold text-white shadow-[0_8px_20px_rgba(6,67,159,.2)] transition hover:bg-haiti-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy">
            Book This Availability <FiArrowRight />
          </button>
          <button type="button" onClick={() => navigate("/dashboard/learner/services")} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-haiti-navy">
            View available services
          </button>
        </div>
      </article>
    </div>
  );
};

export const LearnerAvailabilityPage = () => {
  const servicesQuery = useLearningServices();
  const availabilityQuery = useLearnerAvailability();

  const [teacherFilter, setTeacherFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [bookingAvailability, setBookingAvailability] = useState<AvailabilitySlot | null>(null);

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

  // Build a map from tutor ID → tutor name (sourced from services)
  const tutorMap = useMemo(() => {
    const map = new Map<number, string>();
    (servicesQuery.data ?? []).forEach((service) => {
      if (service.tutor?.id && !map.has(service.tutor.id)) {
        map.set(service.tutor.id, service.tutor.full_name);
      }
    });
    return map;
  }, [servicesQuery.data]);

  // All active availability slots
  const allActiveSlots = useMemo(
    () => (availabilityQuery.data ?? []).filter((s) => s.is_active),
    [availabilityQuery.data],
  );

  // Build sorted list of tutors who actually have active availability.
  // Falls back to "Tutor #ID" for tutors not found in the services list.
  const tutorOptions = useMemo(() => {
    const ids = new Set(allActiveSlots.map((s) => s.teacher_id).filter(Boolean) as number[]);
    const options: { id: number; name: string }[] = [];
    ids.forEach((id) => {
      const name = tutorMap.get(id) ?? `Tutor #${id}`;
      options.push({ id, name });
    });
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [allActiveSlots, tutorMap]);

  // Slots filtered by selected teacher (or all if no teacher selected)
  const filteredSlots = useMemo(() => {
    if (!teacherFilter) return allActiveSlots;
    const filterId = Number(teacherFilter);
    return allActiveSlots.filter((s) => s.teacher_id === filterId);
  }, [allActiveSlots, teacherFilter]);

  // Group filtered slots by day
  const grouped = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    filteredSlots.forEach((slot) =>
      map.set(slot.day, [...(map.get(slot.day) ?? []), slot])
    );
    return map;
  }, [filteredSlots]);

  const visibleDays = DAYS.filter(
    (day) => grouped.has(day) && (dayFilter === "all" || day === dayFilter),
  );

  const selectedTutor = teacherFilter
    ? tutorOptions.find((t) => t.id === Number(teacherFilter))
    : null;

  // Services for the booking modal — scoped to the slot's tutor when known
  const activeServices = useMemo(
    () => (servicesQuery.data ?? []).filter((s) => s.is_active && s.tutor.id),
    [servicesQuery.data],
  );
  const servicesForSelectedTutor = useMemo(() => {
    if (!selected?.teacher_id) return activeServices;
    return activeServices.filter((s) => s.tutor.id === selected.teacher_id);
  }, [activeServices, selected]);

  const selectedSlotTutorName = selected?.teacher_id
    ? tutorMap.get(selected.teacher_id)
    : undefined;

  return (
    <section>
      {/* Hero banner */}
      <div className="overflow-hidden rounded-3xl bg-haiti-navy px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.16)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200"><FiSun /> Plan your learning</p>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Tutor Availability</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Browse all available tutoring slots across every teacher. Use the filter below to narrow down by tutor name.
            </p>
          </div>
          {!availabilityQuery.isLoading && !availabilityQuery.isError && (
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-extrabold">{filteredSlots.length}</p>
                <p className="text-xs font-semibold text-blue-100">available windows</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-extrabold">{grouped.size}</p>
                <p className="text-xs font-semibold text-blue-100">days this week</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative z-10 mx-2 -mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,.07)] sm:mx-5 sm:-mt-4 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-3 px-1 text-sm text-slate-500">
          <FiUser className="text-haiti-red shrink-0" />
          <span>
            {selectedTutor
              ? <><strong className="text-slate-800">{selectedTutor.name}</strong> &middot; Showing their availability</>
              : <><strong className="text-slate-800">All tutors</strong> &middot; Times shown in your local time format</>
            }
          </span>
          {selectedTutor && (
            <button
              type="button"
              onClick={() => { setTeacherFilter(""); setDayFilter("all"); setSelected(null); }}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-haiti-red"
              aria-label="Clear teacher filter"
            >
              <FiX className="size-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Teacher name filter */}
          <label className="relative">
            <span className="sr-only">Filter by teacher</span>
            <FiSearch className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
            <select
              id="teacher-filter"
              value={teacherFilter}
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                setDayFilter("all");
                setSelected(null);
              }}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-56"
            >
              <option value="">All teachers</option>
              {tutorOptions.map(({ id, name }) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <FiBookOpen className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-slate-400" />
          </label>

          {/* Day filter */}
          <label className="relative">
            <span className="sr-only">Filter by day</span>
            <select
              id="day-filter"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-44"
            >
              <option value="all">All available days</option>
              {DAYS.filter((day) => grouped.has(day)).map((day) => (
                <option key={day} value={day}>{day}{day === today ? " (Today)" : ""}</option>
              ))}
            </select>
            <FiCalendar className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-slate-400" />
          </label>
        </div>
      </div>

      {/* Loading skeleton */}
      {availabilityQuery.isLoading && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading availability">
          {Array.from({ length: 6 }, (_, i) => <AvailabilitySkeleton key={i} />)}
        </div>
      )}

      {/* Error state */}
      {availabilityQuery.isError && (
        <div className="mt-8 grid min-h-72 place-items-center rounded-3xl border border-red-100 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-haiti-red"><FiRefreshCw className="size-5" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">We couldn&apos;t load availability</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {availabilityQuery.error instanceof Error ? availabilityQuery.error.message : "Please check your connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => availabilityQuery.refetch()}
              disabled={availabilityQuery.isFetching}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-bold text-white transition hover:bg-haiti-navy-dark disabled:opacity-60"
            >
              <FiRefreshCw className={availabilityQuery.isFetching ? "animate-spin" : ""} /> Try again
            </button>
          </div>
        </div>
      )}

      {/* Availability grid */}
      {!availabilityQuery.isLoading && !availabilityQuery.isError && visibleDays.length > 0 && (
        <div className="mt-8 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleDays.map((day) => (
            <DayCard
              key={day}
              day={day}
              slots={grouped.get(day) ?? []}
              isToday={day === today}
              tutorMap={tutorMap}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!availabilityQuery.isLoading && !availabilityQuery.isError && visibleDays.length === 0 && (
        <div className="mt-8 grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-haiti-navy">
              {filteredSlots.length ? <FiCoffee className="size-6" /> : <FiBookOpen className="size-6" />}
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              {filteredSlots.length
                ? `No active times on ${dayFilter}`
                : teacherFilter
                  ? "No availability for this teacher yet"
                  : "No availability available yet"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {filteredSlots.length
                ? "Choose another day to explore the weekly schedule."
                : teacherFilter
                  ? "Try selecting a different teacher or check back soon."
                  : "New availability will appear here once tutors set their schedules."}
            </p>
            {dayFilter !== "all" && (
              <button
                type="button"
                onClick={() => setDayFilter("all")}
                className="mt-5 rounded-xl bg-haiti-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-haiti-navy-dark"
              >
                View all days
              </button>
            )}
          </div>
        </div>
      )}

      {/* Slot detail modal */}
      {selected && (
        <AvailabilityDetails
          slot={selected}
          tutorName={selectedSlotTutorName}
          onClose={() => setSelected(null)}
          onBook={() => setBookingAvailability(selected)}
        />
      )}

      {/* Booking modal */}
      {bookingAvailability && (
        <LearnerBookingModal
          availability={bookingAvailability}
          services={servicesForSelectedTutor as LearningServiceWithTutor[]}
          onClose={() => setBookingAvailability(null)}
        />
      )}
    </section>
  );
};

