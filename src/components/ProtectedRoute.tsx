import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading) return <main className="center-page"><p>กำลังตรวจสอบการเข้าสู่ระบบ…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;

  return <Outlet />;
}
