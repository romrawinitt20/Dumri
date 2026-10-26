# Supabase RLS and Sensitive-Column Review — Read-only

Date: 2026-10-26
Project: `vdmqhgdcfsswinlilwyn`
Branch: `setup/supabase-auth-routes`

## Safety / scope

Read-only inspection of live table grants, RLS flags, and policy expressions. No schema, policy, grants, Storage, Auth settings, or data were changed. This report flags a high-priority exposure confirmed by effective-privilege checks; it does not claim that an attacker has actually extracted data.

## Confirmed high priority: public SELECT on `merchant_profiles` includes bank-account columns

Observed directly from live database:
- `merchant_profiles` has RLS enabled.
- Both `anon` and `authenticated` have table-level SELECT privilege.
- A read policy `ดูร้านที่อนุมัติแล้ว` allows rows when `is_verified = true`, or when the row belongs to the current app user, or when `fn_my_role() = 'admin'`.
- The table includes `bank_name`, `bank_account`, `approved_by`, and `approved_at`.
- Effective privilege check returned `true` for both roles on table SELECT, bank-name SELECT, bank-account SELECT, and shop-name SELECT.

Why this matters:
- RLS is row-level, not column-level. Table-level SELECT does not restrict which columns can be selected.
- The combination of public SELECT and a policy permitting verified shop rows means anonymous clients can potentially request bank account fields for verified merchants. This is a confirmed privilege configuration and a high-priority likely data exposure, though actual row-level data retrieval was not attempted.
- Treat this as a production-blocking issue until mitigated and tested.

## Mitigation prepared (not applied)

Draft rehearsal script:
[`docs/drafts/20261026_restrict_merchant_bank_column_access.sql`](https://github.com/romrawinitt20/Dumri/blob/setup/supabase-auth-routes/docs/drafts/20261026_restrict_merchant_bank_column_access.sql)

The script:
- Temporarily removes table-wide SELECT from `anon` and `authenticated`.
- Grants SELECT only on the explicitly listed customer-facing shop columns.
- Excludes `bank_name`, `bank_account`, `approved_by`, and `approved_at`.
- Runs effective-privilege checks and ends with an explicit `ROLLBACK`; it is a rehearsal only and cannot persist the proposed change.

This is not yet the production migration. Before preparing a committing migration, all deployed clients must be checked for `SELECT *` and reads of private fields. Any client that needs merchant payout details must use a narrowly authorized server-side RPC or private relation. Test browse, order placement, merchant self-service, and admin review flows in staging. Do not simply revoke access without confirming and replacing dependent query paths.

## Other inspected results

### `rider_profiles`
- RLS enabled; `anon` and `authenticated` have table-level SELECT.
- SELECT policy `rider_self_read` limits rows to `user_id = fn_uid()` or `fn_is_admin()`; it does not explicitly grant anonymous rows.
- Columns include `national_id`, `license_no`, `bank_name`, and `bank_account`.
- No anonymous row exposure was established from the inspected policy expression, but sensitive data remains in the profile table. Test with anonymous, unrelated authenticated users, rider, staff admin, and owner; consider separating/masking the sensitive fields.

### Finance / admin tables with RLS enabled but no table policies
The following inspected tables had RLS enabled and zero policies:
- `admin_access_audit`
- `admin_profiles`
- `app_settings`
- `audit_logs`
- `company_expenses`
- `merchant_invoice_orders`
- `platform_fee_rules`
- `platform_finance_setting_changes`
- `platform_finance_settings`
- `platform_financial_ledger`
- `platform_order_financials`
- `pricing_tiers`
- `refund_requests`
- `rider_bonus_orders`
- `rider_bonus_periods`
- `rider_wallet_accounts`
- `rider_wallet_transactions`

RLS enabled with no policies generally means direct access through the Data API is denied for roles subject to RLS, but it is not a complete security conclusion. These tables may intentionally be accessed only through checked RPCs. Verify grants, RPC checks, triggers, and call paths; do not add broad policies as a blanket fix.

### Other policy patterns needing test coverage
- `payments` has a table policy checking `fn_my_role() = 'admin'` for all operations. The table's authenticated SELECT grant exists. Verify staff admins do not gain broader access than their intended permission set.
- `users` read and write policies use a general admin-role check in addition to self checks. Verify the owner/staff distinction before enforcing MFA.
- `merchant_profiles` update policy constrains row ownership but does not itself restrict columns. Check grants/RPCs prevent merchant self-edit of `is_verified`, payout details, and other admin-controlled fields.
- `rider_profiles` self-update policy similarly uses row ownership; verify column privileges/RPC controls prevent self-editing verification status and other admin-controlled fields.

## Next safe sequence

1. Resolve the merchant bank-column exposure before production.
2. Map all deployed client reads of merchant/rider profiles, then prepare a migration that keeps public shop fields readable while denying public access to payout/identity fields.
3. Audit column privileges and direct UPDATE paths for merchant/rider verification fields.
4. Test RLS/RPC behavior with separate anonymous, customer, merchant, rider, staff-admin, and owner sessions.
5. Review and approve the production migration before applying it to the live database.

## Status

Read-only live inspection only. No live changes, no SQL migration, no PR merge.
