import { useEffect, type ReactNode } from "react";
import { FiAlertCircle, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import type { IconType } from "react-icons";
import { formatNumber } from "./adminFormat";

export const PageHeader = ({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div className="min-w-0">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-haiti-red">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
    {actions ? <div className="shrink-0">{actions}</div> : null}
  </div>
);

export const AdminSectionHeader = ({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description: string;
  eyebrow: string;
  actions?: ReactNode;
}) => (
  <div className="overflow-hidden rounded-3xl bg-haiti-navy px-5 py-7 text-white shadow-sm sm:px-8 sm:py-9">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  </div>
);

export const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: IconType;
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      </div>
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-haiti-navy">
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </div>
    {detail ? <p className="mt-3 text-xs font-medium text-slate-400">{detail}</p> : null}
  </article>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) => (
  <label className="block min-w-0 flex-1">
    <span className="sr-only">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

export const FilterBar = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
    {children}
  </div>
);

export const SelectFilter = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) => (
  <label className="min-w-0 md:w-48">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-haiti-navy focus:ring-4 focus:ring-blue-100"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export const StatusBadge = ({ status }: { status?: string | boolean }) => {
  const label = typeof status === "boolean" ? (status ? "Active" : "Inactive") : status;
  const normalized = String(label ?? "Unknown").toLowerCase();
  const classes = normalized.includes("active") || normalized.includes("confirmed")
    ? "bg-emerald-50 text-emerald-700"
    : normalized.includes("pending")
      ? "bg-amber-50 text-amber-700"
      : normalized.includes("cancel") || normalized.includes("inactive")
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${classes}`}>
      {label ?? "Unknown"}
    </span>
  );
};

export const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="h-16 animate-pulse rounded-lg border border-slate-100 bg-slate-100"
      />
    ))}
  </div>
);

export const ErrorState = ({
  title = "Unable to load data",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-red-900">
    <div className="flex gap-3">
      <FiAlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-extrabold">{title}</p>
        {message ? <p className="mt-1 text-sm leading-6 text-red-700">{message}</p> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-extrabold text-red-700 shadow-sm transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <FiRefreshCw className="size-3.5" />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  </div>
);

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
    <div>
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  </div>
);

export const PermissionDenied = ({ message }: { message?: string }) => (
  <ErrorState
    title="Permission denied"
    message={
      message ??
      "The backend did not authorize this admin request. The dashboard is keeping the action read-only."
    }
  />
);

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
};

export const DataTable = <T,>({
  items,
  columns,
  getKey,
  onRowClick,
  empty,
}: {
  items: T[];
  columns: DataTableColumn<T>[];
  getKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  empty: ReactNode;
}) => {
  if (!items.length) return <>{empty}</>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left">
          <thead className="bg-haiti-navy text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-white">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-4 align-middle ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {items.map((item) => (
              <tr
                key={getKey(item)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onRowClick(item);
                  }
                }}
                className={`transition-colors hover:bg-blue-50/60 ${
                  onRowClick
                    ? "cursor-pointer focus-visible:bg-blue-50 focus-visible:outline-none"
                    : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 align-middle text-sm font-medium leading-6 ${column.className ?? ""}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Pagination = ({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) => {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiChevronLeft className="size-4" />
      </button>
      <span className="px-2 text-sm font-bold text-slate-500">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label="Next page"
        className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiChevronRight className="size-4" />
      </button>
    </div>
  );
};

export const DetailsDrawer = ({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Close details drawer"
        onClick={onClose}
        className={`fixed inset-x-0 top-0 z-40 h-[100dvh] bg-slate-950/30 transition-opacity ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />
      <aside
        aria-label={title}
        className={`fixed right-0 top-0 z-50 h-[100dvh] max-h-[100dvh] w-full max-w-xl overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl transition-transform duration-300 sm:p-6 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy"
          >
            <span className="sr-only">Close</span>
            x
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </aside>
    </>
  );
};
