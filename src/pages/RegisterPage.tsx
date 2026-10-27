import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type SignupRole = "customer" | "merchant" | "rider";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [role, setRole] = useState<SignupRole>("customer");
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
    const fullNameValue = fullName.trim();
    const phone = phoneInput.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    if (!fullNameValue || !phone) {
      setMessage("กรุณากรอกชื่อและเบอร์โทรศัพท์สำหรับติดต่อให้ครบถ้วน");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { full_name: fullNameValue, phone, role },
        },
      });
      if (error) throw error;
      navigate("/verify-email", {
        replace: true,
        state: { email, fullName: fullNameValue, phone, role, mode: "register" },
      });
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
        <p className="eyebrow">เริ่มต้นกับ Dumri</p>
        <h1>สร้างบัญชีใหม่</h1>
        <p className="muted">ยืนยันตัวตนด้วยรหัส OTP ที่ส่งไปยังอีเมลของคุณ</p>
        <form onSubmit={submit} className="form-stack">
          <label>สมัครเป็นใคร?
            <select value={role} onChange={(e) => setRole(e.target.value as SignupRole)} required>
              <option value="customer">ลูกค้า — สั่งอาหาร</option>
              <option value="merchant">เจ้าของร้าน — เปิดร้านและรับออร์เดอร์</option>
              <option value="rider">ไรเดอร์ — รับงานส่งอาหาร</option>
            </select>
          </label>
          <label>ชื่อ-นามสกุล<input type="text" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ชื่อที่ใช้ติดต่อ" /></label>
          <label>อีเมล<input type="email" autoComplete="email" required maxLength={254} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="you@example.com" /></label>
          <label>เบอร์โทรศัพท์สำหรับติดต่อ<input type="tel" autoComplete="tel" inputMode="tel" required maxLength={20} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="0812345678" /></label>
          {role !== "customer" && <p className="notice">บัญชี {role === "merchant" ? "ร้านค้า" : "ไรเดอร์"} จะต้องผ่านการตรวจสอบก่อนเริ่มใช้งานส่วนที่เกี่ยวข้อง</p>}
          {message && <p className="error-message" role="alert">{message}</p>}
          <button type="submit" disabled={busy || !configured}>{busy ? "กำลังส่งรหัส OTP…" : "ส่งรหัส OTP ทางอีเมล"}</button>
        </form>
        {!configured && <p className="notice">ยังไม่ได้เชื่อมต่อ Supabase — ตั้งค่าไฟล์ .env ก่อนทดสอบ</p>}
        <p className="form-footer">มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link></p>
      </section>
    </main>
  );
}
