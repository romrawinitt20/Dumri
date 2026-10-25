import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

function normalizeThaiPhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("0")) return "+66" + compact.slice(1);
  if (compact.startsWith("66")) return "+" + compact;
  return compact;
}

export default function LoginPage() {
  const [phoneInput, setPhoneInput] = useState("");
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
    const phone = normalizeThaiPhone(phoneInput);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setMessage("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 0812345678 หรือ +66812345678");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      navigate("/verify-phone", { replace: true, state: { phone, mode: "login" } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ส่งรหัส OTP ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">แพลตฟอร์มส่งอาหารที่เป็นธรรม</p>
        <h1>เข้าสู่ระบบด้วย OTP</h1>
        <p className="muted">กรอกเบอร์โทรศัพท์ แล้วเราจะส่งรหัสยืนยันทาง SMS</p>
        {!configured && <p className="notice">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่าไฟล์ .env ก่อนทดสอบ</p>}
        <form onSubmit={submit} className="form-stack">
          <label>เบอร์โทรศัพท์มือถือ<input type="tel" autoComplete="tel" inputMode="tel" required maxLength={20} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="0812345678" /></label>
          {message && <p className="error-message" role="alert">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังส่งรหัส OTP…" : "ส่งรหัส OTP ทาง SMS"}</button>
        </form>
        <p className="form-footer">ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link></p>
      </section>
    </main>
  );
}
