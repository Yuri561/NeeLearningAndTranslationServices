import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSliders,
  FiUserPlus,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import { useCreateTutor, useTutorProfiles } from "../../features/admin/adminQueries";
import type { CreateTutorInput, TutorProfile } from "../../features/admin/adminTypes";

type TutorFormState = CreateTutorInput & {
  confirmPassword: string;
};

type TutorFormErrors = Partial<Record<keyof TutorFormState, string>>;

const initialForm: TutorFormState = {
  full_name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const EMPTY_TUTORS: TutorProfile[] = [];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (form: TutorFormState) => {
  const errors: TutorFormErrors = {};

  if (!form.full_name.trim()) errors.full_name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email address is required.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.password) errors.password = "Password is required.";
  if (!form.confirmPassword) errors.confirmPassword = "Confirm the tutor password.";
  else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatRate = (rate?: number | null) =>
  typeof rate === "number" && Number.isFinite(rate) ? `${money.format(rate)}/hr` : "Rate not set";

const formatDate = (date?: string | null) => {
  if (!date) return "Recently added";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Recently added";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-xs font-semibold text-haiti-red">{message}</p> : null;

const TutorSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
    <div className="animate-pulse">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="h-3 w-56 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 h-9 rounded-xl bg-slate-100" />
    </div>
  </div>
);

const Notification = ({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) => {
  const Icon = type === "success" ? FiCheckCircle : FiAlertCircle;
  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-haiti-red";

  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

const TutorCard = ({ tutor }: { tutor: TutorProfile }) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
    <div className="flex items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-haiti-navy text-sm font-extrabold text-white">
        {initials(tutor.full_name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-extrabold text-slate-900">{tutor.full_name}</h2>
          {tutor.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-emerald-700">
              <FiCheckCircle className="size-3" />
              Verified
            </span>
          )}
          {tutor.is_active === false && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">
              Inactive
            </span>
          )}
        </div>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
          <FiMail className="size-3.5 shrink-0 text-haiti-red" />
          <span className="truncate">{tutor.email ?? "Email not available"}</span>
        </p>
      </div>
    </div>

    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
      {tutor.bio || "This tutor profile is ready for teaching details, service assignments, and availability."}
    </p>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Experience</p>
        <p className="mt-1 text-sm font-extrabold text-slate-800">
          {tutor.years_of_experience ?? 0} years
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Rate</p>
        <p className="mt-1 text-sm font-extrabold text-slate-800">{formatRate(tutor.hourly_rate)}</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {tutor.specialization.length ? (
        tutor.specialization.slice(0, 3).map((item) => (
          <span key={item} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-haiti-navy">
            {item}
          </span>
        ))
      ) : (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500">
          No specializations yet
        </span>
      )}
    </div>

    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <FiVideo className="size-3.5 text-haiti-red" />
        {tutor.meeting_platform.length ? tutor.meeting_platform.join(", ") : "Meeting platform not set"}
      </span>
      <span className="text-xs font-bold text-slate-400">{formatDate(tutor.created_at)}</span>
    </div>
  </article>
);

export const AdminTutorsPage = () => {
  const tutorsQuery = useTutorProfiles();
  const createTutor = useCreateTutor();
  const [form, setForm] = useState<TutorFormState>(initialForm);
  const [errors, setErrors] = useState<TutorFormErrors>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "active">("all");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const tutors = tutorsQuery.data ?? EMPTY_TUTORS;
  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tutors.filter((tutor) => {
      const matchesSearch =
        !term ||
        tutor.full_name.toLowerCase().includes(term) ||
        (tutor.email ?? "").toLowerCase().includes(term) ||
        tutor.specialization.some((item) => item.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && tutor.is_verified) ||
        (statusFilter === "active" && tutor.is_active !== false);

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, tutors]);

  const updateField = (field: keyof TutorFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createTutor.isPending) return;

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length) return;

    createTutor.mutate(
      {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      },
      {
        onSuccess: () => {
          setForm(initialForm);
          setNotice({ type: "success", message: "Tutor account created successfully." });
        },
        onError: (error) => {
          setNotice({
            type: "error",
            message: error instanceof Error ? error.message : "Could not create tutor account.",
          });
        },
      }
    );
  };

  return (
    <section className="animate-fade-in">
      <div className="overflow-hidden rounded-3xl bg-haiti-navy px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.16)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-100">
              <FiShield className="size-4" />
              Tutor management
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              Manage tutor accounts
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
              Create tutor logins, review profile details, and keep the teaching roster organized.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-extrabold">{tutors.length}</p>
              <p className="text-xs font-semibold text-blue-100">total tutors</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-extrabold">
                {tutors.filter((tutor) => tutor.is_verified).length}
              </p>
              <p className="text-xs font-semibold text-blue-100">verified</p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 mx-2 -mt-2 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,.07)] sm:mx-5 sm:-mt-4 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Create tutor account</h2>
            <p className="mt-1 text-sm text-slate-500">
              The account role is assigned internally as tutor.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-haiti-navy">
            <FiUserPlus className="size-4" />
            Role: Tutor
          </span>
        </div>

        {notice && (
          <div className="mt-5">
            <Notification type={notice.type} message={notice.message} />
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Full name</span>
            <input
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              disabled={createTutor.isPending}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
              placeholder="John Doe"
            />
            <FieldError message={errors.full_name} />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Email address</span>
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              disabled={createTutor.isPending}
              type="email"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
              placeholder="tutor@example.com"
            />
            <FieldError message={errors.email} />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Password</span>
            <input
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              disabled={createTutor.isPending}
              type="password"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
              placeholder="StrongPassword123"
            />
            <FieldError message={errors.password} />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Confirm password</span>
            <input
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              disabled={createTutor.isPending}
              type="password"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
              placeholder="Repeat password"
            />
            <FieldError message={errors.confirmPassword} />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={createTutor.isPending}
            className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(6,67,159,.18)] transition hover:bg-haiti-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy disabled:cursor-wait disabled:opacity-70"
          >
            {createTutor.isPending ? (
              <>
                <FiRefreshCw className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FiUserPlus className="size-4" />
                Create tutor
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Existing tutors</h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredTutors.length} of {tutors.length} tutor profiles
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search tutors</span>
            <FiSearch className="absolute left-4 top-4 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search tutors..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter tutors</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 sm:w-40"
            >
              <option value="all">All tutors</option>
              <option value="verified">Verified</option>
              <option value="active">Active</option>
            </select>
            <FiSliders className="pointer-events-none absolute right-3.5 top-4 size-4 text-slate-400" />
          </label>
          <button
            type="button"
            onClick={() => tutorsQuery.refetch()}
            disabled={tutorsQuery.isFetching}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-haiti-navy disabled:cursor-wait disabled:opacity-70"
          >
            <FiRefreshCw className={`size-4 ${tutorsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {tutorsQuery.isLoading && (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <TutorSkeleton key={index} />
          ))}
        </div>
      )}

      {tutorsQuery.isError && (
        <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-red-100 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-haiti-red">
              <FiAlertCircle className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">We couldn&apos;t load tutors</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {tutorsQuery.error instanceof Error
                ? tutorsQuery.error.message
                : "Please check your connection and try again."}
            </p>
            <button
              type="button"
              onClick={() => tutorsQuery.refetch()}
              disabled={tutorsQuery.isFetching}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-bold text-white transition hover:bg-haiti-navy-dark disabled:opacity-60"
            >
              <FiRefreshCw className={tutorsQuery.isFetching ? "animate-spin" : ""} />
              Try again
            </button>
          </div>
        </div>
      )}

      {!tutorsQuery.isLoading && !tutorsQuery.isError && filteredTutors.length > 0 && (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredTutors.map((tutor) => (
            <TutorCard key={`${tutor.id}-${tutor.email ?? tutor.full_name}`} tutor={tutor} />
          ))}
        </div>
      )}

      {!tutorsQuery.isLoading && !tutorsQuery.isError && filteredTutors.length === 0 && (
        <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-haiti-navy">
              <FiUsers className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              {tutors.length ? "No matching tutors" : "No tutors yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {tutors.length
                ? "Try a different search or filter."
                : "Create the first tutor account using the form above."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
