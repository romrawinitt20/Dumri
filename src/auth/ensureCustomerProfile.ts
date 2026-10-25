import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SignupRole = "customer" | "merchant" | "rider";

export async function ensureUserProfile(user: User) {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  if (!user.phone_confirmed_at) {
    throw new Error("กรุณายืนยันเบอร์โทรศัพท์ก่อนใช้งาน Dumri");
  }

  const { data: profiles, error: profileError } = await supabase.rpc("fn_my_profile");
  if (profileError) throw profileError;
  if (profiles && profiles.length > 0) return;

  const metadata = user.user_metadata ?? {};
  const role = metadata.role;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : user.phone ?? "";

  // Existing accounts without signup metadata are not modified automatically.
  if (role !== "customer" && role !== "merchant" && role !== "rider") {
    throw new Error("บัญชีนี้ยังไม่มีข้อมูลประเภทผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ");
  }
  if (!fullName || !phone) {
    throw new Error("บัญชีนี้ยังมีข้อมูลไม่ครบ กรุณาติดต่อผู้ดูแลระบบเพื่อช่วยตรวจสอบ");
  }

  const { error } = await supabase.rpc("fn_register_profile", {
    p_full_name: fullName,
    p_phone: phone,
    p_role: role as SignupRole,
    p_email: user.email ?? undefined,
  });
  if (error) throw error;
}
