import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../service/auth.service";

export default function ProtectedRoute({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { user, token, loading } = useAuth();

  // Saat auth sedang dipulihkan -> tampilkan skeleton
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-3" />
        <div className="animate-pulse h-4 w-64 bg-gray-200 rounded" />
      </div>
    );
  }

  // Jika user belum ada -> redirect login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Cek token (dan authService kalau ada)
  const isAuthed =
    !!token &&
    (typeof authService.isAuthenticated === "function"
      ? authService.isAuthenticated()
      : true);

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // Jika lolos semua -> render route
  return children ? <>{children}</> : <Outlet />;
}
