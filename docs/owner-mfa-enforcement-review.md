# Dumri owner MFA and authorization review

Date: 2026-10-26
Status: read-only review; no database or Auth settings changed.

## Decisions already confirmed
- Customer login remains phone + SMS OTP.
- Owner login is planned as email + password, then TOTP Authenticator MFA.
- Owner must enroll and successfully verify a primary TOTP factor and a backup factor/device before setup is considered complete.
- If all factors are lost, account recovery must be a separate strongly verified, audited process. Supabase Auth does not natively provide recovery codes.
- Do not merge PR #1 or apply database changes without explicit approval after review.

## Code findings
- `src/pages/LoginPage.tsx` currently uses phone SMS OTP for all roles; owner email/password sign-in is not implemented.
- `src/auth/AuthProvider.tsx` restores the session but does not evaluate MFA assurance level or factor enrollment.
- `src/components/ProtectedRoute.tsx` checks session and phone confirmation only; it is not an owner authorization boundary.
- `src/App.tsx` has no separate owner MFA setup/challenge routes.

## Database findings from read-only function inspection
- `fn_assert_owner()` requires an authenticated session, application user ID 1, role admin, active owner-level `admin_profiles`, active account status, and matching Auth UID. It does not check JWT assurance level.
- `fn_assert_admin()` checks for an active owner account with the `all` permission, but does not check JWT assurance level.
- `fn_assert_admin_permission(text)` checks active admin status and a permission key, but does not check JWT assurance level. It supports staff permissions and should not indiscriminately require AAL2 for all staff; owner-level handling must be explicit.
- `fn_is_admin()` checks owner status but does not check JWT assurance level. Any functions relying on this helper need to be included in the authorization audit.
- `fn_register_profile()` rejects role admin and requires `auth.uid()`, but its inspected definition does not visibly validate confirmed-phone status or that the submitted phone matches the Auth phone.
- The live owner ID-1 dependency must not be removed until a reviewed owner-bootstrap migration, backup/lockout recovery procedure, and tests are ready.

## Security Advisor snapshot (2026-10-26)
- 17 RLS-enabled public tables were reported with no policies. Some may be intentionally accessible only through tightly checked RPCs; inspect each table and its grants before deciding on policies.
- 84 SECURITY DEFINER functions were reported as executable by authenticated users. This is a broad advisory requiring per-function review; it does not by itself prove every function is exploitable. Confirm each function's guard and grants.
- Four functions were reported with mutable search paths: `fn_gen_order_no`, `fn_platform_fee`, `fn_delivery_fee`, and `fn_log_status`.
- Leaked-password protection is disabled in Supabase Auth settings.
- No blanket policy, function revoke, or Auth setting change was made.

## Required safe implementation sequence
1. Audit every owner-sensitive RPC, including direct checks and wrappers using `fn_assert_owner`, `fn_assert_admin`, `fn_is_admin`, and `fn_assert_admin_permission`.
2. Prepare a migration draft that requires `auth.jwt()->>'aal' = 'aal2'` for owner-only database operations while preserving least-privilege staff access. Do not apply until the function inventory and regression tests are complete.
3. Design a trusted owner bootstrap/recovery path to replace the fixed ID-1 dependency separately. Never trust a client-supplied user ID or editable Auth metadata.
4. Implement the separate owner email/password and TOTP UI; keep customer SMS OTP unchanged. Enroll and challenge both TOTP factors before marking setup complete.
5. Test: unauthenticated denied; customer denied; merchant/rider denied; staff can only perform granted permissions; owner at AAL1 denied for owner operations; owner at AAL2 allowed; backup factor works; revoked admin denied; recovery actions audited.
6. Separately fix and test profile registration phone confirmation/match validation.
7. Re-run Security Advisor and build/test checks after approved changes.

This document records findings and a plan only. No application code, database schema/functions, Auth configuration, Storage policy, permission, or deployment was changed as part of this review.


## Expanded guard inventory (2026-10-26)

A read-only scan of public SECURITY DEFINER function definitions found 95 functions in total, with:
- 7 calling `fn_assert_owner()`
- 9 calling `fn_assert_admin()` (including the helper itself)
- 16 calling `fn_assert_admin_permission()` (including that helper)
- 17 calling `fn_is_admin()` (including the helper itself)
- 18 additional functions with direct admin-related checks that need individual review
- 0 function definitions containing an explicit JWT AAL check

These categories can overlap and are not additive. The count does not prove every function is vulnerable; it shows that MFA enforcement cannot safely be added to only one frontend route or one helper without checking all authorization paths. Before preparing an executable migration, inspect direct checks and wrappers, determine which functions are owner-only versus staff-permission operations, and test each category.
