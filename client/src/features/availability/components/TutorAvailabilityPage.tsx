import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit3,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { ApiError } from "../../../lib/apiClient";
import { AdminSectionHeader } from "../../../components/ui/adminUi";
import { useCurrentUser } from "../../auth/authQueries";
import {
  useCreateAvailability,
  useDeleteAvailability,
  useTutorAvailabilityView,
  useUpdateAvailability,
} from "../availability.queries";
import type { Availability, AvailabilityFormValue, WeekDay } from "../availability.types";
import { WEEK_DAYS } from "../availability.types";
import {
  formatLocalTime,
  sortAvailability,
  toLocalAvailability,
  toUtcRequest,
  validateAvailabilityRows,
} from "../availability.utils";

const emptyRow = (day: WeekDay = "Monday"): AvailabilityFormValue => ({
  day,
  start_time: "09:00",
  end_time: "10:00",
  is_active: true,
});

const friendlyError = (error: unknown, action = "update") => {
  if (!(error instanceof ApiError)) {
    return `We could not ${action} your availability. Please try again.`;
  }
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "You are not authorized to change this availability.";
  if (error.status === 404) return "This availability slot could not be found.";
  if (error.status === 422) {
    const message = error.message.replace(/^(\d+\.)?\w+(\.\w+)*:\s*/i, "").trim();
    return message || "Please check the availability details and try again.";
  }
  if (error.status >= 500) return "The server could not complete the request. Please try again.";
  return `We could not ${action} your availability. Please try again.`;
};

const Spinner = () => (
  <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const ScheduleSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading availability">
    {WEEK_DAYS.map((day) => (
      <div key={day} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-5 w-24 rounded bg-slate-100" />
        <div className="mt-5 h-20 rounded-xl bg-slate-100" />
        <div className="mt-4 h-10 rounded-xl bg-slate-100" />
      </div>
    ))}
  </div>
);

const DialogFrame = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} aria-label="Close dialog" />
      <article className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {children}
      </article>
    </div>
  );
};

const AvailabilityForm = ({
  existing,
  editing,
  initialDay,
  tutorId,
  onClose,
}: {
  existing: Availability[];
  editing?: Availability;
  initialDay?: WeekDay;
  tutorId: number;
  onClose: () => void;
}) => {
  const createMutation = useCreateAvailability(tutorId);
  const updateMutation = useUpdateAvailability(tutorId);
  const [rows, setRows] = useState<AvailabilityFormValue[]>([
    editing
      ? {
          day: editing.day,
          start_time: editing.start_time,
          end_time: editing.end_time,
          is_active: editing.is_active,
        }
      : emptyRow(initialDay),
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = editing ? updateMutation : createMutation;

  const updateRow = <K extends keyof AvailabilityFormValue>(
    index: number,
    field: K,
    value: AvailabilityFormValue[K]
  ) => {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
    setValidationError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const error = validateAvailabilityRows(rows, existing, editing?.id);
    if (error) {
      setValidationError(error);
      return;
    }
    const converted = rows.map(toUtcRequest);
    const conversionError = converted.find((item) => "error" in item);
    if (conversionError && "error" in conversionError) {
      setValidationError(conversionError.error);
      return;
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: converted[0] as Exclude<(typeof converted)[number], { error: string }> },
        {
          onSuccess: () => {
            toast.success("Availability updated successfully.");
            onClose();
          },
          onError: (requestError) => toast.error(friendlyError(requestError)),
        }
      );
    } else {
      createMutation.mutate(
        converted as Exclude<(typeof converted)[number], { error: string }>[],
        {
          onSuccess: () => {
            toast.success(rows.length === 1 ? "Availability added successfully." : "Availability slots added successfully.");
            onClose();
          },
          onError: (requestError) => toast.error(friendlyError(requestError, "add")),
        }
      );
    }
  };

  return (
    <DialogFrame title={editing ? "Edit availability" : "Add availability"} onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-haiti-red">Weekly schedule</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950">{editing ? "Edit time slot" : "Add time slots"}</h2>
          <p className="mt-1 text-sm text-slate-500">Times are shown in your local timezone.</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close">
          <FiX />
        </button>
      </div>

      <form onSubmit={submit} className="p-5 sm:p-7">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <fieldset key={index} className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <legend className="px-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Slot {index + 1}</legend>
              {!editing && rows.length > 1 ? (
                <button type="button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove slot ${index + 1}`}>
                  <FiX />
                </button>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Day</span>
                  <select required value={row.day} onChange={(event) => updateRow(index, "day", event.target.value as WeekDay)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800">
                    {WEEK_DAYS.map((day) => <option key={day}>{day}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Start time</span>
                  <input required type="time" value={row.start_time} onChange={(event) => updateRow(index, "start_time", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800" />
                </label>
                <label>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">End time</span>
                  <input required type="time" value={row.end_time} onChange={(event) => updateRow(index, "end_time", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800" />
                </label>
                <label className="flex items-center gap-3 sm:col-span-2">
                  <input type="checkbox" checked={row.is_active} onChange={(event) => updateRow(index, "is_active", event.target.checked)} className="size-5 rounded border-slate-300 accent-haiti-navy" />
                  <span className="text-sm font-bold text-slate-700">Active and visible to learners</span>
                </label>
              </div>
            </fieldset>
          ))}
        </div>

        {!editing ? (
          <button type="button" onClick={() => setRows((current) => [...current, emptyRow(current.at(-1)?.day)])} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 text-sm font-extrabold text-haiti-navy hover:bg-blue-50">
            <FiPlus /> Add another slot
          </button>
        ) : null}

        {validationError ? (
          <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" /> {validationError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-5 text-sm font-extrabold text-white hover:bg-haiti-navy-dark disabled:cursor-wait disabled:opacity-60">
            {mutation.isPending ? <><Spinner /> {editing ? "Updating..." : "Saving..."}</> : editing ? "Update slot" : `Save ${rows.length === 1 ? "slot" : `${rows.length} slots`}`}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
};

const DeleteDialog = ({ slot, tutorId, onClose }: { slot: Availability; tutorId: number; onClose: () => void }) => {
  const mutation = useDeleteAvailability(tutorId);
  const remove = () => {
    if (mutation.isPending) return;
    mutation.mutate(slot.id, {
      onSuccess: () => {
        toast.success("Availability deleted successfully.");
        onClose();
      },
      onError: (error) => toast.error(friendlyError(error, "delete")),
    });
  };
  return (
    <DialogFrame title="Delete availability" onClose={onClose}>
      <div className="p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600"><FiTrash2 /></span>
        <h2 className="mt-5 text-xl font-extrabold text-slate-950">Delete this time slot?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">This permanently removes {slot.day}, {formatLocalTime(slot.start_time)}–{formatLocalTime(slot.end_time)} from your schedule.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600">Cancel</button>
          <button type="button" onClick={remove} disabled={mutation.isPending} className="inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">
            {mutation.isPending ? <><Spinner /> Deleting...</> : "Delete slot"}
          </button>
        </div>
      </div>
    </DialogFrame>
  );
};

export const TutorAvailabilityPage = () => {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const tutorId = user?.role === "tutor" ? user.tutor_id ?? user.id : undefined;
  const query = useTutorAvailabilityView(tutorId);
  const updateMutation = useUpdateAvailability(tutorId);
  const [form, setForm] = useState<{ editing?: Availability; day?: WeekDay } | null>(null);
  const [deleting, setDeleting] = useState<Availability | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const localItems = useMemo(
    () => sortAvailability((query.data ?? []).map(toLocalAvailability)),
    [query.data]
  );

  const toggle = (slot: Availability) => {
    if (updateMutation.isPending) return;
    const payload = toUtcRequest({
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: !slot.is_active,
    });
    if ("error" in payload) {
      toast.error(payload.error);
      return;
    }
    setTogglingId(slot.id);
    updateMutation.mutate(
      { id: slot.id, data: payload },
      {
        onSuccess: () => toast.success(`Availability ${payload.is_active ? "activated" : "deactivated"} successfully.`),
        onError: (error) => toast.error(friendlyError(error)),
        onSettled: () => setTogglingId(null),
      }
    );
  };

  return (
    <section className="space-y-6">
      <AdminSectionHeader
        eyebrow="Tutor workspace"
        title="My Availability"
        description="Set the weekly hours when learners can book lessons. All times are shown in your local timezone."
        actions={
          <button
            type="button"
            onClick={() => setForm({})}
            disabled={!tutorId}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-haiti-navy shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <FiPlus /> Add time slot
          </button>
        }
      />

      {isUserLoading || query.isLoading ? <ScheduleSkeleton /> : null}
      {query.isError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-7 text-center">
          <FiAlertCircle className="mx-auto size-6 text-red-600" />
          <h2 className="mt-3 text-lg font-extrabold text-slate-950">We could not load your availability</h2>
          <p className="mt-2 text-sm text-slate-500">{friendlyError(query.error, "load")}</p>
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-haiti-navy px-4 text-sm font-extrabold text-white disabled:opacity-60"><FiRefreshCw className={query.isFetching ? "animate-spin" : ""} /> Try again</button>
        </div>
      ) : null}

      {!isUserLoading && !query.isLoading && !query.isError && tutorId ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEEK_DAYS.map((day) => {
            const slots = localItems.filter((slot) => slot.day === day);
            return (
              <article key={day} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-haiti-navy"><FiCalendar /></span>
                    <div><h2 className="text-base font-extrabold text-slate-950">{day}</h2><p className="text-xs font-semibold text-slate-400">{slots.length} {slots.length === 1 ? "slot" : "slots"}</p></div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className={`rounded-xl border p-3 ${slot.is_active ? "border-slate-200 bg-slate-50/70" : "border-slate-100 bg-slate-50/40 opacity-75"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><FiClock className="text-haiti-navy" /> {formatLocalTime(slot.start_time)}–{formatLocalTime(slot.end_time)}</p><span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-extrabold ${slot.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{slot.is_active ? <FiCheck /> : null}{slot.is_active ? "Active" : "Inactive"}</span></div>
                        <button type="button" role="switch" aria-checked={slot.is_active} aria-label={`${slot.is_active ? "Deactivate" : "Activate"} slot`} onClick={() => toggle(slot)} disabled={updateMutation.isPending} className={`relative h-6 w-11 shrink-0 rounded-full transition ${slot.is_active ? "bg-emerald-500" : "bg-slate-300"} disabled:opacity-50`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${slot.is_active ? "left-[1.375rem]" : "left-0.5"}`} />{togglingId === slot.id ? <span className="absolute inset-0 grid place-items-center text-white"><Spinner /></span> : null}</button>
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-slate-200/70 pt-3">
                        <button type="button" onClick={() => setForm({ editing: slot })} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-xs font-extrabold text-haiti-navy shadow-sm ring-1 ring-slate-200 hover:bg-blue-50"><FiEdit3 /> Edit</button>
                        <button type="button" onClick={() => setDeleting(slot)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-xs font-extrabold text-red-600 shadow-sm ring-1 ring-slate-200 hover:bg-red-50"><FiTrash2 /> Delete</button>
                      </div>
                    </div>
                  ))}
                  {slots.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-400">No hours configured</p> : null}
                </div>
                <button type="button" onClick={() => setForm({ day })} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 text-xs font-extrabold text-haiti-navy hover:bg-blue-50"><FiPlus /> Add time slot</button>
              </article>
            );
          })}
        </div>
      ) : null}

      {!isUserLoading && !query.isLoading && !query.isError && tutorId && localItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <FiClock className="mx-auto size-7 text-haiti-navy" />
          <h2 className="mt-3 text-lg font-extrabold text-slate-950">You have not configured your availability yet.</h2>
          <p className="mt-2 text-sm text-slate-500">Add your first time slot so learners can book lessons with you.</p>
        </div>
      ) : null}

      {form && tutorId ? <AvailabilityForm existing={localItems} editing={form.editing} initialDay={form.day} tutorId={tutorId} onClose={() => setForm(null)} /> : null}
      {deleting && tutorId ? <DeleteDialog slot={deleting} tutorId={tutorId} onClose={() => setDeleting(null)} /> : null}
    </section>
  );
};
