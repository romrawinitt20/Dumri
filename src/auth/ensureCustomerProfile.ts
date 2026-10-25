import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export async function ensureCustomerProfile(user: User) {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { data: profiles, error: profileError } = await supabase.rpc("fn_my_profile");
  if (profileError) throw profileError;
  if (profiles && profiles.length > 0) return;
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : "";
  if (!fullName || !phone) throw new Error("บัญชีนี้ยังไม่มีโปรไฟล์ Dumri กรุณาตรวจสอบข้อมูลสมัครสมาชิก");
  const { error } = await supabase.rpc("fn_register_profile", {
    p_full_name: fullName,
    p_phone: phone,
    p_role: "customer",
    p_email: user.email ?? undefined,
  });
  if (error) throw error;
}
