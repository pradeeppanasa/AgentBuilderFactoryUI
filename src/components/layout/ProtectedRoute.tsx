import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { LoadingSpinner } from "@/components/common";

export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const { isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      return user;
    },
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!accessToken) {
    return (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Loading session…" />
      </div>
    );
  }

  if (isError) {
    return (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    );
  }

  return <Outlet />;
}
