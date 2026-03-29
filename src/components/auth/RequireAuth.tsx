import { Navigate } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}
