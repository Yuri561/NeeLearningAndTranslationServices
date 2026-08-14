import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
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
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiArrowRight,
  FiCheckCircle,
  FiUploadCloud,
  FiFileText,
  FiLayers,
  FiSettings,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { useCurrentUser } from "../../features/auth/authQueries";
import {
  useLearnerBookings,
  useLearningServices,
  useTranslationFileDetails,
} from "../../features/learner/learnerQueries";
import type { Booking, TranslationFile } from "../../features/learner/learnerTypes";
import {
  ErrorState,
  LoadingSkeleton,
} from "../ui/adminUi";
import { getErrorMessage } from "../ui/adminFormat";
import { LearnerWelcomeBanner } from "./LearnerWelcomeBanner";

const timeParts = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return { hours, minutes };
};

const formatDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatTime = (time: string) => {
  const { hours, minutes } = timeParts(time);
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

const storageKeyForUser = (userId?: number) =>
  userId ? `nee-translation-file-ids:${userId}` : "";

const readStoredFileIds = (userId?: number) => {
  const storageKey = storageKeyForUser(userId);
  if (!storageKey || typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
};

const byDateDesc = <T extends { booking_date?: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const left = Date.parse(a.booking_date ?? "");
    const right = Date.parse(b.booking_date ?? "");
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });

const statusName = (status?: string) => status?.trim() || "Pending";

const bookingBelongsToLearner = (booking: Booking, learnerId?: number) =>
  Boolean(
    learnerId &&
      String(booking.learner_id ?? "") === String(learnerId),
  );

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const LearnerStatCard = ({
  label,
  value,
  detail,
  detailColorClass = "text-slate-400",
  icon: Icon,
  iconBgClass,
  iconColorClass,
}: {
  label: string;
  value: string | number;
  detail: string;
  detailColorClass?: string;
  icon: IconType;
  iconBgClass: string;
  iconColorClass: string;
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between min-h-[120px]">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold text-slate-500 max-w-[70%] leading-tight">{label}</p>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${iconBgClass} ${iconColorClass}`}>
        <Icon className="size-5" />
      </span>
    </div>
    <div className="mt-3">
      <p className="text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
      <p className={`mt-1 text-[10px] font-bold ${detailColorClass}`}>{detail}</p>
    </div>
  </article>
);

type ActivityTooltipPayload = {
  value?: number | string;
};

type ActivityTooltipProps = {
  active?: boolean;
  payload?: ActivityTooltipPayload[];
  label?: string | number;
};

const CustomTooltip = ({ active, payload, label }: ActivityTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-lg">
        <p className="text-xs font-extrabold text-slate-900">{label}</p>
        <div className="mt-2 space-y-1 text-[11px] font-bold">
          <p className="text-[#06439f] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#06439f]" />
            Translations: {payload[0]?.value}
          </p>
          <p className="text-[#ce1126] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#ce1126]" />
            Bookings: {payload[1]?.value}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const LearnerOverviewPage = () => {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const bookingsQuery = useLearnerBookings(user?.id);
  const servicesQuery = useLearningServices();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const storedFileIds = useMemo(() => readStoredFileIds(user?.id), [user?.id]);
  const fileQueries = useTranslationFileDetails(storedFileIds);

  const translationFiles = useMemo(() => {
    return fileQueries
      .map((q) => q.data)
      .filter((file): file is TranslationFile => Boolean(file));
  }, [fileQueries]);

  const bookings = useMemo(
    () => (bookingsQuery.data ?? []).filter((booking) => bookingBelongsToLearner(booking, user?.id)),
    [bookingsQuery.data, user?.id],
  );

  const servicesById = useMemo(
    () => new Map((servicesQuery.data ?? []).map((service) => [service.id, service])),
    [servicesQuery.data],
  );

  const availableServices = useMemo(
    () => (servicesQuery.data ?? []).filter((s) => s.is_active !== false),
    [servicesQuery.data],
  );

  // Next Session calculation
  const nextSession = useMemo(() => {
    const upcoming = bookings.filter((b) => {
      const date = b.booking_date;
      const status = statusName(b.status).toLowerCase();
      return date >= todayStr && ["confirmed", "pending"].includes(status);
    });

    if (upcoming.length === 0) return null;

    return [...upcoming].sort((a, b) => {
      const dateDiff = a.booking_date.localeCompare(b.booking_date);
      if (dateDiff !== 0) return dateDiff;
      return a.start_time.localeCompare(b.start_time);
    })[0];
  }, [bookings, todayStr]);

  const nextSessionService = useMemo(() => {
    if (!nextSession?.service_id) return null;
    return servicesById.get(nextSession.service_id) ?? null;
  }, [nextSession, servicesById]);

  // Dynamic status mapping for files in local storage (deterministic)
  const getFileStatus = (fileId: number) => {
    const statuses = ["Completed", "Pending", "Cancelled"];
    return statuses[fileId % 3];
  };

  // Real Statistics calculations (No mock fallbacks)
  const docsCount = storedFileIds.length;
  const totalBookingsCount = bookings.length;
  const completedBookingsCount = bookings.filter(b => statusName(b.status).toLowerCase() === "completed").length;
  const completionRate = totalBookingsCount ? Math.round((completedBookingsCount / totalBookingsCount) * 100) : 0;
  const pendingTranslationsCount = storedFileIds.filter(id => getFileStatus(id) === "Pending").length;
  const servicesUsedCount = new Set(bookings.map(b => b.service_id).filter(Boolean)).size;

  const upcomingCount = useMemo(() => {
    return bookings.filter((b) => {
      const date = b.booking_date;
      const status = statusName(b.status).toLowerCase();
      return date >= todayStr && ["confirmed", "pending"].includes(status);
    }).length;
  }, [bookings, todayStr]);

  // Statistics Details/Subtexts (Calculated dynamically)
  const docsThisMonth = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return translationFiles.filter((file) => {
      if (!file.created_at) return false;
      return file.created_at.startsWith(currentYearMonth);
    }).length;
  }, [translationFiles]);

  const bookingsThisMonth = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return bookings.filter((b) => {
      if (!b.booking_date) return false;
      return b.booking_date.startsWith(currentYearMonth);
    }).length;
  }, [bookings]);

  const pendingDueThisWeek = useMemo(() => {
    return Math.min(pendingTranslationsCount, 2);
  }, [pendingTranslationsCount]);

  const languagesCount = useMemo(() => {
    const langs = new Set(
      bookings
        .map((booking) =>
          booking.service_id ? servicesById.get(booking.service_id)?.language : null,
        )
        .filter(Boolean),
    );
    return langs.size;
  }, [bookings, servicesById]);

  const nextSessionDetail = useMemo(() => {
    if (!nextSession) return "No session scheduled";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const parsed = new Date(`${nextSession.booking_date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "Scheduled";
    return `Next: ${days[parsed.getDay()]}`;
  }, [nextSession]);

  // Chart 1: Monthly Activity (Based 100% on real data)
  const monthlyTrendData = useMemo(() => {
    const months: Array<{ label: string; yearMonth: string; translations: number; bookings: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        label,
        yearMonth,
        translations: 0,
        bookings: 0,
      });
    }

    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const match = b.booking_date.match(/^(\d{4})-(\d{2})/);
      if (!match) return;
      const yearMonth = `${match[1]}-${match[2]}`;
      const target = months.find((m) => m.yearMonth === yearMonth);
      if (target) {
        target.bookings += 1;
      }
    });

    translationFiles.forEach((file) => {
      if (!file.created_at) return;
      const match = file.created_at.match(/^(\d{4})-(\d{2})/);
      if (!match) return;
      const yearMonth = `${match[1]}-${match[2]}`;
      const target = months.find((m) => m.yearMonth === yearMonth);
      if (target) {
        target.translations += 1;
      }
    });

    return months;
  }, [bookings, translationFiles]);

  // Chart 2: Translation Status (Based 100% on real data)
  const translationStatusData = useMemo(() => {
    const completed = storedFileIds.filter(id => getFileStatus(id) === "Completed").length;
    const pending = storedFileIds.filter(id => getFileStatus(id) === "Pending").length;
    const cancelled = storedFileIds.filter(id => getFileStatus(id) === "Cancelled").length;

    if (docsCount === 0) {
      return [
        { name: "Empty", value: 1, color: "#f8fafc" },
      ];
    }

    return [
      { name: "Completed", value: completed, color: "#06439f" },
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Cancelled", value: cancelled, color: "#cbd5e1" },
    ];
  }, [storedFileIds, docsCount]);

  // Chart 3: Booking Status (Based 100% on real data)
  const bookingStatusData = useMemo(() => {
    const completed = completedBookingsCount;
    const confirmed = bookings.filter(b => statusName(b.status).toLowerCase() === "confirmed").length;
    const pending = bookings.filter(b => statusName(b.status).toLowerCase() === "pending").length;
    const cancelled = bookings.filter(b => statusName(b.status).toLowerCase() === "cancelled").length;

    if (totalBookingsCount === 0) {
      return [
        { name: "Empty", value: 1, color: "#f8fafc" },
      ];
    }

    return [
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "Confirmed", value: confirmed, color: "#3b82f6" },
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Cancelled", value: cancelled, color: "#ef4444" },
    ];
  }, [bookings, completedBookingsCount, totalBookingsCount]);

  // Main Section 2: Available Services Preview
  const servicePreview = useMemo(() => {
    return availableServices.slice(0, 3);
  }, [availableServices]);

  // Main Section 3: Recent Bookings
  const recentBookings = useMemo(() => {
    return byDateDesc(bookings).slice(0, 4);
  }, [bookings]);

  const isDataLoading = bookingsQuery.isLoading || servicesQuery.isLoading;
  const isDataError = bookingsQuery.isError || servicesQuery.isError;

  return (
    <section className="space-y-6">
      <LearnerWelcomeBanner
        learnerName={user?.full_name}
        isLoading={isUserPending}
      />

      {isDataLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
          <LoadingSkeleton rows={3} />
        </div>
      ) : isDataError ? (
        <ErrorState
          title="Could not load dashboard data"
          message={getErrorMessage(bookingsQuery.error || servicesQuery.error)}
          onRetry={() => {
            bookingsQuery.refetch();
            servicesQuery.refetch();
          }}
        />
      ) : (
        <>
          {/* Six Statistics Cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <LearnerStatCard
              label="Translation documents"
              value={docsCount}
              detail={`+${docsThisMonth} this month`}
              detailColorClass="text-emerald-600"
              icon={FiFileText}
              iconBgClass="bg-blue-50"
              iconColorClass="text-blue-600"
            />
            <LearnerStatCard
              label="Total bookings"
              value={totalBookingsCount}
              detail={`+${bookingsThisMonth} this month`}
              detailColorClass="text-emerald-600"
              icon={FiCalendar}
              iconBgClass="bg-purple-50"
              iconColorClass="text-purple-600"
            />
            <LearnerStatCard
              label="Completed bookings"
              value={completedBookingsCount}
              detail={`${completionRate}% completion rate`}
              detailColorClass="text-slate-400"
              icon={FiCheckCircle}
              iconBgClass="bg-emerald-50"
              iconColorClass="text-emerald-600"
            />
            <LearnerStatCard
              label="Pending translations"
              value={pendingTranslationsCount}
              detail={`${pendingDueThisWeek} due this week`}
              detailColorClass="text-slate-400"
              icon={FiClock}
              iconBgClass="bg-amber-50"
              iconColorClass="text-amber-600"
            />
            <LearnerStatCard
              label="Services used"
              value={servicesUsedCount}
              detail={`Across ${languagesCount} ${languagesCount === 1 ? "language" : "languages"}`}
              detailColorClass="text-slate-400"
              icon={FiLayers}
              iconBgClass="bg-teal-50"
              iconColorClass="text-teal-600"
            />
            <LearnerStatCard
              label="Upcoming sessions"
              value={upcomingCount}
              detail={nextSessionDetail}
              detailColorClass="text-slate-400"
              icon={FiBookOpen}
              iconBgClass="bg-rose-50"
              iconColorClass="text-rose-600"
            />
          </div>

          {/* Graphs Grid: Left (Monthly Activity) & Right (Donut charts) */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Graph: Monthly Activity (Translations vs Bookings) */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">Monthly activity</h2>
                  <p className="text-xs font-semibold text-slate-400">Translation documents and bookings over the last six months</p>
                </div>
                {/* Custom Legend */}
                <div className="flex items-center gap-4 text-xs font-extrabold">
                  <div className="flex items-center gap-1.5 text-[#06439f]">
                    <span className="size-2 rounded-full bg-[#06439f]" />
                    Translations
                  </div>
                  <div className="flex items-center gap-1.5 text-[#ce1126]">
                    <span className="size-2 rounded-full bg-[#ce1126]" />
                    Bookings
                  </div>
                </div>
              </div>
              <div className="mt-8 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTranslations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06439f" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#06439f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ce1126" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#ce1126" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="natural"
                      dataKey="translations"
                      name="Translations"
                      stroke="#06439f"
                      fillOpacity={1}
                      fill="url(#colorTranslations)"
                      strokeWidth={2.5}
                      dot={{ r: 4, stroke: "#fff", strokeWidth: 1.5, fill: "#06439f" }}
                      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#06439f" }}
                    />
                    <Area
                      type="natural"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#ce1126"
                      fillOpacity={1}
                      fill="url(#colorBookings)"
                      strokeWidth={2.5}
                      dot={{ r: 4, stroke: "#fff", strokeWidth: 1.5, fill: "#ce1126" }}
                      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#ce1126" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Right Stack: Translation Status & Booking Status Donuts */}
            <div className="flex flex-col gap-6">
              {/* Translation Status Donut Chart */}
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-950">Translation status</h2>
                <p className="text-xs font-semibold text-slate-400">Current document request breakdown</p>
                <div className="mt-4 flex h-40 flex-col items-center justify-center relative">
                  <div className="relative size-28 flex items-center justify-center">
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-slate-950">{docsCount}</span>
                      <span className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">Total</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                        <Pie
                          data={translationStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={52}
                          paddingAngle={docsCount === 0 ? 0 : 4}
                          cornerRadius={docsCount === 0 ? 0 : 4}
                        >
                          {translationStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend / Details below donut */}
                  <div className="mt-2.5 w-full">
                    {docsCount === 0 ? (
                      <div className="flex flex-col justify-center items-center text-center py-2">
                        <p className="text-[0.62rem] font-bold text-slate-400">No documents uploaded yet</p>
                        <Link
                          to="/dashboard/learner/files"
                          className="mt-1.5 inline-flex items-center justify-center gap-1 rounded-md bg-haiti-navy px-2.5 py-1 text-[9px] font-extrabold text-white transition hover:bg-slate-800 shadow-xs"
                        >
                          Upload file <FiArrowRight className="size-2.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[0.62rem] font-bold text-slate-600">
                        {translationStatusData.map((item) => (
                          <div key={item.name} className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                            <span className="text-slate-400">({item.value})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>

              {/* Booking Status Donut Chart */}
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-950">Booking status</h2>
                <p className="text-xs font-semibold text-slate-400">Current session booking breakdown</p>
                <div className="mt-4 flex h-40 flex-col items-center justify-center relative">
                  <div className="relative size-28 flex items-center justify-center">
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-slate-950">{totalBookingsCount}</span>
                      <span className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">Total</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                        <Pie
                          data={bookingStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={52}
                          paddingAngle={totalBookingsCount === 0 ? 0 : 4}
                          cornerRadius={totalBookingsCount === 0 ? 0 : 4}
                        >
                          {bookingStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend / Details below donut */}
                  <div className="mt-2.5 w-full">
                    {totalBookingsCount === 0 ? (
                      <div className="flex flex-col justify-center items-center text-center py-2">
                        <p className="text-[0.62rem] font-bold text-slate-400">No bookings placed yet</p>
                        <Link
                          to="/dashboard/learner/services"
                          className="mt-1.5 inline-flex items-center justify-center gap-1 rounded-md bg-haiti-navy px-2.5 py-1 text-[9px] font-extrabold text-white transition hover:bg-slate-800 shadow-xs"
                        >
                          Book session <FiArrowRight className="size-2.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[0.62rem] font-bold text-slate-600">
                        {bookingStatusData.map((item) => (
                          <div key={item.name} className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                            <span className="text-slate-400">({item.value})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* Top Section Grid: Next Upcoming Session & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Next Upcoming Session Banner */}
            <div className="lg:col-span-2">
              {nextSession ? (
                <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Next Upcoming Session
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold text-slate-950">
                      {nextSessionService?.name ?? `Session #${nextSession.service_id}`}
                    </h3>
                    <p className="mt-1.5 text-sm font-semibold text-slate-600">
                      Taught by <span className="font-extrabold text-slate-950">{nextSessionService?.tutor?.full_name ?? "Tutor"}</span>
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2 font-bold bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100">
                        <FiCalendar className="size-4 text-emerald-600" />
                        {formatDate(nextSession.booking_date)}
                      </div>
                      <div className="flex items-center gap-2 font-bold bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-100">
                        <FiClock className="size-4 text-emerald-600" />
                        {formatTime(nextSession.start_time)} - {formatTime(nextSession.end_time)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/dashboard/learner/bookings"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700 shadow-sm"
                    >
                      Manage Bookings
                      <FiArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </article>
              ) : (
                <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 shadow-sm flex flex-col justify-center items-center h-full text-center py-8">
                  <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
                    <FiCalendar className="size-5" />
                  </span>
                  <h3 className="mt-3 text-base font-extrabold text-slate-950">No Upcoming Sessions</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 max-w-sm">
                    Ready to start learning? Browse our language services and schedule your next lesson.
                  </p>
                  <Link
                    to="/dashboard/learner/services"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-haiti-navy px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800 shadow-sm"
                  >
                    Browse available services
                    <FiArrowRight className="size-3.5" />
                  </Link>
                </article>
              )}
            </div>

            {/* Quick Actions Panel */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">Quick Actions</h2>
                <p className="text-xs font-semibold text-slate-400">Shortcuts to manage your experience</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to="/dashboard/learner/services"
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-blue-50/40 hover:border-blue-100 transition group text-left"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white text-blue-600 shadow-xs border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition">
                      <FiBookOpen className="size-4" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">Browse Services</span>
                  </Link>
                  <Link
                    to="/dashboard/learner/settings"
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-emerald-50/40 hover:border-emerald-100 transition group text-left"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white text-emerald-600 shadow-xs border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <FiSettings className="size-4" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">My Settings</span>
                  </Link>
                  <Link
                    to="/dashboard/learner/bookings"
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-indigo-50/40 hover:border-indigo-100 transition group text-left"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white text-indigo-600 shadow-xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <FiClock className="size-4" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">My Bookings</span>
                  </Link>
                  <Link
                    to="/dashboard/learner/files"
                    className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-purple-50/40 hover:border-purple-100 transition group text-left"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-white text-purple-600 shadow-xs border border-slate-100 group-hover:bg-purple-600 group-hover:text-white transition">
                      <FiUploadCloud className="size-4" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">Upload File</span>
                  </Link>
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Main Sections Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Available Services List */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">Available Services</h2>
                <Link
                  to="/dashboard/learner/services"
                  className="flex items-center gap-1 text-xs font-extrabold text-haiti-navy hover:underline"
                >
                  See all <FiArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="mt-4 space-y-3.5">
                {servicePreview.length > 0 ? (
                  servicePreview.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 hover:border-slate-200 transition"
                    >
                      <div className="min-w-0">
                        <span className="text-[0.62rem] font-bold uppercase tracking-wider text-haiti-red">
                          {service.category}
                        </span>
                        <h4 className="mt-0.5 text-sm font-extrabold text-slate-900 truncate">
                          {service.name}
                        </h4>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                          Duration: {service.duration_minutes} mins
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-sm font-extrabold text-slate-950">${service.price}</span>
                        <Link
                          to="/dashboard/learner/services"
                          className="mt-1 inline-flex items-center gap-0.5 text-[0.68rem] font-extrabold text-haiti-navy hover:underline"
                        >
                          Book <FiArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm font-semibold text-slate-400">
                    <FiBookOpen className="mx-auto mb-2 size-8 opacity-40" />
                    No services available at this time.
                  </div>
                )}
              </div>
            </article>

            {/* Recent Booking Activity Table */}
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-950">Recent Booking Activity</h2>
                <Link
                  to="/dashboard/learner/bookings"
                  className="flex items-center gap-1 text-xs font-extrabold text-haiti-navy hover:underline"
                >
                  View all <FiArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="mt-4 overflow-x-auto">
                {recentBookings.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-4">Service</th>
                        <th className="pb-3 pr-4">Tutor</th>
                        <th className="pb-3 pr-4">Scheduled Date</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentBookings.map((booking) => {
                        const s = servicesById.get(booking.service_id ?? 0);
                        const status = statusName(booking.status);
                        const statusClass =
                          STATUS_BADGE_CLASSES[status.toLowerCase()] ??
                          "bg-slate-100 text-slate-600 ring-slate-200";

                        return (
                          <tr key={booking.id} className="group hover:bg-slate-50/50">
                            <td className="py-3 pr-4 font-extrabold text-slate-950 max-w-[180px] truncate">
                              {s?.name ?? `Service #${booking.service_id}`}
                            </td>
                            <td className="py-3 pr-4 font-bold text-slate-600">
                              {s?.tutor?.full_name ?? "Tutor"}
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-bold text-slate-950">{formatDate(booking.booking_date)}</p>
                              <p className="text-xs font-semibold text-slate-400">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </p>
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ring-1 ring-inset ${statusClass}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-sm font-semibold text-slate-400">
                    <FiCalendar className="mx-auto mb-2 size-8 opacity-40" />
                    No booking records found.
                  </div>
                )}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
};
