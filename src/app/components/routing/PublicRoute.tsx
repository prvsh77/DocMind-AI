import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { PageSkeleton } from "../shared/LoadingSkeleton";

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <PageSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
