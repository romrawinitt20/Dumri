# Effective TRUNCATE Privilege Confirmation — 2026-10-26

A second read-only catalog query checked both the ACL entries and PostgreSQL's effective `has_table_privilege('anon', table, 'TRUNCATE')` result.

Result: effective TRUNCATE privilege is **true** for the `anon` role on all seven tables below:
- `public.addresses`
- `public.menu_items`
- `public.merchant_profiles`
- `public.option_groups`
- `public.options`
- `public.order_items`
- `public.rider_profiles`

The table ACL explicitly includes an `anon` entry with the TRUNCATE privilege flag. Effective TRUNCATE is also true for `authenticated` on those tables.

This confirms a serious privilege misconfiguration in the database catalog. It does not by itself prove a successful anonymous Data API exploit, because no destructive request was attempted and the current endpoint exposure path was not tested. PostgreSQL TRUNCATE bypasses RLS, so the grant must be treated as urgent.

## Action boundary
No change was made. Do not run a destructive test. Any privilege adjustment requires explicit approval because this Supabase project is shared with Midnight Meals. A minimal proposed mitigation is recorded in `docs/critical-shared-supabase-truncate-grant-review-20261026.md`; inspect all effective grants and cross-app impact before applying it.
