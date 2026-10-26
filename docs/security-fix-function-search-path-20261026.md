# Security Fix and Verification — Function Search Path — 2026-10-26

## Live change
Set a fixed function search path for these four functions in Supabase project `vdmqhgdcfsswinlilwyn`:

- `public.fn_gen_order_no()`
- `public.fn_platform_fee(numeric)`
- `public.fn_delivery_fee(numeric, integer)`
- `public.fn_log_status()`

Each now has `search_path=pg_catalog, public` in `pg_proc.proconfig`. This puts built-in PostgreSQL objects first and the application's public schema second, reducing risk from mutable search-path resolution.

## Verification
- A read-only query confirmed all four functions now have `search_path=pg_catalog, public`.
- A fresh Supabase Security Advisor result no longer reports the mutable-search-path finding for these functions. Remaining findings are 17 RLS-enabled tables without policies (checked separately for direct client grants), 84 authenticated-callable SECURITY DEFINER functions, and Auth leaked-password protection disabled.

## Authorization review progress
A metadata scan found that the selected high-impact functions delegate authorization to explicit guards:
- `fn_admin_cancel_order` and `fn_admin_resolve_refund` call `fn_assert_admin_permission`.
- `fn_admin_set_gp_exclusion` calls `fn_assert_admin`.
- `fn_owner_upsert_admin` and `fn_owner_revoke_admin` call `fn_assert_owner`.

The three guard functions reference `auth.uid()`, `admin_profiles`, permission checks, and exception handling. Anonymous execution is not granted; authenticated execution is granted as expected for guarded RPCs. This metadata check is not a substitute for full source review or adversarial authorization tests, so those remain on the test plan.

## Not changed
- No data rows, tables, Auth users, Storage objects, or app deployments were modified.
- Auth leaked-password protection remains disabled; it is a project Auth setting and must be enabled and verified through the supported Supabase Auth settings flow.
- The 84 SECURITY DEFINER advisor warnings have not been blanket-revoked because many are application RPCs; each must be reviewed for correct authorization and intended caller access.

## Next verification
Run non-destructive smoke tests for order number generation, fee calculations, and status logging; run manual Auth and order-flow regression tests; then continue the per-function permission review. No destructive test was run.
