import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { configured } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase กรุณากำหนดค่าตามไฟล์ .env.example");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.session) navigate("/dashboard", { replace: true });
      else setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">เริ่มต้นกับ Dumri</p>
        <h1>สร้างบัญชีใหม่</h1>
        <p className="muted">ขั้นตอนนี้สร้างบัญชีสำหรับทดสอบการยืนยันตัวตนก่อน</p>
        {success ? (
          <div className="notice" role="status">
            <strong>สมัครเรียบร้อยแล้ว</strong>
            <p>โปรดตรวจอีเมลเพื่อยืนยันบัญชี หากเปิดการยืนยันอีเมลไว้ใน Supabase จากนั้นกลับมาเข้าสู่ระบบ</p>
            <Link to="/login">ไปหน้าเข้าสู่ระบบ</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="form-stack">
            <label>อีเมล<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label>รหัสผ่าน<input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" /></label>
            {message && <p className="error-message" role="alert">{message}</p>}
            <button type="submit" disabled={busy || !configured}>{busy ? "กำลังสร้างบัญชี…" : "สมัครสมาชิก"}</button>
          </form>
        )}
        {!configured && <p className="notice">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่าไฟล์ .env ก่อนทดสอบ</p>}
        <p className="form-footer">มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link></p>
      </section>
    </main>
  );
}