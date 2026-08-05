import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "./authQueries";
import { dashboardPathByRole } from "./authRouting";
import { tokenStorage } from "./tokenStorage";
import type { UserRole } from "./authTypes";

type ProtectedRouteProps = {
  allowedRole: UserRole | UserRole[];
};

export const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = tokenStorage.get();
  const { data: user, isPending, isError } = useCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-haiti-navy/20 border-t-haiti-navy"
          aria-label="Loading account"
        />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPathByRole[user.role]} replace />;
  }

  return <Outlet />;
};
