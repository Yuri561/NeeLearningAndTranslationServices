import { useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiRefreshCw } from "react-icons/fi";
import { useLearningServices } from "../../features/learner/learnerQueries";
import type { LearningServiceWithTutor } from "../../features/learner/learnerTypes";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  SearchInput,
} from "../ui/adminUi";
import { getErrorMessage } from "../ui/adminFormat";
import { LearnerBookingModal } from "./LearnerBookingModal";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const LearnerBookSessionPage = () => {
  const servicesQuery = useLearningServices();
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] =
    useState<LearningServiceWithTutor | null>(null);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services
      .filter((service) => service.is_active)
      .filter(
        (service) =>
          !term ||
          service.name.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.language.toLowerCase().includes(term)
      );
  }, [search, services]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Book a session"
        title="Choose a real service"
        description="Select a service from backend data, then choose an availability slot and submit your booking with Pending status."
      />

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search services by name, description, or language"
        />
      </div>

      {servicesQuery.isLoading ? <LoadingSkeleton rows={5} /> : null}
      {servicesQuery.isError ? (
        <ErrorState
          title="Could not load services"
          message={getErrorMessage(servicesQuery.error)}
          onRetry={() => servicesQuery.refetch()}
        />
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && filtered.length === 0 ? (
        <EmptyState
          title="No services available"
          description="No active services matched your search."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((service) => (
          <article
            key={service.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-haiti-red">
                  {service.category}
                </p>
                <h2 className="mt-2 text-lg font-extrabold text-slate-950">
                  {service.name}
                </h2>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-extrabold text-haiti-navy">
                {service.price === 0 ? "Free" : money.format(service.price)}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
              {service.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-lg bg-slate-50 px-2.5 py-2">
                {service.language}
              </span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-2">
                {service.duration_minutes} min
              </span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-2">
                Tutor #{service.tutor.id}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedService(service)}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-haiti-navy text-sm font-extrabold text-white"
            >
              <FiCalendar className="size-4" />
              Book now
            </button>
          </article>
        ))}
      </div>

      {!servicesQuery.isLoading && services.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
          <FiBookOpen className="mr-2 inline size-4" />
          Services will appear here when tutors publish them.
        </p>
      ) : null}

      {servicesQuery.isFetching && !servicesQuery.isLoading ? (
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <FiRefreshCw className="size-4 animate-spin" />
          Refreshing services
        </p>
      ) : null}

      {selectedService ? (
        <LearnerBookingModal
          service={selectedService}
          services={services}
          onClose={() => setSelectedService(null)}
        />
      ) : null}
    </section>
  );
};
