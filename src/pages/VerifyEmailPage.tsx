import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function VerifyEmailPage() {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const [email, setEmail] = useState(state?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const { configured } = useAuth();

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (!supabase) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("ส่งอีเมลยืนยันอีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์สแปม");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ส่งอีเมลยืนยันไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">ยืนยันอีเมล</p>
        <h1>ยืนยันอีเมลก่อนสั่งอาหาร</h1>
        <p className="muted">เปิดอีเมลจาก Dumri แล้วกดลิงก์ยืนยันก่อนเข้าสู่ระบบและใช้งานต่อ หากยังไม่ได้รับอีเมล สามารถขอส่งใหม่ได้ด้านล่าง</p>
        <form onSubmit={resend} className="form-stack">
          <label>อีเมลที่ใช้สมัคร
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          {message && <p className={success ? "notice" : "error-message"} role="status">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังส่ง…" : "ส่งอีเมลยืนยันอีกครั้ง"}</button>
        </form>
        <p className="form-footer"><Link to="/login">กลับไปเข้าสู่ระบบ</Link></p>
      </section>
    </main>
  );
}
