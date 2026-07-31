import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSliders,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { ApiError } from "../../lib/apiClient";
import {
  createTutorSchema,
  type CreateTutorFormValues,
} from "../../features/admin/tutorManagement.schema";
import {
  useRegisterTutor,
  useTutorsWithServices,
} from "../../features/admin/tutorManagement.queries";
import type {
  RegisteredTutor,
  TutorService,
  TutorWithServices,
} from "../../features/admin/tutorManagementTypes";
import {
  AdminSectionHeader,
  DataTable,
  DetailsDrawer,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  SearchInput,
  SelectFilter,
  StatCard,
  StatusBadge,
  type DataTableColumn,
} from "../../components/ui/adminUi";
import { formatValue, getErrorMessage } from "../../components/ui/adminFormat";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatRate = (value: number | null) =>
  typeof value === "number" ? `${money.format(value)}/hr` : "-";

const formatPrice = (value: number | null) =>
  typeof value === "number" ? money.format(value) : "-";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const uniqueOptions = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-xs font-bold text-red-600">{message}</p> : null;

const PillList = ({ items, empty = "-" }: { items: string[]; empty?: string }) => {
  if (!items.length) return <span className="text-slate-400">{empty}</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-blue-50 px-2 py-1 text-xs font-extrabold text-haiti-navy"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const VerificationBadge = ({ verified }: { verified: boolean }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${
      verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
    }`}
  >
    {verified ? "Verified" : "Unverified"}
  </span>
);

const SuccessToast = ({
  tutor,
  onClose,
}: {
  tutor: RegisteredTutor | null;
  onClose: () => void;
}) => (
  <div className="fixed right-4 top-4 z-[70] w-[calc(100%-2rem)] max-w-md rounded-lg border border-emerald-100 bg-white p-4 text-slate-900 shadow-2xl">
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
        <FiCheckCircle className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">Tutor account created successfully.</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          The tutor account was created successfully. The tutor may not appear in the
          list until they create their first service.
        </p>
        {tutor ? (
          <p className="mt-2 truncate text-xs font-bold text-slate-500">
            {tutor.full_name} - {tutor.email}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
      >
        <span className="sr-only">Close success notification</span>
        <FiX className="size-4" />
      </button>
    </div>
  </div>
);

const CreateTutorForm = ({
  onCreated,
}: {
  onCreated: (tutor: RegisteredTutor) => void;
}) => {
  const registerTutor = useRegisterTutor();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTutorFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: CreateTutorFormValues) => {
    const parsed = createTutorSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateTutorFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }

    registerTutor.mutate(
      {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      {
        onSuccess: (tutor) => {
          reset();
          onCreated(tutor);
        },
      }
    );
  };

  const mutationError = registerTutor.error;
  const errorTitle =
    mutationError instanceof ApiError && mutationError.status === 409
      ? "Email already exists"
      : mutationError instanceof ApiError && mutationError.status === 422
        ? "Invalid tutor details"
        : mutationError instanceof ApiError && mutationError.status === 401
          ? "Authentication required"
          : mutationError instanceof ApiError && mutationError.status === 403
            ? "Permission denied"
            : "Could not create tutor";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5"
      noValidate
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">Add Tutor</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Create a tutor login. The role is assigned automatically as tutor.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-extrabold text-haiti-navy">
          <FiShield className="size-4" />
          Role: Tutor
        </span>
      </div>

      {mutationError ? (
        <div className="mt-4">
          <ErrorState title={errorTitle} message={getErrorMessage(mutationError)} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Full name
          </span>
          <input
            {...register("fullName")}
            disabled={registerTutor.isPending}
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60"
            placeholder="Tutor Full Name"
          />
          <FieldError message={errors.fullName?.message} />
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Email
          </span>
          <input
            {...register("email")}
            disabled={registerTutor.isPending}
            type="email"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-haiti-navy focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60"
            placeholder="tutor@example.com"
          />
          <FieldError message={errors.email?.message} />
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Password
          </span>
          <span className="mt-2 flex h-11 rounded-lg border border-slate-200 bg-white focus-within:border-haiti-navy focus-within:ring-4 focus-within:ring-blue-100">
            <input
              {...register("password")}
              disabled={registerTutor.isPending}
              type={showPassword ? "text" : "password"}
              className="min-w-0 flex-1 rounded-lg px-3 text-sm font-semibold outline-none disabled:cursor-wait disabled:opacity-60"
              placeholder="StrongPassword123"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="grid size-11 place-items-center text-slate-500 hover:text-haiti-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
            </button>
          </span>
          <FieldError message={errors.password?.message} />
        </label>

        <label>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Confirm password
          </span>
          <span className="mt-2 flex h-11 rounded-lg border border-slate-200 bg-white focus-within:border-haiti-navy focus-within:ring-4 focus-within:ring-blue-100">
            <input
              {...register("confirmPassword")}
              disabled={registerTutor.isPending}
              type={showConfirmPassword ? "text" : "password"}
              className="min-w-0 flex-1 rounded-lg px-3 text-sm font-semibold outline-none disabled:cursor-wait disabled:opacity-60"
              placeholder="Repeat password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="grid size-11 place-items-center text-slate-500 hover:text-haiti-navy"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <FiEyeOff className="size-4" />
              ) : (
                <FiEye className="size-4" />
              )}
            </button>
          </span>
          <FieldError message={errors.confirmPassword?.message} />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={registerTutor.isPending}
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-lg bg-haiti-navy px-4 text-sm font-extrabold text-white transition hover:bg-haiti-navy-dark disabled:cursor-wait disabled:opacity-60"
        >
          {registerTutor.isPending ? (
            <>
              <FiRefreshCw className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FiUserPlus className="size-4" />
              Create Tutor
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const TutorCard = ({
  tutor,
  onDetails,
}: {
  tutor: TutorWithServices;
  onDetails: (tutor: TutorWithServices) => void;
}) => {
  const activeServices = tutor.services.filter((service) => service.isActive).length;
  const languages = uniqueOptions(tutor.services.map((service) => service.language));

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-haiti-navy text-sm font-extrabold text-white">
          {initials(tutor.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-950">{tutor.fullName}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{tutor.email || "-"}</p>
        </div>
        <VerificationBadge verified={tutor.isVerified} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
        {tutor.bio || "No biography available."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-400">
            Services
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            {tutor.services.length} total / {activeServices} active
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-400">
            Experience
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            {formatValue(tutor.yearsOfExperience)} years
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <PillList items={tutor.specialization} empty="No specializations" />
        <PillList items={languages} empty="No languages" />
      </div>
      <button
        type="button"
        onClick={() => onDetails(tutor)}
        className="mt-4 h-10 w-full rounded-lg bg-haiti-navy text-sm font-extrabold text-white"
      >
        View Details
      </button>
    </article>
  );
};

const TutorServicesList = ({ services }: { services: TutorService[] }) => (
  <div className="space-y-3">
    {services.map((service) => (
      <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-extrabold text-slate-950">{service.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{service.description || "-"}</p>
          </div>
          <StatusBadge status={service.isActive} />
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs font-bold text-slate-400">Category</dt>
            <dd className="font-semibold text-slate-800">{service.category || "-"}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs font-bold text-slate-400">Language</dt>
            <dd className="font-semibold text-slate-800">{service.language || "-"}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs font-bold text-slate-400">Duration</dt>
            <dd className="font-semibold text-slate-800">
              {service.durationMinutes ?? "-"} minutes
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs font-bold text-slate-400">Price</dt>
            <dd className="font-semibold text-slate-800">{formatPrice(service.price)}</dd>
          </div>
        </dl>
      </article>
    ))}
  </div>
);

const AddTutorModal = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (tutor: RegisteredTutor) => void;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-tutor-modal-title"
    >
      <button
        type="button"
        aria-label="Close add tutor form"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-haiti-red">
              Tutor management
            </p>
            <h2 id="add-tutor-modal-title" className="mt-1 text-lg font-extrabold text-slate-950">
              Add Tutor
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
          >
            <span className="sr-only">Close add tutor form</span>
            <FiX className="size-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4 sm:p-6">
          <CreateTutorForm onCreated={onCreated} />
        </div>
      </div>
    </div>
  );
};

export const AdminTutorManagement = () => {
  const tutorsQuery = useTutorsWithServices();
  const [selectedTutor, setSelectedTutor] = useState<TutorWithServices | null>(null);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [language, setLanguage] = useState("");
  const [verification, setVerification] = useState("");
  const [activeServices, setActiveServices] = useState("");
  const [createdTutor, setCreatedTutor] = useState<RegisteredTutor | null>(null);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);

  const tutors = useMemo(() => tutorsQuery.data ?? [], [tutorsQuery.data]);
  const allServices = tutors.flatMap((tutor) => tutor.services);
  const verifiedTutors = tutors.filter((tutor) => tutor.isVerified).length;
  const activeServiceCount = allServices.filter((service) => service.isActive).length;

  const specializationOptions = uniqueOptions(
    tutors.flatMap((tutor) => tutor.specialization)
  );
  const languageOptions = uniqueOptions(allServices.map((service) => service.language));

  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tutors.filter((tutor) => {
      const languages = tutor.services.map((service) => service.language);
      const hasActiveServices = tutor.services.some((service) => service.isActive);
      const matchesSearch =
        !term ||
        tutor.fullName.toLowerCase().includes(term) ||
        tutor.email.toLowerCase().includes(term);
      const matchesSpecialization =
        !specialization || tutor.specialization.includes(specialization);
      const matchesLanguage = !language || languages.includes(language);
      const matchesVerification =
        !verification ||
        (verification === "verified" && tutor.isVerified) ||
        (verification === "unverified" && !tutor.isVerified);
      const matchesActive =
        !activeServices ||
        (activeServices === "has-active" && hasActiveServices) ||
        (activeServices === "no-active" && !hasActiveServices);

      return (
        matchesSearch &&
        matchesSpecialization &&
        matchesLanguage &&
        matchesVerification &&
        matchesActive
      );
    });
  }, [activeServices, language, search, specialization, tutors, verification]);

  const clearFilters = () => {
    setSearch("");
    setSpecialization("");
    setLanguage("");
    setVerification("");
    setActiveServices("");
  };

  const columns: DataTableColumn<TutorWithServices>[] = [
    {
      key: "tutor",
      header: "Tutor",
      render: (tutor) => (
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-haiti-navy text-xs font-extrabold text-white">
            {initials(tutor.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-extrabold text-slate-950">{tutor.fullName}</p>
            <p className="truncate text-xs font-semibold text-slate-500">{tutor.email || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      render: (tutor) => <PillList items={tutor.specialization.slice(0, 2)} />,
    },
    {
      key: "experience",
      header: "Experience",
      render: (tutor) => `${formatValue(tutor.yearsOfExperience)} years`,
    },
    {
      key: "services",
      header: "Services",
      render: (tutor) => tutor.services.length,
    },
    {
      key: "active",
      header: "Active Services",
      render: (tutor) => tutor.services.filter((service) => service.isActive).length,
    },
    {
      key: "languages",
      header: "Languages",
      render: (tutor) => (
        <PillList items={uniqueOptions(tutor.services.map((service) => service.language))} />
      ),
    },
    {
      key: "platforms",
      header: "Meeting Platforms",
      render: (tutor) => <PillList items={tutor.meetingPlatforms.slice(0, 2)} />,
    },
    {
      key: "verification",
      header: "Verification",
      render: (tutor) => <VerificationBadge verified={tutor.isVerified} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (tutor) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedTutor(tutor);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-extrabold text-haiti-navy transition hover:bg-blue-50"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      {createdTutor ? (
        <SuccessToast tutor={createdTutor} onClose={() => setCreatedTutor(null)} />
      ) : null}
      <AddTutorModal
        open={isAddTutorOpen}
        onClose={() => setIsAddTutorOpen(false)}
        onCreated={(tutor) => {
          setCreatedTutor(tutor);
          setIsAddTutorOpen(false);
        }}
      />

      <AdminSectionHeader
        eyebrow="Administration"
        title="Tutor Management"
        description="Create tutor accounts and review tutors through the services they have published."
        actions={
          <button
            type="button"
            onClick={() => setIsAddTutorOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-extrabold text-haiti-navy shadow-sm transition hover:bg-blue-50"
          >
            <FiUserPlus className="size-4" />
            Add Tutor
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tutorsQuery.isLoading ? (
          <>
            <LoadingSkeleton rows={1} />
            <LoadingSkeleton rows={1} />
            <LoadingSkeleton rows={1} />
            <LoadingSkeleton rows={1} />
          </>
        ) : (
          <>
            <StatCard label="Total Tutors" value={tutors.length} icon={FiUsers} />
            <StatCard label="Verified Tutors" value={verifiedTutors} icon={FiUserCheck} />
            <StatCard label="Total Services" value={allServices.length} icon={FiSliders} />
            <StatCard label="Active Services" value={activeServiceCount} icon={FiCheckCircle} />
          </>
        )}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">Existing Tutors</h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {filteredTutors.length} of {tutors.length} tutors with services.
          </p>
        </div>

        <FilterBar>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FiSearch className="hidden size-4 shrink-0 text-slate-400 sm:block" />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email"
              label="Search tutors"
            />
          </div>
          <SelectFilter
            label="All specializations"
            value={specialization}
            onChange={setSpecialization}
            options={specializationOptions}
          />
          <SelectFilter
            label="All languages"
            value={language}
            onChange={setLanguage}
            options={languageOptions}
          />
          <SelectFilter
            label="All verification"
            value={verification}
            onChange={setVerification}
            options={["verified", "unverified"]}
          />
          <SelectFilter
            label="All services"
            value={activeServices}
            onChange={setActiveServices}
            options={["has-active", "no-active"]}
          />
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </FilterBar>

        {tutorsQuery.isLoading ? <LoadingSkeleton rows={6} /> : null}
        {tutorsQuery.isError ? (
          <ErrorState
            title="Could not load tutors"
            message={getErrorMessage(tutorsQuery.error)}
            onRetry={() => tutorsQuery.refetch()}
          />
        ) : null}
        {!tutorsQuery.isLoading && !tutorsQuery.isError && filteredTutors.length === 0 ? (
          <EmptyState
            title={
              tutors.length
                ? "No tutors match the current filters."
                : "No tutors with services were found."
            }
            description={
              tutors.length
                ? "Clear the filters or try a different search term."
                : "Tutors will appear here after creating at least one service."
            }
          />
        ) : null}
        {!tutorsQuery.isLoading && !tutorsQuery.isError && filteredTutors.length > 0 ? (
          <>
            <div className="hidden md:block">
              <DataTable
                items={filteredTutors}
                columns={columns}
                getKey={(tutor) => tutor.tutorId}
                onRowClick={setSelectedTutor}
                empty={null}
              />
            </div>
            <div className="grid gap-4 md:hidden">
              {filteredTutors.map((tutor) => (
                <TutorCard
                  key={tutor.tutorId}
                  tutor={tutor}
                  onDetails={setSelectedTutor}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <DetailsDrawer
        open={Boolean(selectedTutor)}
        title={selectedTutor?.fullName ?? "Tutor details"}
        description={selectedTutor?.email}
        onClose={() => setSelectedTutor(null)}
      >
        {selectedTutor ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-haiti-navy font-extrabold text-white">
                  {initials(selectedTutor.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-extrabold text-slate-950">
                      {selectedTutor.fullName}
                    </p>
                    <VerificationBadge verified={selectedTutor.isVerified} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {selectedTutor.email || "-"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {selectedTutor.bio || "No biography available."}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Experience
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {formatValue(selectedTutor.yearsOfExperience)} years
                  </dd>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Hourly rate
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {formatRate(selectedTutor.hourlyRate)}
                  </dd>
                </div>
                <div className="rounded-lg bg-white p-3 sm:col-span-2">
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Specializations
                  </dt>
                  <dd className="mt-2">
                    <PillList items={selectedTutor.specialization} empty="No specializations" />
                  </dd>
                </div>
                <div className="rounded-lg bg-white p-3 sm:col-span-2">
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Meeting platforms
                  </dt>
                  <dd className="mt-2">
                    <PillList items={selectedTutor.meetingPlatforms} empty="No platforms" />
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-950">Tutor services</h3>
              <div className="mt-3">
                <TutorServicesList services={selectedTutor.services} />
              </div>
            </section>
          </div>
        ) : null}
      </DetailsDrawer>
    </section>
  );
};
