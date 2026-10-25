import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const roles = [
  { title: "ลูกค้า", description: "ค้นหาร้านอาหารและสั่งอาหาร" },
  { title: "ร้านค้า", description: "จัดการร้าน เมนู และคำสั่งซื้อ" },
  { title: "ไรเดอร์", description: "รับงานส่งอาหารและดูรายได้" },
];

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    setMessage("");
    try {
      await signOut();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ออกจากระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="wordmark" href="/dashboard"><span className="brand-mark small">D</span> Dumri</a>
        <button className="button-secondary" onClick={logout} disabled={busy}>{busy ? "กำลังออก…" : "ออกจากระบบ"}</button>
      </header>
      <section className="welcome">
        <p className="eyebrow">พื้นที่ทดสอบระบบ</p>
        <h1>ยินดีต้อนรับสู่ Dumri</h1>
        <p className="muted">เข้าสู่ระบบสำเร็จแล้ว บัญชีที่ใช้ทดสอบ: <strong>{user?.email}</strong></p>
      </section>
      <section className="role-grid" aria-label="ประเภทผู้ใช้งาน">
        {roles.map((role) => (
          <article className="role-card" key={role.title}>
            <span className="role-icon">{role.title === "ลูกค้า" ? "⌂" : role.title === "ร้านค้า" ? "▦" : "↗"}</span>
            <h2>{role.title}</h2>
            <p className="muted">{role.description}</p>
            <span className="status-pill">เตรียมเชื่อมต่อ</span>
          </article>
        ))}
      </section>
      <p className="notice">หมายเหตุ: หน้านี้เป็นหน้าเริ่มต้นสำหรับทดสอบ Auth เท่านั้น การกำหนดสิทธิ์จริงของลูกค้า ร้านค้า ไรเดอร์ และแอดมิน ต้องตรวจสอบกับฐานข้อมูลและ RLS ฝั่ง Supabase ไม่ใช้ค่าจากหน้าเว็บเป็นหลักฐานสิทธิ์</p>
      {message && <p className="error-message" role="alert">{message}</p>}
    </main>
  );
}