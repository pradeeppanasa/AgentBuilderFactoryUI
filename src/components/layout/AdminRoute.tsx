import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

// Reusable guard for admin-only pages (observability settings, and any
// future admin-only route) — redirects non-admins to /403 rather than
// silently rendering a page whose data they can't load anyway.
export function AdminRoute() {
  const role = useAuthStore((state) => state.currentUser?.role);
  if (role !== "admin") {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
