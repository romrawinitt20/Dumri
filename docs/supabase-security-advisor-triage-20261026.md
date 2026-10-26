# Supabase Security Advisor Snapshot — 2026-10-26

Project: `vdmqhgdcfsswinlilwyn` (shared by Dumri and Midnight Meals)

## Current advisor results (read-only)
The Supabase Security Advisor returned:
- 17 tables with RLS enabled but no policies.
- 4 functions flagged for mutable search_path: `fn_gen_order_no`, `fn_platform_fee`, `fn_delivery_fee`, `fn_log_status`.
- 84 SECURITY DEFINER functions callable by `authenticated`, including many admin/owner RPCs.
- Leaked-password protection disabled for Auth.

Advisor flags are triage signals, not proof that every flagged function is exploitable. Many authenticated SECURITY DEFINER RPCs are intentional public API endpoints when they enforce authorization internally. Do not blanket-revoke EXECUTE or add generic policies.

## Priority order
1. Investigate the anonymous TRUNCATE grants documented in `docs/critical-shared-supabase-truncate-grant-review-20261026.md`. No destructive test was attempted.
2. Audit sensitive column grants on `merchant_profiles` and `rider_profiles`, including bank and identity fields; verify the Data API and RLS effective behavior.
3. Review each SECURITY DEFINER function's internal identity/role/permission checks, prioritizing owner/admin finance, account administration, payout, refund, payment verification, and profile-registration functions.
4. Set fixed search_path for the four flagged functions after reviewing dependencies and using fully qualified object references.
5. Review whether enabling leaked-password protection affects the app's intended auth methods and existing users before changing Auth settings.
6. Inspect each no-policy table's grants and intended access model; a table with RLS and no policy can be intentionally inaccessible directly and used only through guarded functions.

## No changes made
This is a snapshot of the Security Advisor and a recommended review order. No database schema, privileges, policies, Auth settings, data, or Midnight Meals components were changed.
