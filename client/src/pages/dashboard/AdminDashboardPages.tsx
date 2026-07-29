import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiCalendar,
  FiArrowRight,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import { AccountSettingsPage } from "../../components/settings/AccountSettingsPage";
import {
  useAdminService,
  useAdminServices,
  useAdminTeacherServices,
} from "../../features/services/services.queries";
import {
  useAdminAvailability,
  useAdminAvailabilitySlot,
  useAdminTeacherAvailability,
} from "../../features/availability/availability.queries";
import {
  useAdminBooking,
  useAdminBookings,
  useAdminStudentBookings,
  useAdminTeacherBookings,
} from "../../features/bookings/bookings.queries";
import {
  useAdminTranslationRequestFileLists,
  useAdminTranslationRequests,
  useDeleteAdminFile,
} from "../../features/files/files.queries";
import { ApiError } from "../../lib/apiClient";
import type {
  AdminAvailability as AdminAvailabilityRecord,
  AdminBooking,
  AdminFile,
  AdminService,
  AdminTranslationRequest,
  CountDatum,
} from "../../types/adminApi";
import {
  AdminSectionHeader,
  DataTable,
  DetailsDrawer,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  Pagination,
  PermissionDenied,
  SearchInput,
  SelectFilter,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from "../../components/ui/adminUi";
import { formatValue, getErrorMessage } from "../../components/ui/adminFormat";

const chartColors = ["#06439f", "#CE1126", "#0f766e", "#7c3aed", "#ca8a04", "#475569"];
const pageSize = 8;

const has = <T,>(items: T[], pick: (item: T) => unknown) =>
  items.some((item) => pick(item) !== undefined && pick(item) !== null && pick(item) !== "");

const uniqueOptions = <T,>(items: T[], pick: (item: T) => unknown) =>
  Array.from(
    new Set(
      items
        .map((item) => pick(item))
        .filter((value): value is string | number => value !== undefined && value !== null && value !== "")
        .map(String)
    )
  ).sort((a, b) => a.localeCompare(b));

const countBy = <T,>(items: T[], pick: (item: T) => unknown): CountDatum[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const raw = pick(item);
    if (raw === undefined || raw === null || raw === "") return;
    const key = String(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
};

const byDateDesc = <T extends { createdAt?: string; bookingDate?: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const left = Date.parse(a.createdAt ?? a.bookingDate ?? "");
    const right = Date.parse(b.createdAt ?? b.bookingDate ?? "");
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });

const formatDateTime = (value?: string) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatTimeOnly = (value?: string) => {
  if (!value) return "Not provided";
  const trimmed = value.trim();
  const simpleTime = trimmed.match(/^(\d{1,2}):(\d{2})/);

  if (simpleTime) {
    return `${simpleTime[1].padStart(2, "0")}:${simpleTime[2]}`;
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return trimmed;
};

const formatTimeRange = (start?: string, end?: string) => {
  if (!start && !end) return "Time not provided";
  return `${formatTimeOnly(start)} - ${formatTimeOnly(end)}`;
};

const formatBackendFieldValue = (key: string, value: unknown) => {
  if (typeof value === "string" && key.toLowerCase().includes("time")) {
    return formatTimeOnly(value);
  }

  return formatValue(value);
};

const formatBytes = (bytes?: number) => {
  if (!Number.isFinite(bytes) || !bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPendingStatus = (status?: string) =>
  !status || status.toLowerCase().includes("pending") || status.toLowerCase().includes("new");

const usePagedItems = <T,>(items: T[]) => {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { paged, page: safePage, pageCount, setPage };
};

const RawDetails = ({ record }: { record: Record<string, unknown> }) => (
  <dl className="grid gap-3">
    {Object.entries(record).map(([key, value]) => (
      <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {key}
        </dt>
        <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
          {typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : formatValue(value)}
        </dd>
      </div>
    ))}
  </dl>
);

const PartialError = ({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: unknown;
  onRetry: () => void;
}) => {
  if (error instanceof ApiError && error.status === 403) {
    return <PermissionDenied message={`${label}: ${error.message}`} />;
  }

  return (
    <ErrorState
      title={`${label} unavailable`}
      message={getErrorMessage(error)}
      onRetry={onRetry}
    />
  );
};

const DistributionChart = ({
  title,
  data,
  type = "pie",
}: {
  title: string;
  data: CountDatum[];
  type?: "pie" | "bar";
}) => {
  if (data.length < 2) return null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Tooltip />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95}>
                {data.map((item, index) => (
                  <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#06439f" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </article>
  );
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatServicePrice = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? money.format(value) : "Not provided";

const formatDuration = (minutes?: number) => {
  if (!minutes || !Number.isFinite(minutes)) return "Not provided";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

const ServiceDetailItem = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof FiLayers;
}) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-haiti-navy shadow-xs">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const ServiceDetailsPanel = ({ service }: { service: AdminService }) => {
  const rawFields = Object.entries(service.raw).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return typeof value !== "object";
  });

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50">
        <div className="bg-haiti-navy px-5 py-5 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-100">
                Service profile
              </p>
              <h3 className="mt-2 break-words text-xl font-extrabold text-white">
                {formatValue(service.name)}
              </h3>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                Service #{formatValue(service.id)}
              </p>
            </div>
            {service.isActive !== undefined ? <StatusBadge status={service.isActive} /> : null}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ServiceDetailItem label="Category" value={formatValue(service.category)} icon={FiLayers} />
          <ServiceDetailItem label="Language" value={formatValue(service.language)} icon={FiFileText} />
          <ServiceDetailItem label="Duration" value={formatDuration(service.durationMinutes)} icon={FiClock} />
          <ServiceDetailItem label="Price" value={formatServicePrice(service.price)} icon={FiCalendar} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-950">Description</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {service.description?.trim() || "No service description has been provided yet."}
        </p>
      </section>

      <section>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Created
          </p>
          <p className="mt-2 text-sm font-extrabold text-slate-900">
            {formatDateTime(service.createdAt)}
          </p>
        </div>
      </section>

      {rawFields.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-950">Backend fields</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {rawFields.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  {key}
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-800">
                  {formatBackendFieldValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
};

const availabilityLabel = (availability: AdminAvailabilityRecord) =>
  availability.day ?? availability.date ?? "Availability window";

const AvailabilityDetailsPanel = ({
  availability,
}: {
  availability: AdminAvailabilityRecord;
}) => {
  const rawFields = Object.entries(availability.raw).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return typeof value !== "object";
  });

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50">
        <div className="bg-haiti-navy px-5 py-5 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-100">
                Availability profile
              </p>
              <h3 className="mt-2 break-words text-xl font-extrabold text-white">
                {availabilityLabel(availability)}
              </h3>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                Availability #{formatValue(availability.id)}
              </p>
            </div>
            {availability.isActive !== undefined ? (
              <StatusBadge status={availability.isActive} />
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ServiceDetailItem label="Day" value={formatValue(availability.day)} icon={FiCalendar} />
          <ServiceDetailItem label="Date" value={formatValue(availability.date)} icon={FiFileText} />
          <ServiceDetailItem label="Start time" value={formatTimeOnly(availability.startTime)} icon={FiClock} />
          <ServiceDetailItem label="End time" value={formatTimeOnly(availability.endTime)} icon={FiClock} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Tutor
          </p>
          <p className="mt-2 text-sm font-extrabold text-slate-900">
            {formatValue(availability.teacherId)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Created
          </p>
          <p className="mt-2 text-sm font-extrabold text-slate-900">
            {formatDateTime(availability.createdAt)}
          </p>
        </div>
      </section>

      {availability.startTime || availability.endTime ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-950">Schedule window</h3>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-extrabold text-haiti-navy">
              <FiClock className="size-4" />
              {formatTimeOnly(availability.startTime)}
            </span>
            <span className="text-sm font-bold text-slate-400">to</span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-extrabold text-haiti-navy">
              <FiClock className="size-4" />
              {formatTimeOnly(availability.endTime)}
            </span>
          </div>
        </section>
      ) : null}

      {rawFields.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-950">Backend fields</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {rawFields.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  {key}
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-800">
                  {formatBackendFieldValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
};

const bookingWindowLabel = (booking: AdminBooking) => {
  return formatTimeRange(booking.startTime, booking.endTime);
};

const BookingDetailsPanel = ({ booking }: { booking: AdminBooking }) => {
  const rawFields = Object.entries(booking.raw).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return typeof value !== "object";
  });

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50">
        <div className="bg-haiti-navy px-5 py-5 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-100">
                Booking profile
              </p>
              <h3 className="mt-2 break-words text-xl font-extrabold text-white">
                Booking #{formatValue(booking.id)}
              </h3>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                {formatValue(booking.bookingDate)} · {bookingWindowLabel(booking)}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ServiceDetailItem label="Booking date" value={formatValue(booking.bookingDate)} icon={FiCalendar} />
          <ServiceDetailItem label="Time window" value={bookingWindowLabel(booking)} icon={FiClock} />
          <ServiceDetailItem label="Service" value={formatValue(booking.serviceId)} icon={FiLayers} />
          <ServiceDetailItem label="Availability" value={formatValue(booking.availabilityId)} icon={FiFileText} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Tutor
          </p>
          <p className="mt-2 text-sm font-extrabold text-slate-900">
            {formatValue(booking.teacherId ?? booking.tutorId)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Learner
          </p>
          <p className="mt-2 text-sm font-extrabold text-slate-900">
            {formatValue(booking.studentId ?? booking.learnerId)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-950">Booking notes</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {booking.notes?.trim() || "No notes were provided for this booking."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-950">Schedule summary</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-extrabold text-haiti-navy">
            <FiCalendar className="size-4" />
            {formatValue(booking.bookingDate)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-extrabold text-haiti-navy">
            <FiClock className="size-4" />
            {bookingWindowLabel(booking)}
          </span>
        </div>
      </section>

      {rawFields.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-950">Backend fields</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {rawFields.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  {key}
                </dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-800">
                  {formatBackendFieldValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
};

const getDisplayName = (name?: string) => {
  const normalizedName = name?.trim();

  if (!normalizedName || ["null", "undefined"].includes(normalizedName.toLowerCase())) {
    return undefined;
  }

  return normalizedName;
};

const AdminWelcomeBanner = ({
  adminName,
  isLoading,
}: {
  adminName?: string;
  isLoading?: boolean;
}) => {
  const displayName = getDisplayName(adminName);

  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-haiti-navy/10 bg-haiti-navy px-5 py-6 shadow-sm sm:px-7 sm:py-7 lg:px-8">
      <div className="relative grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(13rem,36%)] md:items-center md:gap-8">
        <div className="min-w-0 space-y-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">
              Admin Overview
            </span>
            <h1
              aria-busy={isLoading}
              className="mt-2 flex min-h-9 flex-wrap items-center gap-x-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
            >
              <span>Welcome back{isLoading || displayName ? "," : ""}</span>
              {isLoading ? (
                <span
                  aria-label="Loading admin name"
                  className="inline-block h-7 w-36 animate-pulse rounded-md bg-white/15 sm:h-8 sm:w-48"
                />
              ) : displayName ? (
                <span className="break-words text-blue-100">{displayName}</span>
              ) : null}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-100">
              Monitor platform services, booking activity, operational trends, and recent admin data.
            </p>
          </div>

          <nav aria-label="Admin dashboard shortcuts" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/dashboard/admin/services"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
            >
              Manage Services
              <FiArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/dashboard/admin/bookings"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-xs font-extrabold text-haiti-navy shadow-sm transition hover:border-haiti-navy/25 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
            >
              View Bookings
            </Link>
          </nav>
        </div>

        <div className="flex min-w-0 justify-center md:justify-end">
          <div className="relative flex h-40 w-full max-w-64 items-center justify-center md:h-44">
            <img
              src="/admin-related-pictures/admin.png"
              alt="Admin dashboard illustration"
              className="relative h-full max-h-44 w-auto max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export const AdminOverview = () => {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const services = useAdminServices();
  const bookings = useAdminBookings();

  const serviceData = services.data ?? [];
  const bookingData = bookings.data ?? [];
  const serviceCategories = countBy(serviceData, (item) => item.category);
  const serviceLanguages = countBy(serviceData, (item) => item.language);
  const recentServices = byDateDesc(serviceData).slice(0, 5);
  const recentBookings = byDateDesc(bookingData).slice(0, 5);
  const activeServices = serviceData.filter((item) => item.isActive === true).length;
  const pendingBookings = bookingData.filter((item) => isPendingStatus(item.status)).length;

  return (
    <section className="space-y-6">
      <AdminWelcomeBanner adminName={user?.full_name} isLoading={isUserPending} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total services" value={serviceData.length} icon={FiLayers} />
        <StatCard label="Active services" value={activeServices} icon={FiLayers} />
        <StatCard label="Total bookings" value={bookingData.length} icon={FiCalendar} />
        <StatCard label="Pending bookings" value={pendingBookings} icon={FiCalendar} />
      </div>

      <div className="grid gap-3">
        {services.isLoading || bookings.isLoading ? (
          <LoadingSkeleton rows={2} />
        ) : null}
        {services.isError ? (
          <PartialError label="Services" error={services.error} onRetry={() => services.refetch()} />
        ) : null}
        {bookings.isError ? (
          <PartialError label="Bookings" error={bookings.error} onRetry={() => bookings.refetch()} />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionChart title="Service categories" data={serviceCategories} type="bar" />
        <DistributionChart title="Service languages" data={serviceLanguages} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article>
          <h2 className="mb-3 text-base font-extrabold text-slate-950">Recent services</h2>
          <DataTable
            items={recentServices}
            getKey={(item) => item.id}
            empty={<EmptyState title="No services found" description="The services endpoint returned no records." />}
            columns={[
              {
                key: "name",
                header: "Name",
                render: (item) => <span className="font-extrabold">{formatValue(item.name)}</span>,
              },
              { key: "category", header: "Category", render: (item) => formatValue(item.category) },
              { key: "language", header: "Language", render: (item) => formatValue(item.language) },
            ]}
          />
        </article>
        <article>
          <h2 className="mb-3 text-base font-extrabold text-slate-950">Recent bookings</h2>
          <DataTable
            items={recentBookings}
            getKey={(item) => item.id}
            empty={<EmptyState title="No bookings found" description="The bookings endpoint returned no records." />}
            columns={[
              { key: "id", header: "Booking ID", render: (item) => formatValue(item.id) },
              { key: "date", header: "Date", render: (item) => formatValue(item.bookingDate) },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
          />
        </article>
      </div>
    </section>
  );
};

export const AdminServices = () => {
  const query = useAdminServices();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<AdminService | null>(null);
  const [teacherId, setTeacherId] = useState<string | number>();
  const detail = useAdminService(selected?.id);
  const teacherServices = useAdminTeacherServices(teacherId);

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const language = params.get("language") ?? "";
  const active = params.get("active") ?? "";

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const items = query.data ?? [];
  const filtered = items.filter((item) => {
    const text = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;
    const matchesLanguage = !language || item.language === language;
    const matchesActive =
      !active ||
      (active === "active" && item.isActive === true) ||
      (active === "inactive" && item.isActive === false);
    return matchesSearch && matchesCategory && matchesLanguage && matchesActive;
  });
  const { paged, page, pageCount, setPage } = usePagedItems(filtered);

  const columns: DataTableColumn<AdminService>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <div>
          <p className="font-extrabold text-slate-900">{formatValue(item.name)}</p>
          <p className="mt-1 line-clamp-2 max-w-sm text-xs text-slate-500">
            {formatValue(item.description)}
          </p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (item) => formatValue(item.category) },
    { key: "language", header: "Language", render: (item) => formatValue(item.language) },
    { key: "duration", header: "Duration", render: (item) => formatValue(item.durationMinutes) },
    { key: "price", header: "Price", render: (item) => formatValue(item.price) },
  ];

  if (has(items, (item) => item.isActive)) {
    columns.push({
      key: "active",
      header: "State",
      render: (item) => <StatusBadge status={item.isActive} />,
    });
  }

  if (has(items, (item) => item.teacherId)) {
    columns.push({
      key: "teacher",
      header: "Teacher ID",
      render: (item) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setTeacherId(item.teacherId);
          }}
          className="font-extrabold text-haiti-navy underline-offset-2 hover:underline"
        >
          {formatValue(item.teacherId)}
        </button>
      ),
    });
  }

  const serviceForDetails = detail.data ?? selected;

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Platform Activity"
        title="Services"
        description="Read-only monitoring for all documented service fields. Owner-only edit and delete actions are intentionally not exposed."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => updateParam("q", value)}
          placeholder="Search name or description"
        />
        <SelectFilter label="All categories" value={category} onChange={(value) => updateParam("category", value)} options={uniqueOptions(items, (item) => item.category)} />
        <SelectFilter label="All languages" value={language} onChange={(value) => updateParam("language", value)} options={uniqueOptions(items, (item) => item.language)} />
        <SelectFilter label="All states" value={active} onChange={(value) => updateParam("active", value)} options={["active", "inactive"]} />
      </FilterBar>

      {query.isLoading ? <LoadingSkeleton /> : null}
      {query.isError ? <PartialError label="Services" error={query.error} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <>
          <DataTable
            items={paged}
            columns={columns}
            getKey={(item) => item.id}
            onRowClick={setSelected}
            empty={<EmptyState title="No matching services" description="Adjust the filters or retry the services endpoint." />}
          />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : null}

      <DetailsDrawer
        open={Boolean(selected)}
        title="Service details"
        description={selected ? `Service #${selected.id}` : undefined}
        onClose={() => setSelected(null)}
      >
        {detail.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {detail.isError ? <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} /> : null}
        {serviceForDetails ? <ServiceDetailsPanel service={serviceForDetails} /> : null}
      </DetailsDrawer>

      <DetailsDrawer
        open={teacherId !== undefined}
        title="Tutor services"
        description={teacherId !== undefined ? `Teacher #${teacherId}` : undefined}
        onClose={() => setTeacherId(undefined)}
      >
        {teacherServices.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {teacherServices.isError ? (
          <ErrorState message={getErrorMessage(teacherServices.error)} onRetry={() => teacherServices.refetch()} />
        ) : null}
        {teacherServices.data ? (
          <DataTable
            items={teacherServices.data}
            getKey={(item) => item.id}
            empty={<EmptyState title="No tutor services" description="The teacher service endpoint returned no records." />}
            columns={[
              { key: "name", header: "Name", render: (item) => formatValue(item.name) },
              { key: "category", header: "Category", render: (item) => formatValue(item.category) },
              { key: "language", header: "Language", render: (item) => formatValue(item.language) },
            ]}
          />
        ) : null}
      </DetailsDrawer>
    </section>
  );
};

export const AdminAvailability = () => {
  const query = useAdminAvailability();
  const [selected, setSelected] = useState<AdminAvailabilityRecord | null>(null);
  const [teacherId, setTeacherId] = useState<string | number>();
  const [teacherFilter, setTeacherFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const detail = useAdminAvailabilitySlot(selected?.id);
  const teacherAvailability = useAdminTeacherAvailability(teacherId);
  const items = query.data ?? [];
  const filtered = items.filter((item) => {
    const matchesTeacher = !teacherFilter || String(item.teacherId) === teacherFilter;
    const matchesDate = !dateFilter || item.date === dateFilter || item.day === dateFilter;
    return matchesTeacher && matchesDate;
  });
  const { paged, page, pageCount, setPage } = usePagedItems(filtered);

  const columns: DataTableColumn<AdminAvailabilityRecord>[] = [
    { key: "id", header: "ID", render: (item) => formatValue(item.id) },
    ...(has(items, (item) => item.teacherId)
      ? [{
          key: "teacher",
          header: "Tutor",
          render: (item: AdminAvailabilityRecord) => (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setTeacherId(item.teacherId);
              }}
              className="font-extrabold text-haiti-navy underline-offset-2 hover:underline"
            >
              {formatValue(item.teacherId)}
            </button>
          ),
        }]
      : []),
    ...(has(items, (item) => item.date)
      ? [{ key: "date", header: "Date", render: (item: AdminAvailabilityRecord) => formatValue(item.date) }]
      : []),
    ...(has(items, (item) => item.day)
      ? [{ key: "day", header: "Day", render: (item: AdminAvailabilityRecord) => formatValue(item.day) }]
      : []),
    { key: "start", header: "Start", render: (item) => formatTimeOnly(item.startTime) },
    { key: "end", header: "End", render: (item) => formatTimeOnly(item.endTime) },
    ...(has(items, (item) => item.isActive)
      ? [{ key: "state", header: "State", render: (item: AdminAvailabilityRecord) => <StatusBadge status={item.isActive} /> }]
      : []),
  ];
  const availabilityForDetails = detail.data ?? selected;

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Platform Activity"
        title="Availability"
        description="Read-only tutor availability inspection using the documented availability endpoints."
      />
      <FilterBar>
        <SelectFilter label="All tutors" value={teacherFilter} onChange={setTeacherFilter} options={uniqueOptions(items, (item) => item.teacherId)} />
        <SelectFilter label="All dates/days" value={dateFilter} onChange={setDateFilter} options={uniqueOptions(items, (item) => item.date ?? item.day)} />
      </FilterBar>
      {query.isLoading ? <LoadingSkeleton /> : null}
      {query.isError ? <PartialError label="Availability" error={query.error} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <>
          <DataTable
            items={paged}
            columns={columns}
            getKey={(item) => item.id}
            onRowClick={setSelected}
            empty={<EmptyState title="No availability records" description="No records matched the current filters." />}
          />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : null}

      <DetailsDrawer open={Boolean(selected)} title="Availability details" onClose={() => setSelected(null)}>
        {detail.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {detail.isError ? <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} /> : null}
        {availabilityForDetails ? <AvailabilityDetailsPanel availability={availabilityForDetails} /> : null}
      </DetailsDrawer>

      <DetailsDrawer open={teacherId !== undefined} title="Tutor availability" description={teacherId !== undefined ? `Teacher #${teacherId}` : undefined} onClose={() => setTeacherId(undefined)}>
        {teacherAvailability.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {teacherAvailability.isError ? <ErrorState message={getErrorMessage(teacherAvailability.error)} onRetry={() => teacherAvailability.refetch()} /> : null}
        {teacherAvailability.data ? (
          <DataTable
            items={teacherAvailability.data}
            getKey={(item) => item.id}
            empty={<EmptyState title="No tutor availability" description="The teacher availability endpoint returned no records." />}
            columns={columns.filter((column) => column.key !== "teacher")}
          />
        ) : null}
      </DetailsDrawer>
    </section>
  );
};

export const AdminBookings = () => {
  const query = useAdminBookings();
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [status, setStatus] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [date, setDate] = useState("");
  const [relatedTeacherId, setRelatedTeacherId] = useState<string | number>();
  const [relatedStudentId, setRelatedStudentId] = useState<string | number>();
  const detail = useAdminBooking(selected?.id);
  const teacherBookings = useAdminTeacherBookings(relatedTeacherId);
  const studentBookings = useAdminStudentBookings(relatedStudentId);
  const items = query.data ?? [];

  const filtered = items.filter((item) => {
    const matchesStatus = !status || item.status === status;
    const matchesTutor = !tutorId || String(item.teacherId ?? item.tutorId) === tutorId;
    const matchesLearner = !learnerId || String(item.learnerId ?? item.studentId) === learnerId;
    const matchesBooking = !bookingId || String(item.id).includes(bookingId);
    const matchesDate = !date || item.bookingDate === date;
    return matchesStatus && matchesTutor && matchesLearner && matchesBooking && matchesDate;
  });
  const { paged, page, pageCount, setPage } = usePagedItems(filtered);

  const columns: DataTableColumn<AdminBooking>[] = [
    { key: "id", header: "Booking ID", render: (item) => formatValue(item.id) },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    ...(has(items, (item) => item.bookingDate)
      ? [{ key: "date", header: "Date", render: (item: AdminBooking) => formatValue(item.bookingDate) }]
      : []),
    { key: "time", header: "Time", render: (item) => formatTimeRange(item.startTime, item.endTime) },
    {
      key: "tutor",
      header: "Tutor ID",
      render: (item) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setRelatedTeacherId(item.teacherId ?? item.tutorId);
          }}
          className="font-extrabold text-haiti-navy underline-offset-2 hover:underline"
        >
          {formatValue(item.teacherId ?? item.tutorId)}
        </button>
      ),
    },
    {
      key: "learner",
      header: "Learner ID",
      render: (item) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setRelatedStudentId(item.studentId ?? item.learnerId);
          }}
          className="font-extrabold text-haiti-navy underline-offset-2 hover:underline"
        >
          {formatValue(item.studentId ?? item.learnerId)}
        </button>
      ),
    },
  ];
  const bookingForDetails = detail.data ?? selected;

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Platform Activity"
        title="Bookings"
        description="Read-only booking inspection. Mutation endpoints are documented, but admin authorization is not confirmed, so destructive and status actions are not shown."
      />
      <FilterBar>
        <SearchInput value={bookingId} onChange={setBookingId} placeholder="Search booking ID" />
        <SelectFilter label="All statuses" value={status} onChange={setStatus} options={uniqueOptions(items, (item) => item.status)} />
        <SelectFilter label="All tutors" value={tutorId} onChange={setTutorId} options={uniqueOptions(items, (item) => item.teacherId ?? item.tutorId)} />
        <SelectFilter label="All learners" value={learnerId} onChange={setLearnerId} options={uniqueOptions(items, (item) => item.studentId ?? item.learnerId)} />
        {has(items, (item) => item.bookingDate) ? (
          <SelectFilter label="All dates" value={date} onChange={setDate} options={uniqueOptions(items, (item) => item.bookingDate)} />
        ) : null}
      </FilterBar>
      {query.isLoading ? <LoadingSkeleton /> : null}
      {query.isError ? <PartialError label="Bookings" error={query.error} onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <>
          <DataTable
            items={paged}
            columns={columns}
            getKey={(item) => item.id}
            onRowClick={setSelected}
            empty={<EmptyState title="No bookings found" description="No records matched the current filters." />}
          />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : null}

      <DetailsDrawer open={Boolean(selected)} title="Booking details" onClose={() => setSelected(null)}>
        {detail.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {detail.isError ? <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} /> : null}
        {bookingForDetails ? <BookingDetailsPanel booking={bookingForDetails} /> : null}
      </DetailsDrawer>

      <DetailsDrawer open={relatedTeacherId !== undefined} title="Tutor bookings" description={relatedTeacherId !== undefined ? `Teacher #${relatedTeacherId}` : undefined} onClose={() => setRelatedTeacherId(undefined)}>
        {teacherBookings.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {teacherBookings.isError ? <ErrorState message={getErrorMessage(teacherBookings.error)} onRetry={() => teacherBookings.refetch()} /> : null}
        {teacherBookings.data ? (
          <DataTable
            items={teacherBookings.data}
            getKey={(item) => item.id}
            empty={<EmptyState title="No tutor bookings" description="The teacher bookings endpoint returned no records." />}
            columns={columns}
          />
        ) : null}
      </DetailsDrawer>

      <DetailsDrawer open={relatedStudentId !== undefined} title="Learner bookings" description={relatedStudentId !== undefined ? `Student #${relatedStudentId}` : undefined} onClose={() => setRelatedStudentId(undefined)}>
        {studentBookings.isLoading ? <LoadingSkeleton rows={2} /> : null}
        {studentBookings.isError ? <ErrorState message={getErrorMessage(studentBookings.error)} onRetry={() => studentBookings.refetch()} /> : null}
        {studentBookings.data ? (
          <DataTable
            items={studentBookings.data}
            getKey={(item) => item.id}
            empty={<EmptyState title="No learner bookings" description="The student bookings endpoint returned no records." />}
            columns={columns}
          />
        ) : null}
      </DetailsDrawer>
    </section>
  );
};

const AdminFileCard = ({
  file,
  onDelete,
  isDeleting,
}: {
  file: AdminFile;
  onDelete: (file: AdminFile) => void;
  isDeleting: boolean;
}) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-haiti-navy">
          <FiFileText className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">
            {formatValue(file.fileName ?? `File #${file.id}`)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatValue(file.fileType)} • {formatBytes(file.fileSize)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Uploaded {formatDateTime(file.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {file.fileUrl ? (
          <>
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-haiti-navy"
            >
              Open <FiExternalLink className="size-4" />
            </a>
            <a
              href={file.fileUrl}
              download={file.fileName}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-haiti-navy px-3 text-xs font-extrabold text-white transition hover:bg-haiti-navy-dark"
            >
              Download <FiDownload className="size-4" />
            </a>
          </>
        ) : null}
        {file.id ? (
          <button
            type="button"
            onClick={() => onDelete(file)}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiTrash2 className="size-4" />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  </article>
);

const RequestCard = ({
  request,
  files,
  isLoadingFiles,
  onOpenDetails,
  onDeleteFile,
  isDeleting,
}: {
  request: AdminTranslationRequest;
  files: AdminFile[];
  isLoadingFiles: boolean;
  onOpenDetails: (request: AdminTranslationRequest) => void;
  onDeleteFile: (file: AdminFile) => void;
  isDeleting: boolean;
}) => (
  <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-linear-to-br from-white to-blue-50/40 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {isPendingStatus(request.status) ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                Needs attention
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-extrabold text-slate-950">
            {request.learnerName ?? request.learnerEmail ?? `Learner #${formatValue(request.learnerId)}`}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {request.sourceLanguage ?? "Source"} → {request.targetLanguage ?? "Target"} • Requested {formatDateTime(request.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenDetails(request)}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-haiti-navy"
        >
          View details
        </button>
      </div>
      {request.notes || request.originalText ? (
        <p className="mt-4 line-clamp-2 max-w-4xl text-sm leading-6 text-slate-600">
          {request.notes ?? request.originalText}
        </p>
      ) : null}
    </div>
    <div className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
          Attached files
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600">
          {files.length} file{files.length === 1 ? "" : "s"}
        </span>
      </div>
      {isLoadingFiles ? (
        <LoadingSkeleton rows={2} />
      ) : files.length ? (
        <div className="grid gap-3">
          {files.map((file, index) => (
            <AdminFileCard
              key={String(file.id ?? `${request.id}-${index}`)}
              file={file}
              onDelete={onDeleteFile}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No files attached"
          description="This translation request does not currently have any uploaded files attached."
        />
      )}
    </div>
  </article>
);

export const AdminFiles = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AdminTranslationRequest | null>(null);
  const requestsQuery = useAdminTranslationRequests();
  const requests = useMemo(() => byDateDesc(requestsQuery.data ?? []), [requestsQuery.data]);
  const requestIds = useMemo(() => requests.map((request) => request.id), [requests]);
  const fileQueries = useAdminTranslationRequestFileLists(requestIds);
  const deleteFile = useDeleteAdminFile();

  const filesByRequestId = useMemo(
    () =>
      new Map(
        requestIds.map((requestId, index) => [
          String(requestId),
          fileQueries[index]?.data ?? [],
        ]),
      ),
    [fileQueries, requestIds],
  );

  const allFiles = useMemo(
    () => [...filesByRequestId.values()].flat(),
    [filesByRequestId],
  );

  const visibleRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return requests.filter((request) => {
      const files = filesByRequestId.get(String(request.id)) ?? [];
      const matchesStatus = !status || request.status === status;
      const haystack = [
        request.learnerName,
        request.learnerEmail,
        request.learnerId,
        request.status,
        request.sourceLanguage,
        request.targetLanguage,
        request.notes,
        request.originalText,
        request.translatedText,
        ...files.map((file) => file.fileName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [filesByRequestId, requests, search, status]);

  const { paged, page, pageCount, setPage } = usePagedItems(visibleRequests);
  const pendingCount = requests.filter((request) => isPendingStatus(request.status)).length;
  const requestsWithFiles = requests.filter(
    (request) => (filesByRequestId.get(String(request.id)) ?? []).length > 0,
  ).length;
  const fileLoadError = fileQueries.find((query) => query.isError)?.error;
  const filesLoading = fileQueries.some((query) => query.isLoading);
  const selectedRequestFiles = selectedRequest
    ? filesByRequestId.get(String(selectedRequest.id)) ?? []
    : [];

  const handleDeleteFile = (file: AdminFile) => {
    if (!file.id) return;
    const confirmed = window.confirm(`Delete ${file.fileName ?? "this file"}?`);
    if (!confirmed) return;

    deleteFile.mutate(file.id, {
      onSuccess: () => toast.success("File deleted."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Translation management"
        title="Translation Requests"
        description="Review learner translation requests, see pending work quickly, and manage every file attached to each real backend request."
        actions={
          <button
            type="button"
            onClick={() => {
              requestsQuery.refetch();
              fileQueries.forEach((query) => query.refetch());
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-extrabold text-haiti-navy shadow-sm transition hover:bg-blue-50"
          >
            <FiRefreshCw className="size-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total requests" value={requests.length} detail="Real translation requests" icon={FiFileText} />
        <StatCard label="Pending requests" value={pendingCount} detail="Requests needing attention" icon={FiClock} />
        <StatCard label="Attached files" value={allFiles.length} detail={`${requestsWithFiles} requests include files`} icon={FiLayers} />
      </div>

      <FilterBar>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FiSearch className="size-4 shrink-0 text-slate-400" />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search learner, email, status, language, notes, or file name..."
            label="Search translation requests"
          />
        </div>
        <SelectFilter
          label="All statuses"
          value={status}
          onChange={setStatus}
          options={uniqueOptions(requests, (request) => request.status)}
        />
      </FilterBar>

      {requestsQuery.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {requestsQuery.isError ? (
        requestsQuery.error instanceof ApiError && requestsQuery.error.status === 403 ? (
          <PermissionDenied message={getErrorMessage(requestsQuery.error)} />
        ) : (
          <ErrorState
            title="Translation requests could not be loaded"
            message={getErrorMessage(requestsQuery.error)}
            onRetry={() => requestsQuery.refetch()}
          />
        )
      ) : null}
      {fileLoadError ? (
        <ErrorState
          title="Some request files could not be loaded"
          message={getErrorMessage(fileLoadError)}
        />
      ) : null}

      {!requestsQuery.isLoading && !requestsQuery.isError ? (
        visibleRequests.length ? (
          <div className="space-y-4">
            {paged.map((request) => (
              <RequestCard
                key={String(request.id)}
                request={request}
                files={filesByRequestId.get(String(request.id)) ?? []}
                isLoadingFiles={filesLoading}
                onOpenDetails={setSelectedRequest}
                onDeleteFile={handleDeleteFile}
                isDeleting={deleteFile.isPending}
              />
            ))}
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        ) : (
          <EmptyState
            title="No translation requests found"
            description="No real backend translation requests match the current search or status filter."
          />
        )
      ) : null}

      <DetailsDrawer
        open={Boolean(selectedRequest)}
        title="Translation request details"
        description={
          selectedRequest
            ? `${selectedRequest.learnerName ?? selectedRequest.learnerEmail ?? "Learner request"} • ${selectedRequest.status ?? "Unknown status"}`
            : undefined
        }
        onClose={() => setSelectedRequest(null)}
      >
        {selectedRequest ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Learner", selectedRequest.learnerName ?? selectedRequest.learnerEmail ?? selectedRequest.learnerId],
                ["Email", selectedRequest.learnerEmail],
                ["Status", selectedRequest.status],
                ["Language pair", `${selectedRequest.sourceLanguage ?? "Source"} → ${selectedRequest.targetLanguage ?? "Target"}`],
                ["Created", formatDateTime(selectedRequest.createdAt)],
                ["Updated", formatDateTime(selectedRequest.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-sm font-bold text-slate-800">{formatValue(value)}</p>
                </div>
              ))}
            </div>

            {selectedRequest.notes || selectedRequest.originalText || selectedRequest.translatedText ? (
              <div className="space-y-3">
                {selectedRequest.notes ? (
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Notes</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedRequest.notes}</p>
                  </div>
                ) : null}
                {selectedRequest.originalText ? (
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Original text</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedRequest.originalText}</p>
                  </div>
                ) : null}
                {selectedRequest.translatedText ? (
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Translated text</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedRequest.translatedText}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Attached files</h3>
              <div className="mt-3 space-y-3">
                {selectedRequestFiles.length ? (
                  selectedRequestFiles.map((file, index) => (
                    <AdminFileCard
                      key={String(file.id ?? `${selectedRequest.id}-drawer-${index}`)}
                      file={file}
                      onDelete={handleDeleteFile}
                      isDeleting={deleteFile.isPending}
                    />
                  ))
                ) : (
                  <EmptyState title="No files attached" description="This request currently has no uploaded files." />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Raw backend details</h3>
              <div className="mt-3">
                <RawDetails record={selectedRequest.raw} />
              </div>
            </div>
          </div>
        ) : null}
      </DetailsDrawer>
    </section>
  );
};

export const AdminSettings = () => (
  <AccountSettingsPage
    eyebrow="Admin Preferences"
    title="Admin Settings"
    description="Manage your administrator profile, access permissions, and account security."
    roleBadgeLabel="System Administrator"
  />
);

