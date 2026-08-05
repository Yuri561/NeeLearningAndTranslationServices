import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiLink } from "react-icons/fi";
import { PasswordInput } from "../../features/password-management/components/PasswordInput";
import { RecoveryLayout } from "../../features/password-management/components/RecoveryLayout";
import { getPasswordErrorMessage } from "../../features/password-management/password.errors";
import { useResetPasswordMutation } from "../../features/password-management/password.queries";
import { resetPasswordSchema } from "../../features/password-management/password.schemas";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const mutation = useResetPasswordMutation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || mutation.isPending) return;
    const parsed = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "form");
        nextErrors[field] ??= issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    mutation.mutate(
      { token, new_password: parsed.data.newPassword },
      {
        onSuccess: () => {
          setNewPassword("");
          setConfirmPassword("");
          setSuccess(true);
          navigate("/reset-password", { replace: true });
          window.setTimeout(() => navigate("/login", { replace: true }), 1800);
        },
        onError: (requestError) => setErrors({ form: getPasswordErrorMessage(requestError, "reset") }),
      }
    );
  };

  return (
    <RecoveryLayout>
      <div className="mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-haiti-red">Secure account recovery</p>
        <h1 className="mt-2 font-roxborough text-3xl font-bold tracking-tight text-haiti-navy sm:text-4xl">Create a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Choose a strong password you have not used for this account before.</p>
      </div>

      {success ? (
        <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-800">
          <FiCheckCircle className="size-7" />
          <p className="mt-3 text-sm font-bold leading-6">Your password has been reset successfully. You can now sign in with your new password.</p>
          <p className="mt-2 text-xs font-semibold">Redirecting to login…</p>
        </div>
      ) : !token ? (
        <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <FiLink className="size-6" />
          <p className="mt-3 text-sm font-extrabold">This password-reset link is invalid.</p>
          <Link to="/forgot-password" className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline">Request a new link <FiArrowRight /></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <PasswordInput id="reset-new-password" label="New password" value={newPassword} onChange={(value) => { setNewPassword(value); setErrors({}); }} error={errors.newPassword} autoComplete="new-password" placeholder="Enter a strong password" />
          <PasswordInput id="reset-confirm-password" label="Confirm new password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); setErrors({}); }} error={errors.confirmPassword} autoComplete="new-password" placeholder="Repeat your new password" />
          {errors.form ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.form}</p> : null}
          <button type="submit" disabled={mutation.isPending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-lg disabled:cursor-wait disabled:opacity-60">
            {mutation.isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Resetting password...</> : "Reset password"}
          </button>
          <Link to="/forgot-password" className="inline-flex text-sm font-bold text-haiti-navy hover:text-haiti-red">Request a different reset link</Link>
        </form>
      )}
    </RecoveryLayout>
  );
};

export default ResetPassword;

