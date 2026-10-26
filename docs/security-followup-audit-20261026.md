# Follow-up Security Audit — 2026-10-26

## Scope
Read-only checks after the live privilege fixes documented in:
- `live-privilege-fix-revoke-client-truncate-20261026.md`
- `live-privilege-fix-restrict-anon-writes-20261026.md`

No Midnight Meals code, tables, data, Auth users, Storage objects, or deployment settings were intentionally changed or deleted. Supabase remains a shared project, so database-role grants necessarily have project-wide impact.

## Confirmed after fixes
- Effective client `TRUNCATE` access: **0 public base tables** for `anon` or `authenticated`.
- Effective direct `anon` `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` access: **0 public base tables**.
- The 17 public tables flagged by Security Advisor as RLS-enabled with no policies have no direct `SELECT`, `INSERT`, `UPDATE`, or `DELETE` grants to `anon` or `authenticated` in the checked privilege state. Their direct table exposure is therefore blocked at the grants layer; no blanket policies were added.
- Storage currently has one bucket, `payment-slips`, marked private, with a 10 MiB limit and MIME allowlist of JPEG, PNG, and PDF. The inspected Storage object policies require an authenticated user and constrain payment-slip access/upload to a user's folder and eligible order state. This was a metadata/policy review only; no object was uploaded, downloaded, or changed.

## Remaining Security Advisor findings
A fresh Security Advisor query still reports:
- 17 tables with RLS enabled but no policies (direct client table grants were checked and are absent; keep these tables non-exposed unless a deliberate policy is designed).
- 84 `SECURITY DEFINER` functions callable by `authenticated`. This is a warning requiring per-function authorization review, not proof that all 84 are exploitable.
- 4 functions with mutable `search_path`: `fn_gen_order_no`, `fn_platform_fee`, `fn_delivery_fee`, and `fn_log_status`.
- Auth leaked-password protection disabled. This is an Auth project setting and was not changed through SQL.

## High-priority RPC review flags
A metadata-only scan of selected privileged functions found no obvious reference to `fn_is_admin`, `fn_my_role`, `admin_profiles`, or `auth.uid()` in these function bodies:
- `fn_admin_cancel_order(bigint, text)`
- `fn_admin_resolve_refund(bigint, boolean, text, text)`
- `fn_admin_set_gp_exclusion(bigint, boolean, text)`

This heuristic is **not a confirmed vulnerability**: authorization may be delegated to a helper or another check. However, because these functions can change order/refund/finance state, they should be reviewed from their full definitions and their authorization paths before launch. No attempt was made to invoke them with an unauthorized account.

The owner admin-management functions `fn_owner_upsert_admin` and `fn_owner_revoke_admin` reference `admin_profiles` and `admin_level`, but need full control-flow review to confirm they restrict calls to the platform owner and prevent self-escalation.

## Next actions
1. Review full source and authorization paths for the flagged admin/owner RPCs; do not blanket-revoke all 84 functions because legitimate customer, merchant, rider, and admin workflows use RPCs.
2. Audit `authenticated` direct table write grants and policy `USING` / `WITH CHECK` clauses.
3. Fix the four mutable `search_path` functions only after confirming dependencies and exact signatures; then re-run advisor checks.
4. Enable leaked-password protection in Supabase Auth settings after confirming the correct project-level setting and testing sign-in impact.
5. Run manual regression tests with existing test accounts; do not create/delete Auth users or alter business data as part of security testing.

## Safety note
No data was truncated or deleted. The only live changes so far were revoking unsafe client table privileges; this document records read-only follow-up findings.
