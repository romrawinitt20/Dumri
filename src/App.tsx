import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const { user, loading, configured } = useAuth();

  if (loading) return <main className="center-page"><p>กำลังเริ่มต้น Dumri…</p></main>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="/" element={<Navigate to={configured && user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}