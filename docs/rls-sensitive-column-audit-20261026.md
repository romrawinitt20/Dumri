# Supabase RLS and Sensitive-Column Review — Read-only

Date: 2026-10-26
Project: `vdmqhgdcfsswinlilwyn`
Branch: `setup/supabase-auth-routes`

## Safety / scope

Read-only inspection of live table grants, RLS flags, and policy expressions. No schema, policy, grants, Storage, Auth settings, or data were changed. This report flags a high-priority exposure pattern that needs controlled verification and a reviewed fix; it does not claim a successful external data extraction.

## High priority: public SELECT on `merchant_profiles` includes bank-account columns

Observed:
- `merchant_profiles` has RLS enabled.
- Both `anon` and `authenticated` have table-level SELECT privilege.
- Its read policy `ดูร้านที่อนุมัติแล้ว` allows a row when `is_verified = true`, or when it belongs to the current app user, or when `fn_my_role() = 'admin'`.
- The table contains business-facing columns and sensitive payout fields including `bank_name` and `bank_account`.

Why this matters:
- RLS is row-level, not column-level. The policy makes verified merchant rows readable, while table-level SELECT does not restrict which columns can be selected.
- Therefore, the current design appears to allow anonymous/public clients to request bank-account fields for verified merchant rows. This is a high-priority likely data exposure. It needs immediate attention before production, especially because bank proof and payout information are sensitive.

Recommended fix direction (not applied):
1. Separate public shop information from private merchant payout information. Preferred pattern: a public-safe view/table containing only fields intended for customers, with a separate private table for bank account and verification details.
2. If using a view, ensure it cannot bypass RLS unintentionally; on PostgreSQL 15+ consider `security_invoker = true` where appropriate, and explicitly test view privileges and underlying policies.
3. Remove broad public SELECT on the sensitive base table only after confirming the app's actual query paths and replacing them with a safe public interface. Do not simply revoke access without preparing the frontend/API replacement.
4. Add tests using both `anon` and `authenticated` roles to verify public shop details remain visible but `bank_name`, `bank_account`, and private verification fields are not retrievable.
5. Review whether payout fields should be moved to a private relation and whether bank-account values should be masked in admin UI where full values are unnecessary.

## Other inspected results

### `rider_profiles`
- RLS enabled; `anon` and `authenticated` have table-level SELECT.
- SELECT policy `rider_self_read` limits rows to `user_id = fn_uid()` or `fn_is_admin()`; it does not explicitly grant anonymous rows.
- Columns include `national_id`, `license_no`, `bank_name`, and `bank_account`.
- No public-row policy was observed in the inspected policy set, so no anonymous row exposure was established from these policies. Still, this sensitive data is stored in the profile table; review whether it should be separated/masked and test the policy using anon, unrelated authenticated users, the rider themself, staff admins, and owner.

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

RLS enabled with no policies generally means direct access through the Data API is denied for roles subject to RLS, but that is not a complete security conclusion. These tables may intentionally be accessed only through checked RPCs. Keep that model only if grants, RPC checks, triggers, and all call paths are verified; do not add broad policies as a blanket fix.

### Other observed policy patterns needing test coverage
- `payments` has a table policy checking `fn_my_role() = 'admin'` for all operations. The table's authenticated SELECT grant exists. Check that this does not give staff admins broader access than their intended permission set; ensure all actual payment review actions go through the intended RPCs.
- `users` read and write policies use a general admin-role check in addition to self checks. Verify the helper and the intended owner/staff distinction before enforcing MFA.
- `merchant_profiles` update policy constrains row ownership but does not by itself restrict which columns an owner can update. Confirm grants or RPC usage prevent a merchant from changing `is_verified`, bank details, or other admin-controlled fields directly.
- `rider_profiles` self-update policy similarly uses row ownership; verify column privileges or RPC controls prevent self-editing verification status and other admin-controlled fields.

## Next safe sequence

1. Treat the merchant bank-column exposure as the highest priority to resolve before production.
2. Map all frontend reads of `merchant_profiles` and `rider_profiles`, then prepare a migration plan for public-safe shop data vs private payout/identity data.
3. Audit column-level privileges and direct UPDATE pathways for merchant/rider verification fields.
4. Test RLS/RPC behavior with separate anonymous, customer, merchant, rider, staff-admin, and owner sessions.
5. Review and approve the proposed migration before applying anything to the live database.

## Status

Read-only inspection only. No live changes, no SQL migration, no PR merge.
