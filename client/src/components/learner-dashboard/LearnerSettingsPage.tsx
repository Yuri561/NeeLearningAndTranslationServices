import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiSliders,
} from "react-icons/fi";
import { useCurrentUser } from "../../features/auth/authQueries";
import { useMyLearnerProfile } from "../../features/learner/learnerQueries";
import { getErrorMessage } from "../ui/adminFormat";
import { PasswordSettingsPanel } from "./learner-settings/PasswordSettingsPanel";
import { ProfileSettingsPanel } from "./learner-settings/ProfileSettingsPanel";

type SettingsTab = "profile" | "security";

const tabs = [
  {
    id: "profile" as const,
    label: "Profile Settings",
    description: "Personal info, bio & learning goals",
    icon: FiUser,
  },
  {
    id: "security" as const,
    label: "Security & Login",
    description: "Password updates & account safety",
    icon: FiShield,
  },
];

export const LearnerSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const userQuery = useCurrentUser();
  const profileQuery = useMyLearnerProfile();
  const user = userQuery.data;
  const profile = profileQuery.data;

  const completion = useMemo(() => {
    const fields = [
      user?.full_name,
      user?.email,
      profile?.bio?.trim(),
      profile?.learning_goals?.trim(),
      profile?.preferred_language,
      profile?.profile_picture_url,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile, user]);

  const retry = () => {
    void userQuery.refetch();
    void profileQuery.refetch();
  };

  if (userQuery.isLoading || profileQuery.isLoading) {
    return (
      <section className="space-y-6" aria-label="Loading account settings">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-200/80" />
        <div className="h-[34rem] animate-pulse rounded-3xl bg-slate-100" />
      </section>
    );
  }

  if (userQuery.isError || profileQuery.isError || !user) {
    return (
      <section className="rounded-3xl border border-red-100 bg-white px-6 py-14 text-center shadow-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertCircle className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-950">
          We couldn’t load your settings
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          {getErrorMessage(userQuery.error ?? profileQuery.error)}
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
      {/* Hero Banner matching other Learner pages */}
      <div className="overflow-hidden rounded-3xl bg-linear-to-br from-haiti-navy via-[#083b8d] to-haiti-navy-dark px-5 py-7 text-white shadow-[0_18px_50px_rgba(6,67,159,.18)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              <FiSliders className="size-3.5" /> Learner Preferences
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Account & Profile Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Customize your profile details, learning objectives, language preferences, and manage your sign-in security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xl font-extrabold text-white">{completion}%</p>
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-blue-100">
                  Profile completed
                </p>
              </div>
              <div className="relative size-9">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-700"
                    strokeDasharray={`${completion}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur text-xs font-bold text-white">
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

      {/* Main Tabbed Settings Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,.055)]">
        {/* Navigation Tabs Bar */}
        <nav
          className="grid border-b border-slate-200/80 bg-slate-50/70 p-2 sm:grid-cols-2"
          aria-label="Settings sections"
        >
          {tabs.map(({ id, label, description, icon: Icon }) => {
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
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tab Panel */}
        <div role="tabpanel">
          {activeTab === "profile" ? (
            <ProfileSettingsPanel
              key={`${profile?.id ?? "new"}-${profile?.created_at ?? ""}`}
              user={user}
              profile={profile ?? null}
              completion={completion}
            />
          ) : (
            <PasswordSettingsPanel user={user} />
          )}
        </div>
      </div>
    </section>
  );
};
