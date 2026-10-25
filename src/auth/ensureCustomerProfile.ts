import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SignupRole = "customer" | "merchant" | "rider";

export async function ensureUserProfile(user: User) {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");

  const { data: profiles, error: profileError } = await supabase.rpc("fn_my_profile");
  if (profileError) throw profileError;
  if (profiles && profiles.length > 0) return;

  const metadata = user.user_metadata ?? {};
  const role = metadata.role;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : "";

  // Existing accounts created before profile integration are not modified automatically.
  if (role !== "customer" && role !== "merchant" && role !== "rider") return;
  if (!fullName || !phone) {
    throw new Error("บัญชีนี้ยังมีข้อมูลไม่ครบ กรุณาติดต่อผู้ดูแลระบบเพื่อช่วยตรวจสอบ");
  }

  const { error } = await supabase.rpc("fn_register_profile", {
    p_full_name: fullName,
    p_phone: phone,
    p_role: role,
    p_email: user.email ?? undefined,
  });
  if (error) throw error;
}
