# Owner/Admin Authorization and MFA Review — 2026-10-28

Status: **Yellow — design/review documented; no runtime tests or changes executed**  
Scope: read-only review of the existing owner/admin/MFA review, route source, and admin-scope security gates. This document clarifies the authorization boundary and test gates for the next scheduled task. It does not replace a complete function-by-function SQL review.

## Evidence reviewed

- docs/owner-mfa-enforcement-review.md
- docs/admin-area-scope-security-gates-20261026.md
- docs/admin-area-scope-live-baseline-20261026.md
- src/App.tsx
- src/components/ProtectedRoute.tsx
- Prior read-only function review recorded in the owner MFA document.

## Verified source/document findings

1. **Owner authentication is not implemented in the current UI.** The current login page uses phone/SMS OTP for all roles. The planned owner email/password plus TOTP flow is not implemented in the reviewed route source.
2. **Frontend session checks do not enforce MFA assurance.** The current Auth provider restores a session, and ProtectedRoute checks configuration, loading, session presence, and phone confirmation. It does not inspect the Supabase MFA assurance level (aal) or enforce owner-only routing.
3. **No separate owner MFA routes are present in src/App.tsx.** There are no dedicated owner enrollment/challenge routes in the reviewed route map.
4. **Database guards need explicit AAL2 checks for owner-only actions.** The existing read-only review says fn_assert_owner, fn_assert_admin, fn_assert_admin_permission(text), and fn_is_admin() do not check JWT AAL. Adding a check only to a frontend route or one helper would be incomplete because other SECURITY DEFINER functions may perform direct checks or call wrappers.
5. **Staff permissions must remain least-privilege.** Do not indiscriminately require AAL2 for every staff action; classify each function by owner-only versus staff-permission behavior and enforce the intended boundary server-side.
6. **Owner bootstrap is a separate lockout risk.** The existing owner guard depends on application user ID 1 plus active owner-level admin profile and matching Auth UID. Do not remove or replace this dependency without a reviewed bootstrap, backup, recovery, and rollback procedure.
7. **Admin geographic scope is not yet proven end-to-end.** Current zones metadata does not include canonical province/district IDs. Unknown geography must fail closed; no mapping should be guessed from display names or coordinates.

## Role/assurance matrix to implement and test

| Actor/state | Owner-only RPC | Staff-permission RPC | Sensitive finance action | Expected behavior |
|---|---|---|---|---|
| No authenticated session | Deny | Deny | Deny | No access |
| Customer | Deny | Deny | Deny | No admin access |
| Merchant or rider | Deny | Deny | Deny | No admin access |
| Inactive/revoked admin | Deny | Deny | Deny | Revocation effective server-side |
| Active staff, required permission absent | Deny | Deny | Deny | Least privilege |
| Active staff, permission present | Deny | Allow only scoped operation | Deny unless separate finance permission exists | No owner privilege |
| Owner at AAL1 | Deny | N/A unless a separately approved low-risk path exists | Deny | Require step-up |
| Owner at AAL2 | Allow if owner guard and account status pass | Allow per policy | Allow only with finance permission and audit | Every action still server-authorized |
| Owner factor revoked/lost | Deny until verified recovery | N/A | Deny | Recovery is separate, strongly verified and audited |
| Any admin with unknown/out-of-scope geography | Deny scoped record access | Deny scoped record access | Deny | No fallback to global access |

## Negative-test plan (not executed)

- M01: owner session at AAL1 calls owner-only RPC directly → denied.
- M02: owner session at AAL2 calls owner-only RPC → allowed only if owner identity and active status pass.
- M03: customer, merchant, and rider call owner/admin RPC directly → denied.
- M04: staff calls an ungranted permission RPC → denied.
- M05: staff with one permission attempts admin management or self-escalation → denied.
- M06: inactive/revoked admin reuses an old session → denied by server-side checks.
- M07: owner MFA factor absent, unverified, or revoked → owner-only action denied.
- M08: backup factor flow is tested without weakening the primary factor requirement.
- M09: lost-factor recovery cannot be triggered by client-supplied UID or editable metadata; all recovery is audited.
- M10: direct RPC invocation is denied even if the UI route is bypassed.
- M11: admin requests a record outside their verified district/province scope → denied.
- M12: admin requests finance/bank/slip data without a separate finance permission → denied.
- M13: scope/permission change and audit record are atomic; failed update leaves no partial grant.
- M14: route/session restore at AAL1 does not briefly render an owner-only screen before assurance is checked.

## Required gates before implementation

1. Obtain an isolated staging environment and disposable test identities; runtime tests are blocked until then.
2. Inventory exact SQL definitions, grants, and call paths for owner/admin guards, admin management, finance, and scoped data operations. Existing broad function counts are triage signals, not a verified vulnerability count.
3. Agree the owner bootstrap/recovery design and exact distinction between owner-only and staff-permission RPCs.
4. Prepare migration and rollback drafts; do not execute them against the only available shared/live project.
5. Implement the owner email/password + TOTP flow only after the authentication and lockout/recovery design is reviewed. Customer phone/SMS OTP remains unchanged unless the owner separately approves a product decision.
6. Add server-side AAL2 checks to every owner-only path, not just frontend navigation; test both direct RPC and UI paths.
7. Test admin scope and sensitive-finance permissions independently; do not treat geographic scope as a substitute for functional permission.
8. Keep PRs draft/unmerged until the owner approves the exact change and applicable CI/staging evidence exists.

## Execution and safety status

- Runtime tests: **BLOCKED / NOT RUN** — no isolated staging project was listed in prior read-only discovery.
- CI evidence does not currently demonstrate MFA, AAL, RPC, RLS, or end-to-end behavior.
- No code, SQL, grants, policies, Auth settings, accounts, or data changed.
- No PR merged; no Midnight Meals work performed.
