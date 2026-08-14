import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiAlignLeft,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit3,
  FiExternalLink,
  FiGlobe,
  FiLink,
  FiRefreshCw,
  FiTag,
  FiTrash2,
  FiUser,
  FiVideo,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import { AccountSettingsPage } from "../../components/settings/AccountSettingsPage";
import {
  useCreateTutorService,
  useDeleteTutorService,
  useTutorAvailability,
  useTutorBookings,
  useTutorServices,
  useUpdateBookingStatus,
  useUpdateTutorService,
} from "../../features/tutor/tutorQueries";
import { tutorServiceSchema, type TutorServiceFormValues } from "../../features/tutor/tutorSchemas";
import type { ServicePayload, TutorBooking, TutorService } from "../../features/tutor/tutorTypes";
import {
  AdminSectionHeader,
  DataTable,
  DetailsDrawer,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SearchInput,
  SelectFilter,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from "../../components/ui/adminUi";
import { formatValue, getErrorMessage } from "../../components/ui/adminFormat";
import { TutorAvailabilityPage } from "../../features/availability/components/TutorAvailabilityPage";

const serviceDefaults: TutorServiceFormValues = {
  name: "",
  description: "",
  category: "",
  language: "",
  duration_minutes: 60,
  price: 0,
  meeting_platform: "",
  is_active: true,
};

const SERVICE_CATEGORY_OPTIONS = [
  "English",
  "English-Learning",
  "Haitian-Creole",
  "Haitian-Creole Tutoring",
  "Lingala",
  "Questions & Answers",
  "Spanish Tutoring",
];

const SERVICE_LANGUAGE_OPTIONS = [
  "English",
  "Espanol",
  "Haitian-Creole",
  "Lingala",
];

const withCurrentOption = (options: string[], current?: string) =>
  current && !options.includes(current) ? [current, ...options] : options;

const toPayload = (values: TutorServiceFormValues): ServicePayload => ({
  name: String(values.name).trim(),
  description: String(values.description).trim(),
  category: String(values.category).trim(),
  language: String(values.language).trim(),
  duration_minutes: Number(values.duration_minutes),
  price: Number(values.price),
  meeting_platform: String(values.meeting_platform ?? "").trim() || undefined,
  is_active: Boolean(values.is_active),
});

const statusName = (status?: string) => status?.trim() || "Unknown";
const isUpcoming = (booking: TutorBooking) => {
  const parsed = Date.parse(`${booking.booking_date}T${booking.end_time}`);
  return Number.isFinite(parsed) && parsed >= Date.now();
};

const getDisplayName = (name?: string) => {
  const normalizedName = name?.trim();

  if (!normalizedName || ["null", "undefined"].includes(normalizedName.toLowerCase())) {
    return undefined;
  }

  return normalizedName;
};

const TutorWelcomeBanner = ({
  tutorName,
  isLoading,
}: {
  tutorName?: string;
  isLoading?: boolean;
}) => {
  const displayName = getDisplayName(tutorName);

  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-haiti-navy/10 bg-haiti-navy px-5 py-6 shadow-sm sm:px-7 sm:py-7 lg:px-8">
      <div className="relative grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(13rem,36%)] md:items-center md:gap-8">
        <div className="min-w-0 space-y-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">
              Tutor Overview
            </span>
            <h1
              aria-busy={isLoading}
              className="mt-2 flex min-h-9 flex-wrap items-center gap-x-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
            >
              <span>Welcome back{isLoading || displayName ? "," : ""}</span>
              {isLoading ? (
                <span
                  aria-label="Loading tutor name"
                  className="inline-block h-7 w-36 animate-pulse rounded-md bg-white/15 sm:h-8 sm:w-48"
                />
              ) : displayName ? (
                <span className="break-words text-blue-100">{displayName}</span>
              ) : null}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-100">
              Track your services, availability slots, booking requests, and upcoming teaching sessions.
            </p>
          </div>

          <nav aria-label="Tutor dashboard shortcuts" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/dashboard/tutor/services"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
            >
              Manage Services
              <FiArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/dashboard/tutor/bookings"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-xs font-extrabold text-haiti-navy shadow-sm transition hover:border-haiti-navy/25 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
            >
              View Bookings
            </Link>
          </nav>
        </div>

        <div className="flex min-w-0 justify-center md:justify-end">
          <div className="relative flex h-40 w-full max-w-64 items-center justify-center md:h-44">
            <img
              src="/tutor-related-pictures/tutor.png"
              alt="Tutor dashboard illustration"
              className="relative h-full max-h-44 w-auto max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs font-bold text-red-600">{message}</p> : null;

const ServiceForm = ({
  service,
  onDone,
}: {
  service?: TutorService | null;
  onDone?: () => void;
}) => {
  const { data: user } = useCurrentUser();
  const createService = useCreateTutorService(user?.id);
  const updateService = useUpdateTutorService(user?.id);
  const mutation = service ? updateService : createService;
  const categoryOptions = withCurrentOption(
    SERVICE_CATEGORY_OPTIONS,
    service?.category
  );
  const languageOptions = withCurrentOption(
    SERVICE_LANGUAGE_OPTIONS,
    service?.language
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TutorServiceFormValues>({
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          category: service.category,
          language: service.language,
          duration_minutes: service.duration_minutes,
          price: service.price,
          meeting_platform: service.meeting_platform ?? "",
          is_active: service.is_active ?? true,
        }
      : serviceDefaults,
  });

  const submit = (values: TutorServiceFormValues) => {
    const parsed = tutorServiceSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof TutorServiceFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    const payload = toPayload(parsed.data);
    const options = {
      onSuccess: () => {
        if (!service) reset(serviceDefaults);
        onDone?.();
      },
    };
    if (service) updateService.mutate({ serviceId: service.id, payload }, options);
    else createService.mutate(payload, options);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-red-50/50 px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-blue-100/50 blur-2xl" />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="relative flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-haiti-navy text-white shadow-[0_10px_25px_rgba(6,67,159,.22)]">
              {service ? <FiEdit3 className="size-5" /> : <FiBookOpen className="size-5" />}
            </span>
            <div>
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-haiti-red">
              Service setup
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              {service ? "Edit service" : "Add service"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Define the lesson, pricing, and meeting destination learners will receive.
            </p>
            </div>
          </div>
          <span className="relative inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-2 text-xs font-extrabold text-haiti-navy shadow-sm backdrop-blur">
            <FiVideo className="size-4" />
            Ready for live lessons
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
      {mutation.error ? (
        <div className="mb-5">
          <ErrorState message={getErrorMessage(mutation.error)} />
        </div>
      ) : null}

      <div className="grid gap-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 md:grid-cols-2 sm:p-5">
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiUser className="text-haiti-red" /> Tutor</span>
          <select
            value={user?.id ?? ""}
            disabled
            className="mt-2 h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-600 outline-none"
          >
            {user ? (
              <option value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ) : (
              <option value="">Loading tutor...</option>
            )}
          </select>
        </label>
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiBookOpen className="text-haiti-red" /> Service name</span>
          <input
            {...register("name")}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Haitian Creole conversation coaching"
          />
          <FieldError message={errors.name?.message} />
        </label>
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiTag className="text-haiti-red" /> Category</span>
          <select
            {...register("category")}
            className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Select a category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError message={errors.category?.message} />
        </label>
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiGlobe className="text-haiti-red" /> Language</span>
          <select
            {...register("language")}
            className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Select a language</option>
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <FieldError message={errors.language?.message} />
        </label>
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiClock className="text-haiti-red" /> Duration minutes</span>
          <input
            {...register("duration_minutes")}
            type="number"
            min="0"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="60"
          />
          <FieldError message={errors.duration_minutes?.message} />
        </label>
        <label>
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiDollarSign className="text-haiti-red" /> Price</span>
          <input
            {...register("price")}
            type="number"
            min="0"
            step="0.01"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="45"
          />
          <FieldError message={errors.price?.message} />
        </label>
        <label className="md:col-span-2">
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiLink className="text-haiti-red" /> Lesson meeting link</span>
          <div className="relative mt-2">
            <FiVideo className="pointer-events-none absolute left-4 top-4 size-4 text-slate-400" />
            <input
              {...register("meeting_platform")}
              type="url"
              inputMode="url"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100"
              placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-400">Add the Google Meet, Zoom, Teams, or other secure lesson URL.</p>
          <FieldError message={errors.meeting_platform?.message} />
        </label>
        <label className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 md:col-span-2">
          <span>
            <span className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600" /> Active service</span>
            <span className="mt-0.5 block text-xs font-semibold text-slate-400">
              Visible to learners when enabled.
            </span>
          </span>
          <input {...register("is_active")} type="checkbox" className="size-5 accent-haiti-navy" />
        </label>
        <label className="md:col-span-2">
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500"><FiAlignLeft className="text-haiti-red" /> Description</span>
          <textarea
            {...register("description")}
            className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Briefly explain the goals, format, and ideal learner for this service."
          />
          <FieldError message={errors.description?.message} />
        </label>
      </div>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold leading-5 text-slate-400">
            Review the details before publishing. You can edit this service later.
          </p>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(6,67,159,.18)] transition hover:bg-haiti-navy-dark disabled:cursor-wait disabled:opacity-60"
          >
            {mutation.isPending ? <FiRefreshCw className="size-4 animate-spin" /> : <FiCheckCircle className="size-4" />}
            {service ? "Save service" : "Create service"}
          </button>
        </div>
      </div>
    </form>
  );
};

export const TutorOverview = () => {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const tutorId = user?.tutor_id ?? user?.id;
  const services = useTutorServices(user?.id, user?.email);
  const availability = useTutorAvailability(tutorId);
  const bookings = useTutorBookings(user?.id);
  const serviceData = services.data ?? [];
  const bookingData = bookings.data ?? [];
  const availabilityData = availability.data ?? [];
  const pending = bookingData.filter((booking) => statusName(booking.status).toLowerCase().includes("pending"));
  const upcoming = bookingData.filter(isUpcoming);

  return (
    <section className="space-y-6">
      <TutorWelcomeBanner tutorName={user?.full_name} isLoading={isUserPending} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="My services" value={serviceData.length} icon={FiBookOpen} />
        <StatCard label="Active services" value={serviceData.filter((item) => item.is_active !== false).length} icon={FiCheckCircle} />
        <StatCard label="Availability slots" value={availabilityData.length} icon={FiClock} />
        <StatCard label="Total bookings" value={bookingData.length} icon={FiCalendar} />
        <StatCard label="Pending requests" value={pending.length} icon={FiCalendar} />
      </div>
      {services.isLoading || availability.isLoading || bookings.isLoading ? <LoadingSkeleton rows={3} /> : null}
      {services.isError ? <ErrorState title="Services unavailable" message={getErrorMessage(services.error)} onRetry={() => services.refetch()} /> : null}
      {availability.isError ? <ErrorState title="Availability unavailable" message={getErrorMessage(availability.error)} onRetry={() => availability.refetch()} /> : null}
      {bookings.isError ? <ErrorState title="Bookings unavailable" message={getErrorMessage(bookings.error)} onRetry={() => bookings.refetch()} /> : null}
      <TutorBookingList title="Upcoming sessions" bookings={upcoming.slice(0, 5)} />
    </section>
  );
};

export const TutorServices = () => {
  const { data: user } = useCurrentUser();
  const servicesQuery = useTutorServices(user?.id, user?.email);
  const deleteService = useDeleteTutorService(user?.id);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TutorService | null>(null);
  const services = servicesQuery.data ?? [];
  const filtered = services.filter((service) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      service.category.toLowerCase().includes(term)
    );
  });
  const columns: DataTableColumn<TutorService>[] = [
    { key: "name", header: "Name", render: (service) => <span className="font-extrabold">{service.name}</span> },
    { key: "category", header: "Category", render: (service) => service.category },
    { key: "language", header: "Language", render: (service) => service.language },
    { key: "duration", header: "Duration", render: (service) => `${service.duration_minutes} min` },
    { key: "price", header: "Price", render: (service) => `$${service.price}` },
    ...(services.some((service) => Boolean(service.meeting_platform))
      ? [{
          key: "meeting",
          header: "Meeting",
          render: (service: TutorService) => service.meeting_platform ? (
            <a
              href={service.meeting_platform}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1.5 font-extrabold text-haiti-navy underline-offset-2 hover:underline"
            >
              Open link <FiExternalLink />
            </a>
          ) : "Not set",
        }]
      : []),
    { key: "status", header: "Status", render: (service) => <StatusBadge status={service.is_active} /> },
    {
      key: "actions",
      header: "Actions",
      render: (service) => (
        <div className="flex gap-2">
          <button type="button" onClick={(event) => { event.stopPropagation(); setEditing(service); }} className="rounded-lg border border-slate-200 p-2 text-haiti-navy"><FiEdit3 /></button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (window.confirm("Delete this service?")) deleteService.mutate(service.id);
            }}
            className="rounded-lg border border-red-100 p-2 text-red-600"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Tutor workspace"
        title="My Services"
        description="Create and manage only your own service offerings."
      />
      <ServiceForm />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search my services" />
      </div>
      {servicesQuery.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {servicesQuery.isError ? <ErrorState message={getErrorMessage(servicesQuery.error)} onRetry={() => servicesQuery.refetch()} /> : null}
      {!servicesQuery.isLoading && !servicesQuery.isError ? (
        <DataTable
          items={filtered}
          columns={columns}
          getKey={(service) => service.id}
          empty={<EmptyState title="No services found" description="Create your first service using the form above." />}
        />
      ) : null}
      <DetailsDrawer open={Boolean(editing)} title="Edit service" onClose={() => setEditing(null)}>
        {editing ? <ServiceForm service={editing} onDone={() => setEditing(null)} /> : null}
      </DetailsDrawer>
    </section>
  );
};

export const TutorAvailability = TutorAvailabilityPage;

const TutorBookingList = ({
  title,
  bookings,
}: {
  title: string;
  bookings: TutorBooking[];
}) => (
  <article className="space-y-3">
    <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
    <DataTable
      items={bookings}
      getKey={(booking) => booking.id}
      empty={<EmptyState title="No bookings" description="No bookings matched this view." />}
      columns={[
        { key: "id", header: "Booking", render: (booking) => `#${booking.id}` },
        { key: "date", header: "Date", render: (booking) => booking.booking_date },
        { key: "time", header: "Time", render: (booking) => `${booking.start_time} - ${booking.end_time}` },
        { key: "learner", header: "Learner", render: (booking) => formatValue(booking.learner_id) },
        { key: "status", header: "Status", render: (booking) => <StatusBadge status={booking.status} /> },
        ...(bookings.some((booking) => Boolean(booking.payment_status))
          ? [{ key: "payment", header: "Payment", render: (booking: TutorBooking) => <StatusBadge status={booking.payment_status ?? undefined} /> }]
          : []),
      ]}
    />
  </article>
);

export const TutorBookings = () => {
  const { data: user } = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const query = useTutorBookings(user?.id);
  const updateStatus = useUpdateBookingStatus(user?.id);
  const [status, setStatus] = useState("");
  const view = params.get("view") ?? "all";
  const items = query.data ?? [];
  const filtered = items.filter((booking) => {
    const normalized = statusName(booking.status).toLowerCase();
    if (status && statusName(booking.status) !== status) return false;
    if (view === "requests") return normalized.includes("pending");
    if (view === "upcoming") return isUpcoming(booking);
    if (view === "history") return !isUpcoming(booking);
    return true;
  });
  const statuses = [...new Set(items.map((booking) => statusName(booking.status)))].sort();

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Tutor workspace"
        title="Bookings"
        description="Review tutor bookings and change status only if the backend authorizes it."
      />
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <SelectFilter label="All statuses" value={status} onChange={setStatus} options={statuses} />
        <SelectFilter label="View" value={view === "all" ? "" : view} onChange={(value) => setParams(value ? { view: value } : {})} options={["requests", "upcoming", "history"]} />
      </div>
      {query.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <DataTable
          items={filtered}
          getKey={(booking) => booking.id}
          empty={<EmptyState title="No bookings" description="No bookings matched this view." />}
          columns={[
            { key: "id", header: "Booking", render: (booking) => `#${booking.id}` },
            { key: "date", header: "Date", render: (booking) => booking.booking_date },
            { key: "time", header: "Time", render: (booking) => `${booking.start_time} - ${booking.end_time}` },
            { key: "learner", header: "Learner", render: (booking) => formatValue(booking.learner_id) },
            { key: "status", header: "Status", render: (booking) => <StatusBadge status={booking.status} /> },
            ...(items.some((booking) => Boolean(booking.payment_status))
              ? [{ key: "payment", header: "Payment", render: (booking: TutorBooking) => <StatusBadge status={booking.payment_status ?? undefined} /> }]
              : []),
            {
              key: "actions",
              header: "Actions",
              render: (booking) => (
                <div className="flex gap-2">
                  <button type="button" onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "Confirmed" })} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">Confirm</button>
                  <button type="button" onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "Cancelled" })} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-extrabold text-red-700">Cancel</button>
                </div>
              ),
            },
          ]}
        />
      ) : null}
      {updateStatus.error ? <ErrorState title="Status update failed" message={getErrorMessage(updateStatus.error)} /> : null}
    </section>
  );
};

export const TutorFiles = () => (
  <section className="space-y-6">
    <AdminSectionHeader
      eyebrow="Tutor workspace"
      title="Files"
      description="The PDF documents file lookup endpoints, but does not define how translation requests are assigned to tutors. Keep this page informational until that workflow is documented."
    />
    <EmptyState
      title="File workflow needs backend support"
      description="Tutors need an assigned translation-request list or request IDs before a useful file workspace can be built."
    />
  </section>
);

export const TutorAccount = () => (
  <AccountSettingsPage
    eyebrow="Tutor Preferences"
    title="Tutor Settings"
    description="Manage your tutor profile, teaching credentials, and account security."
    roleBadgeLabel="Educator & Tutor"
  />
);
