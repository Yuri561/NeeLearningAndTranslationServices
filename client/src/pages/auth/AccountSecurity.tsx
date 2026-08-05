import { Link } from "react-router-dom";
import { FiArrowLeft, FiKey, FiShield } from "react-icons/fi";
import { PasswordSettingsPanel } from "../../components/learner-dashboard/learner-settings/PasswordSettingsPanel";
import { useCurrentUser } from "../../features/auth/authQueries";
import { dashboardPathByRole } from "../../features/auth/authRouting";

export const AccountSecurity = () => {
  const { data: user } = useCurrentUser();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-4 text-slate-900 sm:p-6 lg:p-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-linear-to-br from-haiti-navy via-[#083b8d] to-haiti-navy-dark px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
          <Link to={dashboardPathByRole[user.role]} className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-100 hover:text-white"><FiArrowLeft /> Back to dashboard</Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10"><FiShield className="size-6" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">Account security</p>
              <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Password Management</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Update the password for {user.email} using your current credentials.</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.055)]">
          <div className="border-b border-slate-100 px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-haiti-navy"><span className="inline-flex items-center gap-2"><FiKey /> Security &amp; login</span></div>
          <PasswordSettingsPanel user={user} />
        </div>
      </section>
    </main>
  );
};

export default AccountSecurity;

