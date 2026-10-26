# Dumri Auth/Profile Link Review — 2026-10-26

Status: **Yellow — review complete, remediation not applied**  
Scope: read-only inspection of Dumri source on `main` and current Supabase function definitions/grants/RLS metadata. No production database, Auth, Storage, grants, policies, user accounts, or app code were changed.

## Evidence inspected

- `src/pages/RegisterPage.tsx`: sends OTP with `shouldCreateUser: true`; writes `full_name`, normalized `phone`, and selected `role` to Auth user metadata.
- `src/pages/VerifyPhonePage.tsx`: verifies SMS OTP for the phone in route state; checks `phone_confirmed_at`; then calls `ensureUserProfile(data.user)`.
- `src/auth/ensureCustomerProfile.ts`: calls `fn_my_profile`; if no profile exists, reads role/name/phone from `user.user_metadata` and calls `fn_register_profile`.
- Current database definitions for `fn_my_profile`, `fn_register_profile`, `fn_assert_admin`, `fn_assert_admin_permission`, and `fn_assert_owner`.
- Execute grants and relevant RLS policies for users, customer profiles, merchant profiles, rider profiles, orders, and payments.

## Findings

### F1 — Profile registration trusts client-editable Auth metadata (High priority to validate)

The client selects `role`, `full_name`, and `phone` into Auth user metadata. The client then passes those values to `fn_register_profile`. The database function binds the new row to `auth.uid()` and rejects `admin`, but it does not compare `p_phone` with the authenticated Auth user's verified phone, does not derive the role from a trusted server-side record, and does not verify the Auth phone confirmation timestamp itself.

Impact: a caller who can alter their own Auth metadata or call the RPC directly may attempt to create a profile with a different phone value or a self-selected non-admin role. Merchant/rider profiles are created with `pending` status, which limits immediate access, but this still creates identity/data-integrity risk and must be negatively tested. The source-level phone-confirmation check in the client is not a server-side security boundary.

### F2 — Duplicate registration is guarded by a unique constraint, but function behavior should be idempotent

Read-only inspection confirmed `public.users_auth_uid_key UNIQUE (auth_uid)`, so duplicate rows for one Auth UID should be blocked at the database level. The function itself has no existing-profile lookup/upsert, so a repeated call can still raise a uniqueness error instead of returning the existing profile. This is a reliability/idempotency defect, not evidence that duplicate rows can be created.

### F3 — Admin-sensitive RLS policies use the broad `fn_my_role() = 'admin'` predicate

Observed policies include broad admin branches on `users`, `orders`, `payments`, `customer_profiles`, and `merchant_profiles`. The owner/admin assertion functions perform stronger checks, but these policies do not visibly call those assertions. Inspect the full definitions of `fn_my_role`, `fn_my_user_id`, and `fn_is_admin`, plus the intended staff/admin model, before deciding whether this is a privilege-boundary defect. Do not change policies based only on this snapshot.

### F4 — Security-definer RPCs are executable by authenticated users

The five reviewed functions have EXECUTE granted to `authenticated` (and `service_role`/ `postgres`). That is not automatically a vulnerability: authorization must be enforced inside each function. `fn_register_profile` is intended as a registration entry point, so it needs strong server-side validation. The assertion helpers should be checked for unintended information disclosure and expected caller behavior.

### F5 — Route state is transient, but the current UX fails closed

`VerifyPhonePage` depends on React Router state. Refreshing or opening the verification URL directly loses the registration/login context and shows an expiry/restart message. This appears to be a reliability/UX issue, not an authorization bypass. Do not persist OTP tokens in local storage.

## Required negative tests before remediation is accepted

Use disposable test accounts only. Do not use production customer/merchant/rider data.

1. Unauthenticated call to `fn_register_profile` → denied.
2. Authenticated user with unconfirmed phone → profile registration denied by the database function.
3. Confirmed Auth phone A with metadata/RPC phone B → denied; no row for B is created.
4. Caller attempts `p_role = admin` → denied.
5. Caller tampers metadata role after OTP but before registration → server-side policy prevents unauthorized role assignment; merchant/rider approval remains mandatory.
6. Repeat registration for the same `auth.uid()` → deterministic, idempotent behavior; no duplicate user/profile.
7. Existing Auth user with a profile → ensure-profile call does not mutate role, phone, name, status, or ownership.
8. Non-admin attempts reads/updates through each reviewed RLS policy → only their own/explicitly permitted rows are visible and writable.
9. Staff admin without owner-level permission attempts owner-only operations → denied; inactive admin and disabled user → denied.
10. Verify expected grants for anonymous/authenticated/service-role callers and test the existing `users_auth_uid_key` constraint under repeated and concurrent registration.

## Recommended next step (not applied)

Prepare a reviewed migration that makes registration identity server-derived: require `auth.uid()`, load the corresponding `auth.users` record, require its phone to be confirmed, derive the canonical phone from Auth rather than accepting a client-supplied phone, validate allowed signup roles, and return the existing profile for repeated registration. The unique constraint `users_auth_uid_key` already exists. Decide whether requested role should be stored as a pending application rather than trusted profile authority. Add tests before deployment. A draft-only proposal is recorded in `docs/proposed-auth-profile-hardening-20261026.md` (commit `7c29b4667193341796d7d7c0fc6797992b9e3976`).

Before applying any migration, show exact SQL, preflight duplicate checks, impact, and rollback. This review has not changed production state.

## Scope note

This report covers Dumri's source and the linked Supabase project. No work in this report depends on or attempts to delete another application.


## Follow-up evidence — 2026-10-26 (read-only)

### F6 — Auth phone fields are empty for all currently linked accounts

A read-only aggregate query comparing `public.users` with `auth.users` returned:

- Linked profile count: 9
- Auth records with `phone IS NULL`: 9
- Auth records with `phone_confirmed_at IS NULL`: 9
- Exact non-null phone matches: 0
- Profile phone values missing: 0 (from the earlier profile data check)

This does **not** prove OTP verification is broken: the records may have been created through a different flow or may be fixtures. It does prove the current database snapshot cannot be used as evidence that these 9 users have a canonical confirmed phone in Auth. Do not rewrite existing data. Create a disposable test account using the actual phone-OTP flow, verify OTP, then inspect whether `auth.users.phone` and `phone_confirmed_at` are populated.

**Release gate:** the draft hardening function that requires a confirmed Auth phone must not be deployed until the disposable-account test passes or the trusted server-side verification design is revised. The draft has been amended to return an existing profile before enforcing new-registration phone validation, avoiding an unnecessary break for legacy linked profiles.

### F7 — Latest Security Advisor snapshot

Read-only Security Advisor snapshot observed 2026-10-26:

- 84 `SECURITY DEFINER` functions executable by `authenticated` were flagged as WARN.
- 17 tables with RLS enabled and no policies were flagged as INFO.
- Leaked-password protection was flagged as disabled (WARN).

These are triage findings, not proof that all 84 functions or all 17 tables are exploitable. Some RPCs may intentionally be callable and enforce authorization internally; some tables may intentionally be RPC-only. Audit each function's authorization checks and each table's grants/access paths before changing grants or policies. Do not blanket-revoke or add blanket policies.

No production database/Auth/Storage/grants/policies or application settings were changed during this follow-up.
