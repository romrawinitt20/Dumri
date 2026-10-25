import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

type AppRole = "customer" | "merchant" | "rider" | "admin";
type AccountStatus = "pending" | "active" | "suspended" | "banned";
type MyProfile = {
  id: number;
  full_name: string;
  role: AppRole;
  status: AccountStatus;
  auth_uid: string;
};

const roleLabels: Record<AppRole, string> = {
  customer: "ลูกค้า",
  merchant: "เจ้าของร้าน",
  rider: "ไรเดอร์",
  admin: "ผู้ดูแลระบบ",
};

const statusLabels: Record<AccountStatus, string> = {
  pending: "รอการตรวจสอบ/อนุมัติ",
  active: "ใช้งานได้",
  suspended: "ถูกระงับชั่วคราว",
  banned: "ถูกระงับถาวร",
};

function profileSummary(profile: MyProfile) {
  if (profile.status === "suspended" || profile.status === "banned") {
    return "บัญชีนี้ถูกจำกัดการใช้งาน หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ";
  }
  if (profile.role === "merchant" || profile.role === "rider") {
    if (profile.status === "pending") {
      return "บัญชียังรอการตรวจสอบและอนุมัติ จึงยังไม่ควรเปิดใช้ฟังก์ชันร้านค้าหรือรับงานส่งอาหาร";
    }
    return "สถานะบัญชีเปิดใช้งานแล้ว แต่สิทธิ์ร้านค้าหรือไรเดอร์ต้องตรวจสอบการอนุมัติจากระบบฝั่งเซิร์ฟเวอร์ทุกครั้ง";
  }
  if (profile.role === "admin") {
    return "บัญชีนี้มีบทบาทผู้ดูแลระบบ รายการที่ทำได้ต้องตรวจสอบสิทธิ์จากระบบฝั่งเซิร์ฟเวอร์ ไม่ใช้บทบาทบนหน้าเว็บเพียงอย่างเดียว";
  }
  return "เข้าสู่ระบบสำเร็จ บัญชีลูกค้าพร้อมสำหรับขั้นตอนพัฒนาฟังก์ชันสั่งอาหาร";
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!supabase) {
        if (alive) {
          setMessage("ยังไม่ได้ตั้งค่า Supabase");
          setProfileLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.rpc("fn_my_profile");
        if (error) throw error;
        const rows = data as MyProfile[] | null;
        if (!rows || rows.length === 0) {
          throw new Error("ไม่พบโปรไฟล์ Dumri ที่เชื่อมกับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ");
        }
        if (alive) setProfile(rows[0]);
      } catch (error) {
        if (alive) setMessage(error instanceof Error ? error.message : "โหลดข้อมูลบัญชีไม่สำเร็จ");
      } finally {
        if (alive) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      alive = false;
    };
  }, []);

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
        <p className="eyebrow">บัญชี Dumri</p>
        <h1>ยินดีต้อนรับสู่ Dumri</h1>
        <p className="muted">เบอร์โทรศัพท์ที่ยืนยันแล้ว: <strong>{user?.phone ?? "ไม่พบเบอร์โทรศัพท์"}</strong></p>
      </section>
      <section className="role-grid" aria-label="ข้อมูลบัญชี">
        <article className="role-card">
          <span className="role-icon">D</span>
          <h2>{profileLoading ? "กำลังโหลดข้อมูลบัญชี…" : profile ? roleLabels[profile.role] : "ยังไม่พบโปรไฟล์"}</h2>
          {profile && <p className="muted">{profile.full_name}</p>}
          {profile && <p className="muted">สถานะ: <strong>{statusLabels[profile.status]}</strong></p>}
          {profile && <p className="muted">{profileSummary(profile)}</p>}
          {!profileLoading && !profile && <p className="muted">ระบบยังไม่สามารถยืนยันโปรไฟล์ได้ จึงไม่ควรเปิดฟังก์ชันเฉพาะบทบาท</p>}
        </article>
      </section>
      <p className="notice">หน้านี้อ่านบทบาทและสถานะจาก RPC fn_my_profile ของ Supabase เพื่อแสดงข้อมูลเท่านั้น การอนุญาตให้ทำรายการจริงต้องตรวจสอบจากฐานข้อมูลและ RPC ฝั่งเซิร์ฟเวอร์ทุกครั้ง</p>
      {message && <p className="error-message" role="alert">{message}</p>}
    </main>
  );
}
