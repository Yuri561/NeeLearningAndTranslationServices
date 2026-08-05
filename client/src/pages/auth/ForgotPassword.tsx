import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiMail, FiSend } from "react-icons/fi";
import { RecoveryLayout } from "../../features/password-management/components/RecoveryLayout";
import { useForgotPasswordMutation } from "../../features/password-management/password.queries";
import { emailSchema } from "../../features/password-management/password.schemas";
import { getPasswordErrorMessage } from "../../features/password-management/password.errors";

const SUCCESS_MESSAGE =
  "If an account exists for this email address, a password reset link has been sent.";

export const ForgotPassword = () => {
  const mutation = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setError("");
    mutation.mutate(
      { email: parsed.data },
      {
        onSuccess: () => {
          setEmail("");
          setSuccess(true);
        },
        onError: (requestError) => setError(getPasswordErrorMessage(requestError, "forgot")),
      }
    );
  };

  return (
    <RecoveryLayout>
      <div className="mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-haiti-red">Account recovery</p>
        <h1 className="mt-2 font-roxborough text-3xl font-bold tracking-tight text-haiti-navy sm:text-4xl">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Enter your email address and we’ll send password-reset instructions if an account is associated with it.</p>
      </div>

      {success ? (
        <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-800">
          <FiCheckCircle className="size-6" />
          <p className="mt-3 text-sm font-bold leading-6">{SUCCESS_MESSAGE}</p>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="recovery-email" className="block text-xs font-extrabold uppercase tracking-wide text-haiti-navy/70">Email address</label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setSuccess(false); }} aria-invalid={Boolean(error)} className={`h-12 w-full rounded-xl border bg-slate-50/40 pl-11 pr-4 text-sm font-semibold text-slate-800 ${error ? "border-red-300" : "border-blue-700/15"}`} placeholder="name@example.com" />
          </div>
          {error ? <p role="alert" className="text-xs font-bold text-red-600">{error}</p> : null}
        </div>
        <button type="submit" disabled={mutation.isPending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-br from-[#080c18] via-[#0d1f7a] to-[#00209F] px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-lg disabled:cursor-wait disabled:opacity-60">
          {mutation.isPending ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending...</> : <><FiSend /> Send reset link</>}
        </button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-haiti-navy hover:text-haiti-red"><FiArrowLeft /> Back to login</Link>
    </RecoveryLayout>
  );
};

export default ForgotPassword;

