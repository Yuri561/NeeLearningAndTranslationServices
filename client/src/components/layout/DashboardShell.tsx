import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiArchive,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { useCurrentUser, useLogoutMutation } from "../../features/auth/authQueries";

type NavItem = {
  label: string;
  to: string;
  icon: IconType;
  end?: boolean;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [{ label: "Overview", to: "/dashboard/admin", icon: FiGrid, end: true }],
  },
  {
    label: "Platform Activity",
    items: [
      { label: "Tutor Management", to: "/dashboard/admin/tutors", icon: FiUsers },
      { label: "Services", to: "/dashboard/admin/services", icon: FiArchive },
      { label: "Availability", to: "/dashboard/admin/availability", icon: FiClock },
      { label: "Bookings", to: "/dashboard/admin/bookings", icon: FiCalendar },
      { label: "Uploaded Files", to: "/dashboard/admin/files", icon: FiArchive },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "My Account", to: "/dashboard/admin/settings", icon: FiSettings }],
  },
];

const linkClass = (isActive: boolean, collapsed: boolean) =>
  `group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-haiti-navy ${
    collapsed ? "justify-center" : ""
  } ${
    isActive
      ? "bg-haiti-navy text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-haiti-navy"
  }`;

export const DashboardSidebar = ({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) => {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close admin navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />
      <aside
        id="admin-navigation"
        aria-label="Admin dashboard navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white px-3 pb-4 pt-4 shadow-2xl transition-all duration-300 lg:translate-x-0 lg:shadow-none ${
          collapsed ? "lg:w-20" : "lg:w-72"
        } ${open ? "w-72 translate-x-0" : "w-72 -translate-x-full"}`}
      >
        <div className="flex min-h-12 items-center justify-between gap-2 px-1">
          <NavLink
            to="/dashboard/admin"
            onClick={onClose}
            className="inline-flex min-w-0 items-center gap-3"
            aria-label="Nee Learning admin overview"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50">
              <img
                src="/admin-related-pictures/personal-security.png"
                alt=""
                className="size-6 object-contain"
                aria-hidden="true"
              />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-slate-950">
                  Nee Admin
                </span>
                <span className="block truncate text-xs font-bold text-slate-400">
                  {user?.role ?? "admin"} access
                </span>
              </span>
            ) : null}
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <FiX className="size-5" />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <div className="mt-2 space-y-1">
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) => linkClass(isActive, collapsed)}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed ? <span className="truncate">{label}</span> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {!collapsed ? (
            <div className="mb-3 rounded-lg bg-slate-50 p-3">
              <p className="truncate text-sm font-extrabold text-slate-900">
                {user?.full_name ?? "Administrator"}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {user?.email ?? "Signed in"}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-haiti-navy">
                {user?.role ?? "admin"}
              </p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              title="Logout"
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-sm font-extrabold text-haiti-red transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
            >
              <FiLogOut className="size-4 shrink-0" />
              {!collapsed ? <span>Logout</span> : null}
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:grid"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <FiChevronRight className="size-4" />
              ) : (
                <FiChevronLeft className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const DashboardHeader = ({ onMenu }: { onMenu: () => void }) => {
  const { data: user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:hidden">
      <button
        type="button"
        aria-label="Open admin navigation"
        aria-controls="admin-navigation"
        onClick={onMenu}
        className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-haiti-navy shadow-sm"
      >
        <FiMenu className="size-5" />
      </button>
      <div className="flex min-w-0 items-center gap-2">
        <FiUser className="size-4 shrink-0 text-slate-400" />
        <span className="truncate text-sm font-extrabold text-slate-800">
          {user?.full_name ?? "Admin"}
        </span>
      </div>
    </header>
  );
};

export const DashboardShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />
      <div className={`min-h-screen transition-all ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <DashboardHeader onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[96rem] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
