import { useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiSliders,
  FiUser,
  FiUserCheck,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import type { AuthUser } from "../../features/auth/authTypes";
import { PasswordSettingsPanel } from "../learner-dashboard/learner-settings/PasswordSettingsPanel";
import { initialsFrom } from "../learner-dashboard/learner-settings/settings.constants";
import { getErrorMessage } from "../ui/adminFormat";

type SettingsTab = "profile" | "security";

const tabs = [
  {
    id: "profile" as const,
    label: "Profile Settings",
    description: "Personal details & account role",
    icon: FiUser,
  },
  {
    id: "security" as const,
    label: "Security & Login",
    description: "Password updates & account safety",
    icon: FiShield,
  },
];

type AccountSettingsPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  roleBadgeLabel: string;
};

const RoleProfilePanel = ({
  user,
  roleBadgeLabel,
}: {
  user: AuthUser;
  roleBadgeLabel: string;
}) => {
  const [saveNotice, setSaveNotice] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    setSaveNotice("");
    window.setTimeout(() => {
      setIsPending(false);
      setSaveNotice("Profile information is managed via system account credentials.");
    }, 600);
  };

  return (
    <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
      {/* Sidebar Profile Card */}
      <aside className="bg-slate-50/50 p-6 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div className="relative size-28 shrink-0">
            <div className="grid size-full place-items-center rounded-2xl bg-linear-to-br from-haiti-navy to-[#083b8d] text-3xl font-extrabold text-white shadow-md">
              {initialsFrom(user.full_name)}
            </div>
          </div>

          <div className="mt-4 min-w-0 w-full">
            <h2 className="truncate text-base font-extrabold text-slate-950">
              {user.full_name}
            </h2>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {user.email}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-haiti-navy ring-1 ring-blue-200/60">
              <FiUserCheck className="size-3.5 text-blue-600" />
              {roleBadgeLabel}
            </div>
          </div>
        </div>

        {/* Account Info Box */}
        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
            <span>Account Type</span>
            <span className="capitalize text-haiti-navy font-bold">{user.role}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 border-t border-slate-100 pt-2.5">
            <span>Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <span className="size-2 rounded-full bg-emerald-500" /> Active
            </span>
          </div>
        </div>
      </aside>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="flex flex-col min-w-0">
        <div className="p-6 sm:p-7 lg:p-8 flex-1 space-y-7">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-haiti-navy">
              <FiShield className="size-4" /> Account Details
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              Personal Information
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Your account details and system credentials.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-2">
                  <FiUser className="text-slate-400 size-4" /> Full Name
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                  <FiLock className="size-3" /> System
                </span>
              </label>
              <input
                value={user.full_name}
                readOnly
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-500"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-2">
                  <FiMail className="text-slate-400 size-4" /> Email Address
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                  <FiLock className="size-3" /> System
                </span>
              </label>
              <input
                value={user.email}
                readOnly
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-500"
              />
            </div>

            {/* Role & Privileges Notice */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <FiUserCheck className="size-4 text-haiti-navy" /> Role & System Privileges
              </div>
              <p className="text-xs font-medium text-slate-600 leading-5">
                You are currently signed in with <strong className="text-slate-900">{roleBadgeLabel}</strong> permissions. All system administrative actions and log entries are attached to this account.
              </p>
            </div>
          </div>

          {saveNotice && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold text-haiti-navy">
              <FiAlertCircle className="size-5 shrink-0 text-blue-600" />
              <span>{saveNotice}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <FiCheck className="text-emerald-600 size-4" />
            Account credentials authenticated.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-haiti-navy px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-haiti-navy-dark disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export const AccountSettingsPage = ({
  eyebrow,
  title,
  description,
  roleBadgeLabel,
}: AccountSettingsPageProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  const retry = () => {
    void userQuery.refetch();
  };

  if (userQuery.isLoading) {
    return (
      <section className="space-y-6" aria-label="Loading settings">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-200/80" />
        <div className="h-[34rem] animate-pulse rounded-3xl bg-slate-100" />
      </section>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <section className="rounded-3xl border border-red-100 bg-white px-6 py-14 text-center shadow-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertCircle className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-950">
          We couldn’t load your settings
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          {getErrorMessage(userQuery.error)}
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-haiti-navy px-6 text-sm font-bold text-white transition hover:bg-haiti-navy-dark shadow-sm"
        >
          <FiRefreshCw className="size-4" />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Dark Hero Banner matching Learner pages */}
      <div className="overflow-hidden rounded-3xl bg-linear-to-br from-haiti-navy via-[#083b8d] to-haiti-navy-dark px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.18)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              <FiSliders className="size-3.5" /> {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-xs font-extrabold text-white">{roleBadgeLabel}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur text-xs font-bold text-white">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <FiCheckCircle className="size-4 text-emerald-300" />
              Account Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,.055)]">
        {/* Navigation Tabs Bar */}
        <nav
          className="grid border-b border-slate-200/80 bg-slate-50/70 p-2 sm:grid-cols-2"
          aria-label="Settings sections"
        >
          {tabs.map(({ id, label, description: tabDesc, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-selected={isActive}
                role="tab"
                className={`relative flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition duration-200 ${
                  isActive
                    ? "bg-white text-haiti-navy shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl transition ${
                    isActive
                      ? "bg-blue-50 text-haiti-navy ring-1 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-slate-900">{label}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-400 truncate">
                    {tabDesc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tab Panel */}
        <div role="tabpanel">
          {activeTab === "profile" ? (
            <RoleProfilePanel user={user} roleBadgeLabel={roleBadgeLabel} />
          ) : (
            <PasswordSettingsPanel user={user} />
          )}
        </div>
      </div>
    </section>
  );
};
