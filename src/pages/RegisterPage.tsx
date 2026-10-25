import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { ensureUserProfile } from "../auth/ensureCustomerProfile";

type SignupRole = "customer" | "merchant" | "rider";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<SignupRole>("customer");
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
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim(), role },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.session && data.user?.email_confirmed_at) {
        await ensureUserProfile(data.user);
        navigate("/dashboard", { replace: true });
      } else {
        if (data.session) await supabase.auth.signOut();
        navigate("/verify-email", { replace: true, state: { email: email.trim() } });
      }
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
        <p className="muted">เลือกประเภทบัญชีให้ตรงกับการใช้งาน</p>
        {success ? (
          <div className="notice" role="status">
            <strong>สมัครบัญชีเรียบร้อยแล้ว</strong>
            <p>กรุณายืนยันอีเมลก่อนเข้าสู่ระบบและสั่งอาหาร</p>
            {role !== "customer" && <p>บัญชีร้านค้าหรือไรเดอร์จะต้องรอการตรวจสอบก่อนเริ่มใช้งานส่วนที่เกี่ยวข้อง</p>}
            <Link to="/verify-email" state={{ email }}>ไปยืนยันอีเมล</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="form-stack">
            <label>สมัครเป็นใคร?
              <select value={role} onChange={(e) => setRole(e.target.value as SignupRole)} required>
                <option value="customer">ลูกค้า — สั่งอาหาร</option>
                <option value="merchant">เจ้าของร้าน — เปิดร้านและรับออร์เดอร์</option>
                <option value="rider">ไรเดอร์ — รับงานส่งอาหาร</option>
              </select>
            </label>
            <label>ชื่อ-นามสกุล<input type="text" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ชื่อที่ใช้ติดต่อ" /></label>
            <label>เบอร์โทรศัพท์<input type="tel" autoComplete="tel" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์ที่ติดต่อได้" /></label>
            <label>อีเมล<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <label>รหัสผ่าน<input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" /></label>
            {role !== "customer" && <p className="notice">หลังสมัครแล้ว บัญชี {role === "merchant" ? "ร้านค้า" : "ไรเดอร์"} จะรอการตรวจสอบก่อนใช้งานส่วนที่เกี่ยวข้อง</p>}
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
