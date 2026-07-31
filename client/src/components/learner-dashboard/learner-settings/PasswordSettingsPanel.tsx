import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
  FiShield,
  FiX,
} from "react-icons/fi";
import { useChangePasswordMutation } from "../../../features/auth/authQueries";
import type { AuthUser } from "../../../features/auth/authTypes";
import { getErrorMessage } from "../../ui/adminFormat";
import { checkPasswordRequirements } from "./settings.constants";

type PasswordSettingsPanelProps = {
  user: AuthUser;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  visible: boolean;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

const PasswordField = ({
  id,
  label,
  value,
  error,
  visible,
  autoComplete,
  placeholder,
  onChange,
  onToggle,
}: PasswordFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-xs font-extrabold text-slate-700">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-xl border bg-white px-4 pr-11 text-sm font-semibold text-slate-800 shadow-xs transition placeholder:font-medium placeholder:text-slate-400 focus:outline-none ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 hover:border-slate-300 focus:border-haiti-navy focus:ring-4 focus:ring-blue-100/50"
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-slate-700"
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      >
        {visible ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
      </button>
    </div>
    {error && (
      <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
        <FiAlertCircle className="size-3.5 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export const PasswordSettingsPanel = ({ user }: PasswordSettingsPanelProps) => {
  const changePassword = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visibleField, setVisibleField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isGoogleAccount = user.auth_provider?.toLowerCase() === "google";

  const reqs = useMemo(() => checkPasswordRequirements(newPassword), [newPassword]);

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const clearForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVisibleField(null);
    setErrors({});
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!currentPassword) nextErrors.current = "Enter your current password.";
    if (!newPassword) {
      nextErrors.new = "Enter a new password.";
    } else {
      const unmet: string[] = [];
      if (!reqs.minLength) unmet.push("8 characters");
      if (!reqs.hasUppercase) unmet.push("an uppercase letter");
      if (!reqs.hasLowercase) unmet.push("a lowercase letter");
      if (!reqs.hasNumber) unmet.push("a number");
      if (!reqs.hasSpecial) unmet.push("a special character");
      if (unmet.length) nextErrors.new = `Password must include: ${unmet.join(", ")}.`;
    }

    if (currentPassword && currentPassword === newPassword) {
      nextErrors.new = "New password must be different from your current password.";
    }

    if (!confirmPassword) {
      nextErrors.confirm = "Confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirm = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: ({ message }) => {
          clearForm();
          toast.success(message || "Password updated successfully.");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  if (isGoogleAccount) {
    return (
      <div className="grid min-h-[26rem] place-items-center p-8 sm:p-12">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-blue-50 text-haiti-navy shadow-sm">
            <FiShield className="size-8 text-haiti-navy" />
          </span>
          <h2 className="mt-5 text-xl font-extrabold text-slate-950">
            Google Authentication Managed
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            You signed in using your Google Account ({user.email}). Password settings are securely managed by Google.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600">
            <FiLock className="size-3.5 text-slate-500" /> Third-party OAuth Active
          </div>
        </div>
      </div>
    );
  }

  const hasValues = Boolean(currentPassword || newPassword || confirmPassword);

  return (
    <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
      {/* Security Requirements Sidebar */}
      <aside className="bg-slate-50/50 p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FiShield className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-slate-950">Security Checklist</h2>
            <p className="text-[0.72rem] font-semibold text-slate-400">Password requirements</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          {[
            { label: "At least 8 characters", met: reqs.minLength },
            { label: "Uppercase & lowercase", met: reqs.hasUppercase && reqs.hasLowercase },
            { label: "Number & special character", met: reqs.hasNumber && reqs.hasSpecial },
          ].map((req, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs font-bold">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full transition ${
                  req.met
                    ? "bg-emerald-500 text-white"
                    : newPassword
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {req.met ? (
                  <FiCheck className="size-3" />
                ) : newPassword ? (
                  <FiX className="size-3" />
                ) : (
                  <span className="size-1.5 rounded-full bg-slate-400" />
                )}
              </span>
              <span className={req.met ? "text-slate-800" : "text-slate-500"}>
                {req.label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs font-medium leading-5 text-blue-900 flex gap-3">
          <FiLock className="size-4 shrink-0 text-haiti-navy mt-0.5" />
          <span>Keep your password unique to safeguard your learning progress and certificates.</span>
        </div>
      </aside>

      {/* Main Password Change Form */}
      <form onSubmit={handleSubmit} className="flex flex-col min-w-0">
        <div className="p-6 sm:p-7 lg:p-8 flex-1 space-y-7">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-haiti-navy">
              <FiKey className="size-4" /> Password Management
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              Change Account Password
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Enter your current password followed by your new password.
            </p>
          </div>

          <div className="max-w-xl space-y-6">
            <PasswordField
              id="current-password"
              label="Current Password"
              value={currentPassword}
              error={errors.current}
              visible={visibleField === "current"}
              autoComplete="current-password"
              placeholder="Enter current password"
              onChange={(value) => {
                setCurrentPassword(value);
                clearError("current");
              }}
              onToggle={() =>
                setVisibleField((current) => (current === "current" ? null : "current"))
              }
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <PasswordField
                id="new-password"
                label="New Password"
                value={newPassword}
                error={errors.new}
                visible={visibleField === "new"}
                autoComplete="new-password"
                placeholder="Create new password"
                onChange={(value) => {
                  setNewPassword(value);
                  clearError("new");
                }}
                onToggle={() =>
                  setVisibleField((current) => (current === "new" ? null : "new"))
                }
              />

              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                error={errors.confirm}
                visible={visibleField === "confirm"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                onChange={(value) => {
                  setConfirmPassword(value);
                  clearError("confirm");
                }}
                onToggle={() =>
                  setVisibleField((current) => (current === "confirm" ? null : "confirm"))
                }
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={clearForm}
            disabled={!hasValues || changePassword.isPending}
            className="min-h-11 rounded-xl px-5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-haiti-navy-dark disabled:cursor-wait disabled:opacity-50"
          >
            {changePassword.isPending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </footer>
      </form>
    </div>
  );
};
