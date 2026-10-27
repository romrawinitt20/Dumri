# Auth/Profile Live Read-Only SQL Evidence — 2026-10-28

Status: **Yellow — live definition review completed; no runtime tests executed**  
Project: Dumri, ref `vdmqhgdcfsswinlilwyn`, region `ap-northeast-2`  
Method: read-only catalog/function-definition queries and GitHub source retrieval. No INSERT/UPDATE/DELETE/DDL, no Auth/Storage/config changes, no account changes, and no PR merge.

## Evidence reviewed

- Current `main` source files:
  - `src/pages/RegisterPage.tsx`
  - `src/pages/VerifyPhonePage.tsx`
  - `src/auth/ensureCustomerProfile.ts`
- Live definitions read through PostgreSQL catalog:
  - `public.fn_register_profile(varchar, varchar, user_role, varchar)`
  - `public.fn_my_profile()`
  - `public.fn_my_user_id()`, `public.fn_my_role()`
  - `public.fn_assert_owner()`, `public.fn_assert_admin()`, `public.fn_assert_admin_permission(text)`, `public.fn_is_admin()`
- Execute access checked using `has_function_privilege` for `anon`, `authenticated`, and `service_role`.

## Confirmed current behavior

### 1. Client signup path

- `RegisterPage.tsx` starts SMS OTP signup and writes the selected `full_name`, `phone`, and `role` to Auth `user_metadata`.
- `ensureUserProfile` checks `user.phone_confirmed_at` in the client, then returns early if `fn_my_profile()` returns a row.
- When no profile exists, the helper reads `role`, `full_name`, and `phone` from user-editable metadata. It prefers metadata phone over `user.phone`, then passes those values to `fn_register_profile`.
- `VerifyPhonePage.tsx` invokes the helper only when `state.mode === "register"` and both `state.fullName` and `state.role` are present. If either is absent after OTP succeeds, it currently navigates to `/dashboard` without the helper running. This is a confirmed source-level reliability/authorization-flow defect, not a runtime exploit demonstration.

### 2. Live registration RPC

The current `public.fn_register_profile`:

- rejects when `auth.uid()` is null;
- rejects the `admin` role;
- marks customers active and merchant/rider accounts pending;
- inserts caller-supplied `p_phone`, `p_email`, `p_full_name`, and `p_role` into `public.users`, binding `auth_uid` to `auth.uid()`;
- creates `customer_profiles` for customers;
- does **not** check Auth phone confirmation inside SQL;
- does **not** compare `p_phone` to `auth.users.phone`;
- does **not** use an idempotent upsert/existing-profile return path. A repeat call may fail on the existing `auth_uid` uniqueness constraint rather than returning the existing profile. This needs a staging test and safe design, not a production probe.

Thus, the SQL binds the new row to the caller's Auth UID and blocks self-selected admin role, but caller-supplied phone/name/role still require a trusted server-side contract and validation. Client checks are not sufficient.

### 3. Profile read helper

`fn_my_profile()` filters on `u.auth_uid = auth.uid()` and requires non-null `auth.uid()`; the inspected definition returns at most one row. This is an appropriate identity-binding shape for this helper, but it does not prove all other table/RPC paths are safe.

### 4. Execute privileges for inspected functions

Observed for each of the eight functions listed above:

| Role | Can execute |
|---|---|
| `anon` | No |
| `authenticated` | Yes |
| `service_role` | Yes |

This is an access/grant observation only. In particular, allowing authenticated callers to invoke a `SECURITY DEFINER` RPC is not by itself proof of a vulnerability; each callable function must enforce its own authorization and expose only intended data/actions. Do not apply blanket revokes.

### 5. Owner/admin guard observations

- `fn_assert_owner()` checks authenticated UID, app user ID 1, admin role, active owner-level profile and active account status. It does not check JWT AAL2 in the inspected definition.
- `fn_assert_admin()` requires an active owner-level profile and `permissions.all=true`; it does not check JWT AAL2.
- `fn_assert_admin_permission(text)` checks an active admin and the requested permission (or `all=true`); it does not check JWT AAL2.
- `fn_is_admin()` returns whether the caller is an active owner-level admin with `all=true`; it does not check JWT AAL2.

These helpers alone do not establish whether every privileged RPC is correctly guarded. The complete caller/call-path inventory remains required before designing an implementation.

## Required staging tests (planned, not run)

1. Authenticated but unconfirmed Auth phone cannot register a profile.
2. Caller-supplied phone differs from canonical Auth phone; reject or use canonical verified identity.
3. Altering metadata role cannot create a role other than the permitted signup role.
4. Admin role remains rejected through direct RPC.
5. Repeat/concurrent registration for the same Auth UID returns one stable linked profile and creates no duplicates.
6. OTP success with incomplete router state must not route to a dashboard as if profile setup succeeded.
7. Existing linked profile cannot have role/name/phone/status/UID silently rewritten by a repeated helper call.
8. Customer/merchant/rider/staff cannot call owner-only operations directly; test AAL1 vs AAL2 only in isolated staging.

## Decision and guardrails

- Runtime tests: **BLOCKED / NOT RUN**. Only the shared/live Dumri project is available; do not use it for negative/mutation probes.
- No production change is recommended from this report alone.
- Before implementation: obtain isolated staging; agree on canonical identity and role policy; prepare exact migration, impact, rollback and automated tests; request explicit approval before any production change.
- No production DB/Auth/Storage/grants/policies/accounts/settings changed; no PR merged.
