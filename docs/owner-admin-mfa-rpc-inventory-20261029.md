# Live Owner/Admin MFA and SECURITY DEFINER Inventory — 2026-10-29

Status: **Yellow — live catalog/grant inventory complete for SECURITY DEFINER functions; call-path and runtime validation remain incomplete**  
Project: `vdmqhgdcfsswinlilwyn` (Dumri, Seoul region; unchanged)  
Method: read-only SELECT queries against PostgreSQL catalog and `pg_get_functiondef`. No function was called to exercise behavior. No DDL/DML, Auth, Storage, grant, policy, account, or configuration change was made.

## Executive findings

- Catalog returned **95 SECURITY DEFINER functions in `public`**.
- All 95 have a function-level `search_path` setting. This is positive hardening, but does not by itself prove each function is safe.
- Explicit ACL summary: **84** include an `authenticated` EXECUTE grant, **0** include an explicit `anon` EXECUTE grant, and **95** include a `service_role` EXECUTE grant. This is a catalog snapshot; it is not a substitute for checking inherited/PUBLIC privileges, effective roles, triggers, and API exposure.
- The scan found **0/95** function bodies mentioning `aal2`, an `aal` check, or `auth.jwt()`. This is a string scan, not proof that all functions need AAL2: trigger/event-trigger functions are not user sessions. It does confirm that no inspected SECURITY DEFINER function body visibly implements the expected JWT AAL2 guard.
- Shared owner/admin helpers inspected previously (`fn_assert_owner()`, `fn_assert_admin()`, `fn_assert_admin_permission(text)`, `fn_is_admin()`) do not enforce AAL2. The current frontend uses phone/SMS OTP for all roles; owner email/password + TOTP enrollment/challenge is not implemented, and the route guard does not enforce session assurance.
- Do not interpret every `fn_admin_*` name as staff-level. `fn_assert_admin()` and `fn_is_admin()` currently check an active owner-level admin with `permissions.all=true`; functions calling them are owner-only in effect. Functions using `fn_assert_admin_permission(text)` are the permission-based staff boundary and must also be checked for finance and geographic/record scope.
- This inventory is complete for the catalog snapshot of SECURITY DEFINER functions, but **not yet a complete nested call graph**: PL/pgSQL body references, direct role checks, trigger paths, and frontend call sites still require individual tracing. No live runtime test was run.

## Current owner/admin boundary

| Guard | Observed live behavior | Current AAL2 | Design consequence |
|---|---|---|---|
| `fn_assert_owner()` | Requires authenticated UID; application user ID 1; admin role; active owner-level profile and active user; Auth UID match | Not present | Owner-only endpoints using it need server-side step-up enforcement before implementation |
| `fn_assert_admin()` | Requires authenticated UID and an active admin profile with owner level and `permissions.all=true`; does not itself require app user ID 1 | Not present | Despite its name, this is an owner-level guard, not a general staff-admin guard |
| `fn_is_admin()` | Boolean check for active owner-level admin with `permissions.all=true` | Not present | Direct checks using this helper are owner-only in current behavior |
| `fn_assert_admin_permission(text)` | Requires authenticated UID, active admin account/profile, and requested permission or `all=true` | Not present | Suitable permission boundary only when paired with ownership/geographic scope and separate sensitive-finance permission |
| Frontend `ProtectedRoute` / Auth provider | Existing review shows session/config/loading/phone-confirmation checks; no AAL check | Not present | UI-only protection is insufficient; direct RPC must enforce server-side policy |

**Owner bootstrap:** `fn_assert_owner()` depends on application user ID 1. Do not remove or reassign this invariant without a tested bootstrap, recovery, backup, and rollback plan.

## Owner-only and permission-guarded function groups

### Explicit owner guard (`fn_assert_owner()`)
- `fn_owner_admin_access_audit(p_limit integer)`
- `fn_owner_can_review_company_expenses()`
- `fn_owner_list_admins()`
- `fn_owner_review_company_expense(p_expense_id bigint, p_approve boolean, p_review_note text)`
- `fn_owner_revoke_admin(p_user_id bigint)`
- `fn_owner_upsert_admin(p_user_id bigint, p_permissions jsonb, p_admin_level text)`

### Owner-level guard via `fn_assert_admin()`
- `fn_admin_chart(p_days integer)`
- `fn_admin_financial_reconciliation()`
- `fn_admin_set_gp_exclusion(p_order_id bigint, p_excluded boolean, p_reason text)`
- `fn_admin_stats()`
- `fn_admin_tax_reserve_change_history(p_limit integer)`
- `fn_admin_set_user_status_raw(p_user_id bigint, p_status user_status)`
- `fn_admin_verify_user_raw(p_user_id bigint, p_approve boolean)`
- `fn_admin_assign_rider_raw(p_order_id bigint, p_rider_id bigint)` (no explicit authenticated EXECUTE grant in the catalog snapshot; service_role grant present)

### Owner-level guard via `fn_is_admin()`
- `fn_admin_adjust_rider_wallet(p_rider_id bigint, p_amount numeric, p_reason text)`
- `fn_admin_assign_rider(p_order_id bigint, p_rider_id bigint)`
- `fn_admin_complaint_stats()`
- `fn_admin_complaints(p_status complaint_status)`
- `fn_admin_generate_merchant_invoices(p_period_start date, p_period_end date)`
- `fn_admin_generate_rider_monthly_bonuses(p_period_start date, p_period_end date)`
- `fn_admin_mark_merchant_invoice_paid(p_invoice_id bigint, p_payout_reference text, p_note text)`
- `fn_admin_mark_rider_bonus_paid(p_period_id bigint, p_payout_reference text, p_note text)`
- `fn_admin_platform_finance_ledger(p_limit integer, p_account_code text)`
- `fn_admin_platform_finance_summary()`
- `fn_admin_record_rider_wallet_topup(p_rider_id bigint, p_amount numeric, p_reference text, p_note text)`
- `fn_admin_set_user_status(p_user_id bigint, p_status user_status)`
- `fn_complaint_assign(p_complaint_id bigint, p_priority smallint)`
- `fn_complaint_detail(p_complaint_id bigint)`
- `fn_complaint_reply(p_complaint_id bigint, p_message text, p_images text[], p_internal boolean)`
- `fn_complaint_resolve(p_complaint_id bigint, p_status complaint_status, p_resolution text, p_refund numeric)`

### Permission-guarded application functions (`fn_assert_admin_permission(text)`)
- `fn_admin_accounting_expense_category_summary(p_period_start date, p_period_end date)`
- `fn_admin_accounting_expenses(p_period_start date, p_period_end date, p_status text, p_limit integer)`
- `fn_admin_accounting_export_orders(p_period_start date, p_period_end date, p_limit integer)`
- `fn_admin_accounting_monthly_summary(p_year integer)`
- `fn_admin_accounting_report(p_period_start date, p_period_end date)`
- `fn_admin_accounting_yearly_summary(p_year integer)`
- `fn_admin_cancel_order(p_order_id bigint, p_reason text)`
- `fn_admin_list_refund_requests(p_status text, p_limit integer)`
- `fn_admin_orders(p_q text, p_status text)`
- `fn_admin_pending()`
- `fn_admin_pending_payments(p_limit integer)`
- `fn_admin_resolve_refund(p_refund_id bigint, p_refunded boolean, p_external_reference text, p_note text)`
- `fn_admin_submit_company_expense(p_expense_date date, p_category text, p_amount numeric, p_vendor text, p_reference_no text, p_note text)`
- `fn_admin_verify_payment(p_payment_id bigint, p_ok boolean)`
- `fn_admin_verify_user(p_user_id bigint, p_approve boolean)`

### Authenticated-user/role/ownership-oriented functions
The catalog scan found bodies referencing `auth.uid()`, `fn_uid()`, `fn_my_user_id()`, or related identity/role logic in the following functions. These are **not automatically safe**; each needs a per-function ownership/state transition check:
- `fn_create_merchant_profile`
- `fn_create_rider_profile`
- `fn_customer_payment_due`
- `fn_me`
- `fn_merchant_set_open`
- `fn_merchant_set_order_status`
- `fn_my_profile`
- `fn_my_role`
- `fn_my_user_id`
- `fn_place_order`
- `fn_place_order_with_plan`
- `fn_register_profile`
- `fn_rider_accept_job`
- `fn_rider_available_jobs`
- `fn_rider_set_online`
- `fn_rider_set_status`
- `fn_submit_payment`
- `fn_touch_login`
- `fn_uid`
- `fn_update_my_profile`
- `fn_cancel_order_by_customer`
- `fn_complaint_create`
- `fn_customer_refund_status`
- `fn_customer_request_refund`
- `fn_my_complaints`
- `fn_notify_list`
- `fn_notify_read`
- `fn_notify_unread`
- `fn_rider_wallet_history`
- `fn_rider_wallet_summary`
- `fn_submit_review`

### Bodies needing additional per-function review
A simple guard-name scan did not recognize a shared guard or a direct `auth.uid()` reference in these bodies. This is **a review queue, not a finding that they are exploitable**; a function can enforce identity through a nested helper or have a non-user trigger role:
- `fn_calc_subtotal(p_merchant_id bigint, p_items jsonb)`
- `fn_get_merchant_monthly_gp_rate(p_merchant_id bigint, p_check_time timestamp with time zone)`
- `fn_order_detail(p_order_id bigint)`
- `fn_quote_order(p_merchant_id bigint, p_address_id bigint, p_items jsonb)`
- `fn_phone_exists(p_phone character varying)`
- `fn_log(p_action text, p_type text, p_id bigint, p_detail text)` (no explicit authenticated/anon EXECUTE grant in the snapshot)
- `fn_notify(p_user_id bigint, p_type notif_type, p_title character varying, p_body text, p_data jsonb)` (no explicit authenticated/anon EXECUTE grant in the snapshot)
- `fn_link_auth_user()` (trigger function)
- `fn_resync_platform_finance_on_tax_change()` (trigger function)
- `fn_sync_platform_order_finance()` (trigger function)
- `rls_auto_enable()` (event-trigger function)
- `trg_guard_order_checkout()` (trigger function)
- `trg_guard_rider_delivery_transition()` (trigger function)
- `trg_set_order_gp()` (trigger function)

## Complete catalog snapshot — 95 SECURITY DEFINER functions

The following list is the exact name/signature snapshot. Guard labels are text-pattern classifications from the live definition; they are triage metadata, not a proof of complete authorization.

```text
fn_admin_accounting_expense_category_summary(p_period_start date, p_period_end date) | permission
fn_admin_accounting_expenses(p_period_start date, p_period_end date, p_status text, p_limit integer) | permission
fn_admin_accounting_export_orders(p_period_start date, p_period_end date, p_limit integer) | permission
fn_admin_accounting_monthly_summary(p_year integer) | permission
fn_admin_accounting_report(p_period_start date, p_period_end date) | permission
fn_admin_accounting_yearly_summary(p_year integer) | permission
fn_admin_adjust_rider_wallet(p_rider_id bigint, p_amount numeric, p_reason text) | is_admin
fn_admin_assign_rider(p_order_id bigint, p_rider_id bigint) | is_admin
fn_admin_assign_rider_raw(p_order_id bigint, p_rider_id bigint) | assert_admin
fn_admin_cancel_order(p_order_id bigint, p_reason text) | permission
fn_admin_chart(p_days integer) | assert_admin
fn_admin_complaint_stats() | is_admin
fn_admin_complaints(p_status complaint_status) | is_admin
fn_admin_financial_reconciliation() | assert_admin
fn_admin_generate_merchant_invoices(p_period_start date, p_period_end date) | is_admin
fn_admin_generate_rider_monthly_bonuses(p_period_start date, p_period_end date) | is_admin
fn_admin_list_refund_requests(p_status text, p_limit integer) | permission
fn_admin_mark_merchant_invoice_paid(p_invoice_id bigint, p_payout_reference text, p_note text) | is_admin
fn_admin_mark_rider_bonus_paid(p_period_id bigint, p_payout_reference text, p_note text) | is_admin
fn_admin_orders(p_q text, p_status text) | permission
fn_admin_pending() | permission
fn_admin_pending_payments(p_limit integer) | permission
fn_admin_platform_finance_ledger(p_limit integer, p_account_code text) | is_admin
fn_admin_platform_finance_summary() | is_admin
fn_admin_record_rider_wallet_topup(p_rider_id bigint, p_amount numeric, p_reference text, p_note text) | is_admin
fn_admin_resolve_refund(p_refund_id bigint, p_refunded boolean, p_external_reference text, p_note text) | permission
fn_admin_set_gp_exclusion(p_order_id bigint, p_excluded boolean, p_reason text) | assert_admin
fn_admin_set_user_status(p_user_id bigint, p_status user_status) | is_admin
fn_admin_set_user_status_raw(p_user_id bigint, p_status user_status) | assert_admin
fn_admin_stats() | assert_admin
fn_admin_submit_company_expense(p_expense_date date, p_category text, p_amount numeric, p_vendor text, p_reference_no text, p_note text) | permission
fn_admin_tax_reserve_change_history(p_limit integer) | assert_admin
fn_admin_verify_payment(p_payment_id bigint, p_ok boolean) | permission
fn_admin_verify_user(p_user_id bigint, p_approve boolean) | permission
fn_admin_verify_user_raw(p_user_id bigint, p_approve boolean) | assert_admin
fn_assert_admin() | helper
fn_assert_admin_permission(p_permission text) | helper
fn_assert_owner() | helper
fn_calc_subtotal(p_merchant_id bigint, p_items jsonb) | review-body
fn_cancel_order_by_customer(p_order_id bigint, p_reason text) | review-body
fn_complaint_assign(p_complaint_id bigint, p_priority smallint) | is_admin
fn_complaint_create(p_subject character varying, p_detail text, p_category complaint_category, p_order_id bigint, p_against_id bigint, p_images text[]) | review-body
fn_complaint_detail(p_complaint_id bigint) | is_admin
fn_complaint_reply(p_complaint_id bigint, p_message text, p_images text[], p_internal boolean) | is_admin
fn_complaint_resolve(p_complaint_id bigint, p_status complaint_status, p_resolution text, p_refund numeric) | is_admin
fn_create_merchant_profile(p_shop_name text, p_shop_slug text, p_phone text, p_address_text text, p_lat numeric, p_lng numeric, p_category text, p_description text, p_zone_id bigint) | uid/helper
fn_create_rider_profile(p_national_id text, p_license_no text, p_vehicle_type text, p_vehicle_plate text, p_bank_name text, p_bank_account text, p_zone text) | uid/helper
fn_customer_payment_due(p_order_id bigint) | uid/helper
fn_customer_refund_status(p_order_id bigint) | review-body
fn_customer_request_refund(p_order_id bigint, p_reason text) | review-body
fn_get_merchant_monthly_gp_rate(p_merchant_id bigint, p_check_time timestamp with time zone) | review-body
fn_is_admin() | helper
fn_link_auth_user() | trigger
fn_log(p_action text, p_type text, p_id bigint, p_detail text) | internal/review
fn_me() | uid/helper
fn_merchant_set_open(p_is_open boolean) | uid/helper
fn_merchant_set_order_status(p_order_id bigint, p_new order_status, p_reason text) | uid/helper
fn_my_complaints(p_limit integer) | review-body
fn_my_profile() | uid/helper
fn_my_role() | uid/helper
fn_my_user_id() | uid/helper
fn_notify(p_user_id bigint, p_type notif_type, p_title character varying, p_body text, p_data jsonb) | internal/review
fn_notify_list(p_limit integer) | review-body
fn_notify_read(p_id bigint) | review-body
fn_notify_unread() | review-body
fn_order_detail(p_order_id bigint) | review-body
fn_owner_admin_access_audit(p_limit integer) | owner
fn_owner_can_review_company_expenses() | owner
fn_owner_list_admins() | owner
fn_owner_review_company_expense(p_expense_id bigint, p_approve boolean, p_review_note text) | owner
fn_owner_revoke_admin(p_user_id bigint) | owner
fn_owner_upsert_admin(p_user_id bigint, p_permissions jsonb, p_admin_level text) | owner
fn_phone_exists(p_phone character varying) | review-body
fn_place_order(p_merchant_id bigint, p_address_id bigint, p_items jsonb, p_payment_method payment_method, p_note text) | uid/helper
fn_place_order_with_plan(p_merchant_id bigint, p_address_id bigint, p_items jsonb, p_payment_method payment_method, p_note text, p_payment_plan text) | uid/helper
fn_quote_order(p_merchant_id bigint, p_address_id bigint, p_items jsonb) | review-body
fn_register_profile(p_phone character varying, p_full_name character varying, p_role user_role, p_email character varying) | uid/helper
fn_resync_platform_finance_on_tax_change() | trigger
fn_rider_accept_job(p_order_id bigint) | uid/helper
fn_rider_available_jobs() | uid/helper
fn_rider_set_online(p_is_online boolean) | uid/helper
fn_rider_set_status(p_order_id bigint, p_new order_status) | uid/helper
fn_rider_stats() | review-body
fn_rider_wallet_history(p_limit integer) | review-body
fn_rider_wallet_summary() | review-body
fn_submit_payment(p_order_id bigint, p_method payment_method, p_slip_url text) | uid/helper
fn_submit_review(p_order_id bigint, p_merchant_rating smallint, p_merchant_comment text, p_rider_rating smallint, p_rider_comment text, p_tags text[]) | review-body
fn_sync_platform_order_finance() | trigger
rls_auto_enable() | event-trigger
trg_guard_order_checkout() | trigger
trg_guard_rider_delivery_transition() | trigger
trg_set_order_gp() | trigger
```

## Highest-priority review queue

1. **AAL2/owner path:** enumerate all direct and nested callers of `fn_assert_owner`, `fn_assert_admin`, and `fn_is_admin`; enforce AAL2 at the server-side boundary for owner-only RPCs without forcing AAL2 on every staff task.
2. **Sensitive staff RPCs:** verify exact permission keys and independent scope checks for finance reports/exports, payment verification, refunds, user verification, and company expenses. Confirm no permission key accidentally confers owner authority.
3. **Authenticated SECURITY DEFINER bodies with no recognized shared guard:** inspect exact ownership/state-transition rules for `fn_order_detail`, `fn_quote_order`, `fn_get_merchant_monthly_gp_rate`, `fn_calc_subtotal`, notification functions, profile creation, and customer complaint/refund functions. “No recognized guard” is not equivalent to “no authorization.”
4. **Direct helper RPCs:** `fn_admin_verify_user_raw` and `fn_admin_set_user_status_raw` have explicit authenticated EXECUTE grants but currently invoke owner-level guards; retain this observation in the matrix and verify it on staging. `fn_admin_assign_rider_raw` has no explicit authenticated grant in the snapshot.
5. **Audit consistency:** confirm every privileged mutation records the actor, target, reason, and outcome in the same transaction; check whether helper `fn_log` can only be reached through trusted function paths.
6. **Owner recovery/bootstrap:** preserve current ID-1 invariant until a separately tested recovery path exists.

## Proposed AAL2 design boundary (not implemented)

- Use Supabase Auth MFA assurance (current request/session JWT assurance, expected `aal2`) as a server-side check for **owner-only operations**. Do not trust a frontend-only flag, editable `user_metadata`, or a stale UI state.
- Enforce the AAL2 gate at shared owner-level guards **and** audit all owner-only endpoints with direct role checks so none bypass the shared guard. A helper-only change is insufficient until the caller graph is verified.
- Keep distinct checks for: (1) authenticated identity, (2) owner identity/bootstrap, (3) active account/profile, (4) AAL2, (5) requested permission, (6) geographic/record ownership scope, and (7) audit logging.
- Staff workflows remain least-privilege and do not inherit owner privileges merely because a function name begins with `fn_admin_`. Sensitive finance requires its separate permission plus scope; AAL2 is not a replacement for either.
- Owner sign-in product design remains email/password + TOTP as previously requested, but enrollment, challenge, backup/recovery, session restoration, and lockout recovery must be designed and tested before implementation. Customer phone/SMS OTP is unchanged absent separate approval.

## Staging-only test plan (planned; NOT RUN)

- AAL1 owner directly invokes every owner-only RPC → deny.
- AAL2 owner invokes owner-only RPC with active owner identity → allow.
- Customer, merchant, rider, inactive admin, and revoked admin invoke owner/staff RPCs → deny.
- Staff with one permission tries another permission, admin management, self-escalation, and out-of-zone record access → deny.
- Staff without finance permission requests bank/slip/payout/ledger/export data → deny.
- Owner at AAL2 without finance permission cannot perform a staff finance operation requiring a separate finance permission unless owner-wide permission is explicitly approved by the policy.
- Missing/unknown zone, inactive profile, invalid target role, missing owner profile, and direct RPC bypass → deny.
- Session restore at AAL1 never briefly renders owner-only UI.
- Owner factor absent/revoked/lost; backup factor and recovery flows → deny until verified recovery; recovery action audited.
- Permission/scope change without its audit record rolls back atomically.
- Each negative test is run only in isolated staging with disposable accounts and captured request/response evidence.

## Explicit limitations and safety

- Runtime Auth/MFA/RLS/RPC tests: **BLOCKED / NOT RUN** — only shared/live project available; do not test mutations or negative authorization on it.
- This catalog pass did not call the listed functions; only catalog metadata and function definitions were read.
- No DDL/DML, code behavior, Auth/Storage settings, grants, policies, accounts, or data changed.
- No PR merged. Keep PR #5 Draft/unmerged.
- Do not implement any migration until exact call paths, impact, rollback, staging results, and explicit owner approval are available.


## Supabase Security Advisor snapshot — 2026-10-29 (read-only)

The current security advisor returned three categories:

| Advisor | Count | Interpretation / next action |
|---|---:|---|
| RLS enabled, no policies | 17 tables | INFO. This can be intentional when tables are accessible only through guarded SECURITY DEFINER RPCs or not exposed. Review table grants, API exposure, and intended data path individually; do not add blanket policies. |
| Signed-in users can execute SECURITY DEFINER functions | 84 functions | WARN. This matches the explicit authenticated EXECUTE count above. Review each function's direct and nested authorization; revoke or change security mode only when a function is not intended as an authenticated RPC and after impact analysis. |
| Leaked password protection disabled | 1 Auth setting | WARN. Relevant before introducing the planned owner email/password login. Do not change Auth settings on the shared/live project without a specific approved change plan and verification. |

References supplied by the advisor:
- RLS policy finding: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- SECURITY DEFINER execution finding: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Leaked password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

These advisor categories are not a verified count of exploitable vulnerabilities. The review must consider intended RPC exposure, function body checks, table grants, and actual call paths. No advisor remediation was applied.
