# Live Security Hardening — 2026-10-26

## Changes completed in shared Supabase project
Project: `vdmqhgdcfsswinlilwyn`

### 1. Removed client TRUNCATE privileges
Revoked `TRUNCATE` from `anon` and `authenticated` on 21 public tables. Verified using `has_table_privilege`: zero public base tables remain where either client role has effective TRUNCATE.

### 2. Removed anonymous direct writes
Revoked `INSERT`, `UPDATE`, `DELETE`, `REFERENCES`, and `TRIGGER` from `anon` on the same 21 public tables, retaining existing `SELECT` grants. Verified using `has_table_privilege`: zero public base tables remain where `anon` has effective INSERT, UPDATE, DELETE, or TRUNCATE.

No rows, tables, Auth users, Storage objects, or application deployments were deleted. No destructive test was performed.

### 3. Fixed mutable search_path on four functions
Replaced the following functions with fixed empty `search_path` settings and schema-qualified object references:
- `public.fn_gen_order_no()` — sequence explicitly qualified as `public.seq_order_no`
- `public.fn_log_status()` — history table explicitly qualified as `public.order_status_history`
- `public.fn_platform_fee(numeric)` — rules table explicitly qualified as `public.platform_fee_rules`
- `public.fn_delivery_fee(numeric, integer)` — pricing table/type explicitly qualified as `public.pricing_tiers`

Verification:
- Catalog check confirms all four have a function-level `search_path=""` setting.
- Catalog check found zero of these four still lacking a function configuration.
- Read-only smoke tests returned `fn_platform_fee(100) = 5` and `fn_delivery_fee(2, 1) = 25` under the current database data. These are smoke tests only, not a full pricing regression suite.
- Trigger functions were not tested by inserting or updating real order rows.

## Storage review
- The only Storage bucket returned by the catalog is `payment-slips`; it is private, has a 10 MiB limit, and allows JPEG, PNG, and PDF.
- The read policy restricts access to the owning customer path or an admin.
- The upload policy restricts the object path to the current user's ID and an order owned by that user, with an unpaid transfer/PromptPay order in eligible states.
- No bucket or policy for merchant/rider identity-document uploads was found. This suggests that verification-document storage is not yet configured in this project; do not upload identity documents until a private bucket and strict access policies are implemented.

## Remaining risks
- Security Advisor still needs a full post-change triage. Its 17 RLS-enabled/no-policy findings and 84 authenticated SECURITY DEFINER findings must be reviewed individually; do not blanket-revoke RPC execution.
- The shared project means these privilege changes also apply to any Midnight Meals use of the same tables. The changes do not remove Midnight Meals tables/data or disconnect its deployed frontend.
- Only the Dumri repository was visible in the linked GitHub repository listing; no Midnight Meals source repository or deployment settings were available, so its deployment has not been disconnected.
- Authenticated direct-write grants, sensitive bank/identity column access, RLS predicates, RPC authorization, and storage paths still require audit and regression tests.
- The existing database fee smoke test returned 5 for subtotal 100; do not interpret that as the intended Dumri 7% restaurant GP without reviewing how the current fee rules are used.

## No full release approval
These targeted changes reduce specific risks but do not establish that the application is production-ready.
