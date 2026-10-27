import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const [emailInput, setEmailInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { configured } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase กรุณากำหนดค่าตามไฟล์ .env.example");
      return;
    }
    const email = emailInput.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      navigate("/verify-email", { replace: true, state: { email, mode: "login" } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ส่งรหัส OTP ทางอีเมลไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">แพลตฟอร์มส่งอาหารที่เป็นธรรม</p>
        <h1>เข้าสู่ระบบด้วยอีเมล</h1>
        <p className="muted">กรอกอีเมล แล้วเราจะส่งรหัส OTP ไปให้ทางอีเมล</p>
        {!configured && <p className="notice">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่าไฟล์ .env ก่อนทดสอบ</p>}
        <form onSubmit={submit} className="form-stack">
          <label>อีเมล<input type="email" autoComplete="email" required maxLength={254} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="you@example.com" /></label>
          {message && <p className="error-message" role="alert">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังส่งรหัส OTP…" : "ส่งรหัส OTP ทางอีเมล"}</button>
        </form>
        <p className="form-footer">ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link></p>
      </section>
    </main>
  );
}
