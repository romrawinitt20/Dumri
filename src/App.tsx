import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import DemoPage from "./pages/DemoPage";
import PayoutDemoPage from "./pages/PayoutDemoPage";

export default function App() {
  const { user, loading, configured } = useAuth();
  const emailVerified = Boolean(user?.email_confirmed_at);

  if (loading) return <main className="center-page"><p>กำลังเริ่มต้น Dumri…</p></main>;

  return (
    <Routes>
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/demo/payouts" element={<PayoutDemoPage />} />
      <Route path="/login" element={user ? <Navigate to={emailVerified ? "/dashboard" : "/verify-email"} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={emailVerified ? "/dashboard" : "/verify-email"} replace /> : <RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="/" element={<Navigate to={configured && user ? (emailVerified ? "/dashboard" : "/verify-email") : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
