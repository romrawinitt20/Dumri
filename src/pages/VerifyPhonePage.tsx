import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { ensureUserProfile } from "../auth/ensureCustomerProfile";

type SignupRole = "customer" | "merchant" | "rider";
type VerificationState = {
  phone?: string;
  fullName?: string;
  role?: SignupRole;
  mode?: "register" | "login";
};

export default function VerifyPhonePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as VerificationState | null) ?? {};
  const phone = state.phone ?? "";
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { configured } = useAuth();

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("ยังไม่ได้ตั้งค่า Supabase");
      return;
    }
    if (!state.mode || !state.phone) {
      setMessage("ข้อมูลการสมัครหรือเข้าสู่ระบบหมดอายุ กรุณากลับไปเริ่มใหม่");
      return;
    }
    if (!/^\d{6}$/.test(token.trim())) {
      setMessage("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: state.phone,
        token: token.trim(),
        type: "sms",
      });
      if (error) throw error;
      if (!data.user?.phone_confirmed_at) {
        throw new Error("ยังยืนยันเบอร์โทรศัพท์ไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
      if (state.mode === "register" && state.fullName && state.role) {
        await ensureUserProfile(data.user);
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ยืนยัน OTP ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setMessage("");
    if (!supabase || !state.phone) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: state.phone,
        options: {
          shouldCreateUser: state.mode === "register",
          ...(state.mode === "register" ? {
            data: {
              full_name: state.fullName ?? "",
              phone: state.phone,
              role: state.role ?? "customer",
            },
          } : {}),
        },
      });
      if (error) throw error;
      setMessage("ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบ SMS");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ส่งรหัส OTP ใหม่ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="brand-mark">D</div>
        <p className="eyebrow">ยืนยันเบอร์โทรศัพท์</p>
        <h1>กรอกรหัส OTP</h1>
        <p className="muted">กรอกรหัส 6 หลักที่ส่งทาง SMS ไปยังเบอร์โทรศัพท์ที่ใช้สมัครหรือเข้าสู่ระบบ</p>
        <form onSubmit={verify} className="form-stack">
          <label>เบอร์โทรศัพท์
            <input type="tel" value={phone} readOnly />
          </label>
          <label>รหัส OTP 6 หลัก
            <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
          </label>
          {message && <p className="notice" role="status">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังตรวจสอบ…" : "ยืนยันรหัส OTP"}</button>
        </form>
        <button type="button" className="secondary-button" onClick={resend} disabled={busy || !configured}>ส่งรหัส OTP อีกครั้ง</button>
        <p className="form-footer"><Link to={state.mode === "register" ? "/register" : "/login"}>กลับไปก่อนหน้า</Link></p>
      </section>
    </main>
  );
}
