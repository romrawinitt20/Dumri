import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { ensureUserProfile } from "../auth/ensureCustomerProfile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { configured } = useAuth();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase กรุณากำหนดค่าตามไฟล์ .env.example");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        navigate("/verify-email", { replace: true, state: { email: email.trim() } });
        return;
      }
      await ensureUserProfile(data.user);
      navigate(destination, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">แพลตฟอร์มส่งอาหารที่เป็นธรรม</p>
        <h1>ยินดีต้อนรับกลับ</h1>
        <p className="muted">เข้าสู่ระบบ Dumri เพื่อไปยังพื้นที่ของคุณ</p>
        {!configured && <p className="notice">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่าไฟล์ .env ก่อนทดสอบ</p>}
        <form onSubmit={submit} className="form-stack">
          <label>อีเมล<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>รหัสผ่าน<input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" /></label>
          {message && <p className="error-message" role="alert">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
        </form>
        <p className="form-footer">ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link></p>
      </section>
    </main>
  );
}
