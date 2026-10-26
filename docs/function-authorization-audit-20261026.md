# Supabase Authorization Audit — Function Review (Read-only)

Date: 2026-10-26
Project: `vdmqhgdcfsswinlilwyn`
Branch: `setup/supabase-auth-routes`

## Scope and safety

This review queried live PostgreSQL function definitions and ACL metadata only. No tables, policies, functions, Auth settings, Storage settings, or data were changed. No migration was run. Findings below are review findings, not proof of exploitability; verify call paths and intended product behavior before preparing a migration.

## High-priority findings

### 1. `fn_register_profile(...)` does not visibly bind the supplied phone number to the authenticated, phone-confirmed Supabase Auth identity

Observed behavior:
- Requires `auth.uid() IS NOT NULL`.
- Rejects `p_role = 'admin'`.
- Inserts caller-supplied `p_phone`, `p_email`, and `p_full_name` with `auth.uid()`.
- Does not visibly check `auth.users.phone`, `phone_confirmed_at`, or require `p_phone` to equal the phone number on the authenticated Auth user.
- Customer profiles are created as active immediately; merchant/rider profiles are pending.

Risk / impact:
- A signed-in identity may be able to register a profile with a phone number that has not been verified as belonging to that Auth identity, depending on the Auth flow and uniqueness constraints.
- This does not itself prove a takeover, but it is inconsistent with the confirmed product rule that customer phone SMS OTP confirmation is a distinct prerequisite.

Recommended next step (not applied):
- Review the app registration flow and database constraints together.
- Design a server-side check binding the profile phone to the authenticated Auth user and requiring confirmed phone for the customer path. Decide explicitly how merchant/rider onboarding should behave when their phone is not confirmed.
- Add tests for unconfirmed phone, mismatched phone, duplicate Auth UID, null/invalid role, and repeated calls.
- Do not patch live until the exact intended behavior and test plan are approved.

### 2. `fn_order_detail(p_order_id)` returns a broad JSON representation of an order

Observed behavior:
- The query includes `to_jsonb(o)`, plus shop contact details, rider name/phone/vehicle plate, item names, quantities, notes, and options.
- Its WHERE clause limits results to the order's customer, merchant, rider, or an admin-role user using `fn_my_user_id()` / `fn_my_role()`.

Assessment:
- An ownership/role predicate exists, so this is not currently classified as a confirmed authorization bypass.
- Returning `to_jsonb(o)` makes the function's output expand automatically when new order columns are added. That creates a data-minimization risk: future sensitive columns could be exposed unintentionally.
- The admin branch checks the general role string; review this against the current owner/staff-admin model and MFA/AAL2 requirement.

Recommended next step (not applied):
- Replace broad row serialization with an explicit allowlist of fields, after confirming which fields each participant needs.
- Test that unrelated customers, unrelated merchants, unrelated riders, and staff admins without the relevant permission cannot read the order.

### 3. `fn_get_merchant_monthly_gp_rate(p_merchant_id, p_check_time)` is SECURITY DEFINER and executable by authenticated

Observed behavior:
- Counts delivered/paid, non-excluded orders for a supplied merchant ID and time range, then reads the active GP tier.
- No explicit caller identity/role/ownership check appears in the function body.
- The function is used by the order GP trigger, so internal use is legitimate.

Assessment:
- The function appears to expose tier/rate information for arbitrary merchant IDs and caller-supplied times to authenticated callers. Exact exploitability and business sensitivity depend on the intended disclosure model.
- More importantly, a helper needed internally by a trigger is exposed as a callable public-schema API.

Recommended next step (not applied):
- Determine whether client-side callers need this helper at all. If not, revoke client EXECUTE and keep the trigger path working; verify dependencies and grants before any change.
- Do not change grants until dependent RPCs and trigger behavior are tested.

## Admin authorization pattern findings

- A sample of sensitive admin functions use shared `fn_assert_admin_permission(...)` or the owner-only `fn_is_admin()` helper.
- Functions using `fn_is_admin()` are owner-level-only under the inspected current definition; this appears consistent with the current helper, but it may mean staff admins cannot use those functions even if their permission JSON suggests otherwise. Treat as a permission-model consistency question, not automatically a vulnerability.
- Examples observed using `fn_is_admin()`: `fn_admin_adjust_rider_wallet`, `fn_admin_assign_rider`, complaint-management functions, and some invoice/wallet actions.
- The draft owner MFA guard would strengthen shared helpers, but must not be applied until all direct checks, wrapper functions, and intended staff permissions have been mapped. Functions that use `fn_is_admin()` will inherit its behavior only if they call the helper at runtime; direct role checks need separate review.

## Other checks

- `fn_create_merchant_profile` checks authenticated identity, maps the app user by `auth.uid()`, requires merchant role, blocks suspended/banned users, and creates the profile unverified and closed.
- `fn_create_rider_profile` similarly maps the profile to the authenticated user, requires rider role, blocks suspended/banned users, and creates the profile unverified/offline. It stores national ID and bank account values directly in the relational profile; review whether these fields should instead be minimized/masked and whether sensitive documents are kept only in private Storage.
- `fn_customer_refund_status` checks customer role and ownership of the order; it returns `NULL` for `admin_note`, so that column is not disclosed by this function.
- `fn_rider_available_jobs` checks signed-in rider identity, active account, verified profile, online state, ready orders, and payment conditions.
- `fn_rider_stats` is scoped to `fn_my_user_id()`; its query does not visibly include an explicit role guard, so add role/empty-profile tests before considering it complete.
- The broad SECURITY DEFINER / authenticated grant count is an inventory signal only. It must not be described as a count of confirmed vulnerabilities.

## Suggested test cases before any migration

1. Profile registration: unconfirmed Auth phone, mismatched submitted phone, repeated registration, invalid role, and authenticated UID already linked to a profile.
2. Order detail: own customer order; another customer's order; unrelated merchant; unrelated rider; active staff admin without relevant permission; owner without AAL2; owner with AAL2.
3. GP helper: authenticated customer invokes it for a different merchant and historical/future timestamp; order trigger still calculates GP after any proposed grant adjustment.
4. Admin actions: owner vs staff admin with each permission, inactive admin, suspended/banned account, owner session at AAL1 vs AAL2.
5. Confirm all sensitive-document fields remain inaccessible to other users and never use public Storage URLs.

## Current status

- Read-only inspection only.
- No live database or Supabase Auth changes made.
- No SQL migration executed.
- Owner MFA SQL remains a draft and is not ready to apply.
- PR #1 remains open and unmerged.
