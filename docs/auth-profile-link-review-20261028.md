# Auth/Profile Link Review — 2026-10-28

Status: **Yellow — source review completed; runtime tests blocked/not run**  
Scope: read-only review of the current `main` Auth UI and profile-link caller, with findings recorded on the documentation branch. No application code, database, Auth, Storage, permissions, accounts, or settings were changed.

## Files reviewed

- `src/pages/RegisterPage.tsx`
- `src/pages/VerifyPhonePage.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/auth/AuthProvider.tsx`
- `src/auth/ensureCustomerProfile.ts`
- Prior SQL/function review: `docs/auth-profile-link-review-20261026.md`
- Draft-only SQL proposal: `docs/proposed-auth-profile-hardening-20261026.md`

## Source-level findings

### A — Signup role and phone are client-controlled until the database validates them (High)

`RegisterPage.tsx` sends `full_name`, normalized `phone`, and selected `role` into Auth `user_metadata`. After OTP, `ensureUserProfile` reads those mutable metadata fields and passes the phone and role to `fn_register_profile`. The prior read-only SQL review found that the current function binds the profile to `auth.uid()` and rejects admin, but does not independently require a confirmed Auth phone or compare the supplied phone to `auth.users.phone`.

**Required behavior:** the server/database must derive identity from `auth.uid()`, use a trusted verified identity source, reject mismatched phone/UID and disallowed roles, and keep merchant/rider approval states pending. UI checks alone are not a security boundary.

### B — Registration verification can succeed without the profile helper running if route state is incomplete (Medium reliability risk)

`VerifyPhonePage.tsx` calls `ensureUserProfile(data.user)` only when mode is `register` **and** both `fullName` and `role` are present in transient React Router state. The page otherwise proceeds to `/dashboard` after OTP verification. Normal navigation supplies these fields, but the conditional is a brittle dependency: an incomplete state could produce a verified Auth session without running profile creation. This is not proof of an exploitable path, but it needs an explicit fail-closed state and test.

### C — Protected route checks authentication and phone confirmation, not profile existence or role approval (Medium / verify route design)

`ProtectedRoute.tsx` redirects unauthenticated users to login and users without `phone_confirmed_at` to verification. It does not itself establish that a linked application profile exists, that a merchant/rider is approved, or that the user has the role required by a destination route. Those checks must exist in the dashboard/data authorization paths and must be enforced by RLS/RPC as well as UI routing. The current source snapshot alone does not prove those downstream controls are missing; inspect and test each route/data path before concluding.

### D — Profile helper prefers metadata phone over Auth phone (High integrity concern)

`ensureUserProfile` computes `phone` from `user.user_metadata.phone` first, using `user.phone` only as a fallback. This makes the value passed to `fn_register_profile` caller-influenced even when Auth has a canonical phone. Do not “fix” this only in the client; server-side validation is required.

### E — OTP provider/runtime remains unverified (Blocked)

The current `main` login/register/verify pages use SMS OTP (`signInWithOtp({ phone })`, `verifyOtp({ type: "sms" })`). Email OTP work is in draft PR #4 and is not merged. Source inspection cannot establish provider configuration or a successful real OTP delivery/verification. The reported Supabase Dashboard “connection refused” issue also cannot be diagnosed from source code alone.

## Negative-test matrix — expected result

All tests below are **planned, not executed**. Run only in an isolated staging project with disposable accounts after staging access is confirmed.

| ID | Test | Expected result |
|---|---|---|
| N01 | Call profile registration without an authenticated session | Denied; no profile row |
| N02 | Authenticated user with unconfirmed phone attempts new profile registration | Denied server-side |
| N03 | Auth phone A, but caller supplies phone B in metadata/RPC | Denied or canonical Auth phone used; never attach B to A |
| N04 | Alter `user_metadata.role` before profile creation | Cannot obtain unauthorized role; server validates allowed signup flow |
| N05 | Attempt `admin` role through RPC or metadata | Denied |
| N06 | Repeat registration for the same Auth UID | Idempotent result; exactly one linked user/profile |
| N07 | Auth UID A attempts to read/update profile owned by UID B | Denied by RLS/RPC |
| N08 | Verify OTP with a different phone than the one to which the OTP was issued | Denied |
| N09 | OTP succeeds but registration route state lacks `fullName` or `role` | Do not navigate as if profile setup succeeded; show safe recovery/error path |
| N10 | Existing linked profile calls profile helper again | No mutation to role, phone, name, status, or ownership |
| N11 | Pending/rejected/disabled merchant or rider accesses approved-only workflow | Denied by server-side authorization |
| N12 | Two concurrent registration calls for one Auth UID | One profile only; deterministic response |

## Staging and execution status

- Only one Supabase project, Dumri (`vdmqhgdcfsswinlilwyn`), was available to this connection in the prior read-only project discovery; no isolated staging project was listed.
- Do **not** run the negative tests against the shared/live project, change production configuration, or create/promote/delete accounts to work around staging absence.
- Runtime status for N01–N12: **BLOCKED / NOT RUN**.
- CI status: the existing workflow has only demonstrated dependency installation and `npm run build`; it does not provide OTP, RPC, RLS, or end-to-end evidence.
- No code remediation or migration is included in this review. The SQL hardening proposal remains draft-only and must not be deployed until Auth phone confirmation behavior is verified with a disposable staging account and the exact migration/grants/rollback are reviewed.

## Next actions

1. Obtain an isolated staging project or explicit owner-approved safe test environment.
2. Confirm intended OTP provider/configuration and verify a fresh disposable account end-to-end.
3. Review `fn_register_profile` and profile/RLS behavior in staging, then run N01–N12 and attach redacted evidence.
4. Fix the incomplete registration-state behavior and remove metadata as an identity authority only after the server-side contract is agreed; add automated tests before proposing a merge.
5. Keep PR #4 and PR #5 unmerged until the relevant review, CI, and test gates are satisfied.
