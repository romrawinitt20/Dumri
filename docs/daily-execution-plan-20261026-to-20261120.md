# Dumri Daily Execution Plan — 2026-10-26 to 2026-11-20

Timezone: Asia/Bangkok (UTC+7)
Target: testable MVP by 2026-11-20, not an automatic production-launch promise.
Daily evaluation: Green = acceptance evidence exists; Yellow = partial/blocked with a recovery plan; Red = critical blocker or date forecast at risk. A task is not complete because code was written; it needs a repeatable test or direct evidence.
Scope guardrails: no merge without owner approval; no production DB/Auth/Storage/permission changes without showing exact SQL, impact, rollback and obtaining approval; no real-money transfers in demo. Current execution scope is Dumri; other-app cleanup is out of scope.

| Date | Main deliverable | Acceptance evidence / end-of-day check |
|---|---|---|
| Mon 26 Oct | Establish baseline and daily tracking | PR #1 merged; record known risks, test gaps and remaining schedule. |
| Tue 27 Oct | Source and shared-client inventory | Dumri repository tree, migration inventory, source consumers and known unknowns documented. |
| Wed 28 Oct | Auth/profile-link review | Review exact registration/profile function and caller; record negative tests for mismatched phone/UID. |
| Thu 29 Oct | Owner/admin and MFA review | Map owner vs staff vs area admin; confirm MFA/AAL2 enforcement gaps and admin bootstrap path; no admin account changes. |
| Fri 30 Oct | RLS and sensitive-field audit | Prioritized table/column/function matrix for identity, bank, payment, wallet and complaints; direct grants separated from RPC access. |
| Sat 31 Oct | Storage/Edge Function and security test plan | Payment-slip policies, Edge Functions and high-risk SECURITY DEFINER list documented; role-based deny/allow test matrix. |
| Sun 1 Nov | Core app architecture freeze | Confirm route map, role states, data ownership and MVP exclusions; do not invent unresolved product rules. |
| Mon 2 Nov | Auth/session behavior | Implement/fix loading, session restore, sign-out and OTP error states; build and focused tests pass. |
| Tue 3 Nov | Registration/profile linkage | Ensure server-side linkage is bound to authenticated identity and confirmed phone; test duplicate, mismatched, expired and unauthenticated cases. If source/DB blocker remains, report Yellow/Red instead of bypassing it. |
| Wed 4 Nov | Protected routes and approval states | Customer/merchant/rider/admin route access tested; pending/rejected/disabled accounts cannot use approved workflows. |
| Thu 5 Nov | Owner/staff admin boundary | Admin UI and server authorization design aligned; owner-only operations cannot be invoked by staff; MFA/AAL2 gaps clearly gated. |
| Fri 6 Nov | Automated auth/route tests | CI covers build, type checks and core auth/route tests; report latest commit and actual workflow result. |
| Sat 7 Nov | Foundation regression and scope lock | Re-run tests, fix high-priority foundation bugs, freeze MVP scope; anything not feasible is explicitly deferred. |
| Sun 8 Nov | Customer browse and menu | Approved shops/categories/items visible; unapproved shops excluded; loading/empty/error states tested. |
| Mon 9 Nov | Cart, quote and order creation | Totals, delivery quote, distance inputs and order ownership tested; no order double-submit. |
| Tue 10 Nov | Merchant shop/menu/order workflow | Merchant can manage only own allowed records and accept/reject eligible orders; other merchants are denied. |
| Wed 11 Nov | Rider assignment and delivery | Rider sees only eligible/assigned orders; status transitions validated; delivery pay formula tested at 4 km and beyond. |
| Thu 12 Nov | Merchant promotions | Merchant-defined discount rules validate; edge cases and discount caps tested; no paid-ad ranking. |
| Fri 13 Nov | Payment/deposit states | Orders > THB 500 require transfer or 50% deposit in test mode; duplicate callbacks/updates cannot duplicate effects. |
| Sat 14 Nov | Commission and daily close | Test GP 7% per merchant/day, 02:00 Asia/Bangkok business-day boundary, platform/tax-reserve ledger split; reconcile rounding. |
| Sun 15 Nov | COD, rider wallet and incentive | COD debt is only GP owed to platform; rider base THB 20 for first 4 km + THB 3 per extra km; only orders >= THB 100 qualify for monthly 2 orders = THB 1 rule. |
| Mon 16 Nov | Cancellations, claims and refunds | Allowed transitions, dispute audit, refund cases and idempotency tested; prevent duplicate credits/debits. |
| Tue 17 Nov | Security and full regression | Re-run role/ownership matrix, sensitive data access tests, build/CI; no unresolved critical/high issue without documented mitigation. |
| Wed 18 Nov | End-to-end staging pass | Separate test accounts for customer/merchant/rider/admin; evidence for core journeys; external integrations listed as blocked if credentials/cost unavailable. |
| Thu 19 Nov | Acceptance report and fixes | Publish complete/tested/incomplete/blocked matrix, fix only verified issues, prepare backup/rollback and deploy checklist. |
| Fri 20 Nov | Final target assessment | Produce Go/No-Go report. Call it testable MVP only if acceptance evidence passes. Production launch requires separate owner approval and legal/payment/security readiness. |

## Daily scorecard template
- Date and target deliverable:
- Status: Green / Yellow / Red:
- Evidence: commit SHA, CI run, test results or read-only query output:
- What actually passed:
- What failed or is blocked:
- Impact on 20 Nov target:
- Next action and owner decision needed (if any):

## Schedule risk rules
- If any authentication/authorization blocker remains by 6 Nov, downgrade scope and reassess timeline before building more features.
- If order/payment state integrity is not testable by 13 Nov, use simulated payments only and do not claim financial workflows complete.
- If high-risk security findings or role isolation fail on 17 Nov, do not release to production on 20 Nov; provide a testable MVP or a clear No-Go report instead.
- Do not silently weaken security, use real customer/merchant/rider data for tests, promote accounts, or change shared production settings to meet the date.


## Baseline scorecard — 2026-10-26

- Status: **Yellow**.
- Completed with evidence:
  - Daily execution plan is present in this repository.
  - Read-only source inspection confirmed the Dumri shared client, Auth provider, login/register/OTP flows, protected dashboard route, profile RPC caller, demo-order page, demo-payout page, and CI build workflow.
  - Read-only Supabase table metadata and Security/Performance Advisor snapshots were inspected.
  - Recorded all 89 applied migration version/name pairs in `docs/shared-supabase-consumer-inventory-20261026.md`; the observed range is 20261023145910–20261024194639.
  - Added `docs/shared-supabase-consumer-inventory-20261026.md`; initial inventory commit `575d02e404fbd5765efb9b6ab06bbf0d18daace4`, migration inventory update `fc2bed4f1e3c2f1a876e9ecf2ae36483cea16ae9`.
- Not yet passed:
  - No successful CI result has been verified for the documentation commit at the time this scorecard was written.
  - Exact SQL bodies for registration/profile and admin assertion helpers are now inspected read-only; order/payment/payout functions still need review.
  - Cross-application inventory is intentionally out of scope for the current Dumri execution plan.
- Production impact: no database, Auth, Storage, grants, policies, production accounts, or app settings were changed in this work.
- Additional evidence on 2026-10-26: read-only review of `fn_my_profile`, `fn_register_profile`, `fn_assert_admin`, `fn_assert_admin_permission`, `fn_assert_owner`, execute grants, and selected RLS policies. `users.auth_uid` has a UNIQUE constraint. Report: `docs/auth-profile-link-review-20261026.md` (latest review commit `9959c73301e94796badec13bf66c9de3e4d09771`).
- Key finding: registration profile values are taken from client-editable Auth metadata; `fn_register_profile` accepts caller-supplied phone and does not itself check Auth phone confirmation or match phone to `auth.users`. Merchant/rider accounts remain pending, but server-side identity validation needs a fix and negative tests.
- Production impact: no database, Auth, Storage, grants, policies, production accounts, or app settings were changed in this work.
- Target impact: Dumri inventory and auth/profile review are documented; status remains Yellow until remediation design is approved and tests pass.
- Draft-only migration and rollout plan added at `docs/proposed-auth-profile-hardening-20261026.md` (commit `7c29b4667193341796d7d7c0fc6797992b9e3976`). Next action: validate the proposal in an isolated staging project, verify all constraints and grants, and run the negative-test matrix. Production migration remains unapplied pending explicit approval.
- Latest docs-only scorecard update: this file's current commit will be recorded after the update; no verified CI result is available yet.

- Follow-up read-only evidence on 2026-10-26: all 9 linked Auth records currently have `auth.users.phone IS NULL` and `phone_confirmed_at IS NULL`; profile phone values exist but no exact non-null Auth phone matches were found. The project owner confirmed the 9 linked accounts were created for testing, so this is not classified as a production customer-account defect. Test a newly created disposable phone-OTP account end-to-end before concluding whether the flow is correct. The strict registration-hardening draft is blocked from deployment until this is resolved.
- Latest Security Advisor triage snapshot: 84 SECURITY DEFINER functions executable by authenticated users (WARN), 17 RLS-enabled tables with no policies (INFO), and leaked-password protection disabled (WARN). These require per-function/table review; do not apply blanket grant or policy changes.
- Proposal document updated with the phone-field blocker and idempotency ordering correction; latest commit: ae661c521aaed488e9e343e7334e69d02319f7cb. No production changes made.


## Daily scorecard — 2026-10-27

- Date and target deliverable: Tuesday 27 October — source and shared-client inventory.
- Status: **Yellow (overall execution status)**. The inventory deliverable has supporting repository evidence; overall status remains Yellow because authentication/profile linkage and a repeatable OTP runtime test are still blocked. This is not a claim that the inventory itself failed.
- Evidence snapshot:
  - Main HEAD inspected: [`c4b7ab80f78f55babacf3c0323afecbf990effb0`](https://github.com/romrawinitt20/Dumri/commit/c4b7ab80f78f55babacf3c0323afecbf990effb0).
  - Main CI: [run #40336443105](https://github.com/romrawinitt20/Dumri/actions/runs/40336443105) — completed successfully on that SHA; checkout, Node.js 22 setup, dependency installation, and `npm run build` passed.
  - Inventory: [`docs/shared-supabase-consumer-inventory-20261026.md`](shared-supabase-consumer-inventory-20261026.md) records Dumri client/call sites, the 89 applied migration version/name pairs, read-only metadata findings, and known unknowns. The repository tree also contains the auth/profile review and draft-only hardening proposal.
  - Effective workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs dependency installation and a build only. It does not run unit, OTP, RLS, RPC authorization, or end-to-end tests.
  - Email-OTP work remains in draft [PR #4](https://github.com/romrawinitt20/Dumri/pull/4), head `cd2334553c6de8eed14493d51416223e638a1c62`, targeting `setup/supabase-auth-routes`; no workflow run was found for branch `fix/email-otp-auth`. It is not merged into `main`.
- What actually passed:
  - The source/shared-client inventory and known-unknowns are documented in the repository.
  - The build-only CI workflow passed on main SHA `c4b7ab80f78f55babacf3c0323afecbf990effb0`.
  - No production Supabase/Auth/Storage/grant/policy/account/settings change was made as part of this review.
- Not passed / blocked:
  - No repeatable runtime evidence for SMS OTP or email OTP, profile registration linkage, protected-route authorization, RLS/RPC negative tests, or full customer/merchant/rider journeys was found in the checked CI evidence.
  - The owner reports that Supabase Dashboard → Authentication → Email Templates shows “connection refused”; this report is not independently verifiable from GitHub CI and prevents confirming the email OTP template.
  - The read-only auth/profile review still identifies reliance on client-editable metadata and a need for server-side identity/phone-confirmation validation. The hardening proposal remains draft-only.
- Impact on 20 November 2026 target: a testable MVP is not yet evidenced. The date is not declared missed at this early checkpoint, but authentication/profile linkage is on the critical path. Per the plan, if the auth blocker remains by 6 November, reduce scope and reassess the forecast; do not weaken security or claim production readiness.
- Next actions:
  1. Restore access to Supabase Dashboard using browser/network/status checks only; do not change production Auth, database, Storage, grants, policies, or project settings during diagnosis.
  2. Validate the intended OTP flow and profile linkage in an isolated staging project with disposable test accounts, then record repeatable positive and negative test results.
  3. Keep PR #4 draft and unmerged until it has an applicable CI run and the OTP/profile flow is verified; ensure CI covers the actual PR head/base before relying on its build result.
- Scope guardrail: no PR was merged; no production configuration was changed; Midnight Meals was not inspected or modified.


### Evidence refresh — 2026-10-27 20:18 Asia/Bangkok

- The previously pending documentation CI is now verified complete: [Dumri CI run #40507612650](https://github.com/romrawinitt20/Dumri/actions/runs/40507612650), event `push`, branch `main`, head SHA `57cf2458c3aac33b3a7bad9aa0fbefb9bd5f9acb`, conclusion `success`. Job `build` completed successfully; dependency installation and `npm run build` both passed.
- This updates the evidence state for the 2026-10-27 scorecard only. It does not expand the workflow's coverage: `.github/workflows/ci.yml` still runs install/build only. No OTP, profile-link, route authorization, RLS/RPC, or end-to-end test result is evidenced by this run.
- Overall status remains **Yellow**. The inventory/build checkpoint is evidenced; runtime Auth/profile and authorization acceptance remains blocked/unverified. Next scheduled deliverable for 2026-10-28 is the read-only Auth/profile-link review, including a negative-test plan for mismatched phone and Auth UID.
- Safety: no production Supabase/Auth/Storage/permission changes, no account/data changes, no PR merge, and no work on other applications.


### Follow-up evidence — 2026-10-27, staging readiness

- The scheduled 2026-10-27 deliverable (source/shared-client inventory) is complete based on the repository evidence above: the Dumri source/call-site inventory, 89 migration version/name pairs, known unknowns, and a successful build-only CI run are documented.
- Added a repeatable 16-case Auth/profile-link and role-isolation test matrix in `docs/auth-profile-link-test-matrix-20261028.md` on draft PR #5. The matrix is a plan, not a test execution result.
- Read-only Supabase project discovery found only the Dumri project ref `vdmqhgdcfsswinlilwyn` available to this connection; no separate staging project was listed. Therefore all runtime OTP/profile/RLS/RPC tests remain **BLOCKED / NOT RUN**. Do not probe the shared/live project or create/promote/delete accounts to bypass this blocker.
- Current day-27 assessment: **Yellow overall**. Inventory/build acceptance is evidenced; runtime auth and authorization acceptance is not. No production Supabase/Auth/Storage/permission change, no account/data change, no PR merge, and no Midnight Meals work was performed.
- Next scheduled deliverable for 2026-10-28: complete the read-only Auth/profile-link review and negative-test plan; keep runtime execution blocked until an isolated staging project is available.

## Daily scorecard — 2026-10-28

- Date and target deliverable: Wednesday 28 October — read-only Auth/profile-link review and negative-test plan.
- Status: **Yellow**. Source review and negative-test expectations are documented; runtime tests are **BLOCKED / NOT RUN** because an isolated staging project is not available to this connection.
- Evidence: [Auth/Profile Link Review — 2026-10-28](auth-profile-link-review-20261028.md); prior database/function findings remain in [the 2026-10-26 review](auth-profile-link-review-20261026.md).
- Findings recorded:
  - Signup sends client-selected role/name/phone in mutable Auth metadata; profile helper trusts metadata and prefers metadata phone over Auth phone.
  - The database registration function needs to enforce confirmed/canonical identity and role validation server-side; UI checks are not sufficient.
  - OTP verification can navigate to dashboard without calling the profile helper if registration route state is incomplete.
  - ProtectedRoute checks session/phone confirmation but does not itself prove profile existence, role approval, or authorization for every destination; downstream controls require review/tests.
- Negative-test plan: 12 cases covering unauthenticated registration, unconfirmed phone, phone mismatch, metadata role tampering, admin role rejection, duplicate/concurrent registration, cross-user access, wrong-phone OTP, incomplete route state, existing-profile immutability, pending/rejected/disabled workflows, and duplicate UID linkage.
- What passed: the source review and expected outcomes are recorded. No runtime test is represented as passing.
- Blockers: no isolated staging project is available; OTP provider delivery and verification remain unconfirmed. Do not run these cases against the shared/live project or change production settings/data to bypass the blocker.
- Production impact: no app code, Supabase database/Auth/Storage/grants/policies, accounts, or settings changed. No PR merged; PR #5 remains draft.
- Next action: obtain an isolated staging environment, verify a fresh disposable OTP account, then run the negative-test matrix with redacted evidence. Keep the SQL hardening proposal draft-only until this gate is satisfied.

### Prework for 2026-10-29 — owner/admin and MFA review

- Read-only follow-up report added: [Owner/Admin Authorization and MFA Review — 2026-10-28](owner-admin-mfa-review-20261028.md).
- Confirmed from source/document review: current UI uses SMS OTP for all roles; no separate owner email/password + TOTP routes are present; AuthProvider/ProtectedRoute do not enforce MFA assurance level; existing reviewed database guard helpers do not check JWT AAL.
- Clarified the required authorization matrix for customers, merchants, riders, staff, owner at AAL1/AAL2, revoked admins, sensitive finance permissions, and out-of-scope geography. Added 14 planned negative cases, including direct RPC bypass and recovery paths.
- Status remains **Yellow / design review only**. These are source and prior-review findings, not successful runtime tests. A full function-by-function authorization inventory is still required before any migration.
- Runtime tests remain **BLOCKED / NOT RUN** because no isolated staging project was available in the prior read-only discovery. Do not run probes against the shared/live project.
- No code, SQL, grants, RLS policies, Auth settings, accounts, or data changed. No PR merged; PR #5 remains draft.
- Next: finish the owner/admin function call-path inventory, define the exact AAL2 enforcement boundary without over-restricting staff permissions, and keep any migration/rollback as draft until isolated staging and explicit approval exist.

### Owner/Admin function inventory — 2026-10-28 follow-up

- Added [Owner/Admin Function Authorization Inventory](owner-admin-function-authorization-inventory-20261028.md) as a read-only classification register for the next implementation gate.
- Classified the shared guards `fn_assert_owner()`, `fn_assert_admin()`, `fn_assert_admin_permission(text)`, and `fn_is_admin()`; separated owner-only AAL2 enforcement from least-privilege staff permissions and additional finance/geographic scope checks.
- Recorded the admin/approval/scope migration names from the existing live baseline as inspection clues only. Migration names do not prove the active SQL behavior.
- Evidence limitation: the repository connector could retrieve the review documents but not the guessed migration SQL paths; code search returned no function definitions in this pass. The exact per-function SQL body, grants, and caller graph therefore remain unverified. The document explicitly labels itself partial rather than claiming the complete inventory is finished.
- Runtime tests remain **BLOCKED / NOT RUN** pending isolated staging. No SQL was executed and no production code, database, Auth, Storage, grants, policies, accounts, or data were changed. PR #5 remains draft/unmerged.
- Next action: retrieve exact function definitions and grants through a supported read-only path, then produce the complete SECURITY DEFINER call-path matrix. Do not draft/apply an executable MFA migration until the exact inventory, rollback, and isolated staging tests are reviewed and the owner explicitly approves.

### Evidence refresh — 2026-10-28, live Auth/profile SQL review (read-only)

- Added [Auth/Profile Live Read-Only SQL Evidence](auth-profile-live-readonly-evidence-20261028.md), commit `e2398d76dc5aacaf25f9324b9944e5c5777f03f2`.
- Read the active live SQL definitions for `fn_register_profile`, `fn_my_profile`, `fn_my_user_id`, `fn_my_role`, `fn_assert_owner`, `fn_assert_admin`, `fn_assert_admin_permission(text)`, and `fn_is_admin`; checked execute privilege for `anon`, `authenticated`, and `service_role`.
- Confirmed `fn_register_profile` binds the inserted application profile to `auth.uid()` and rejects the `admin` role, but accepts caller-supplied phone/name/role, does not validate confirmed/canonical Auth phone in SQL, and has no idempotent existing-profile return path. `ensureUserProfile` trusts editable metadata and prefers metadata phone. `VerifyPhonePage` can route to dashboard after OTP without calling profile creation when transient registration state is incomplete.
- The inspected helper RPCs are executable by `authenticated` but not `anon`; this is not by itself proof of a vulnerability. The owner/admin guard definitions inspected do not check JWT AAL2. Complete caller/call-path review remains required; do not apply blanket revokes.
- Status: **Yellow**. The scheduled read-only source review and negative-test plan are complete and now backed by current live SQL definitions/grant observations. Runtime tests remain **BLOCKED / NOT RUN** because no isolated staging project is available. Do not probe the shared/live project with mutation or negative authorization tests.
- Safety: no SQL mutation/DDL, no production Auth/Storage/grant/policy/account/config changes, no PR merge, and no work on other applications.
- Next action: continue the planned 2026-10-29 owner/admin MFA and caller inventory, using read-only SQL to enumerate privileged RPCs and their guards; keep all remediation as a draft until isolated staging, exact impact/rollback, and explicit approval are available.


### Owner/Admin MFA and SECURITY DEFINER inventory — 2026-10-29

- Completed a read-only live catalog inventory of all 95 `public` SECURITY DEFINER functions, recording exact signatures, function-level search_path presence, explicit EXECUTE grants, and guard-pattern classifications in [Live Owner/Admin MFA and SECURITY DEFINER Inventory](owner-admin-mfa-rpc-inventory-20261029.md).
- Catalog snapshot: 95/95 have a function-level search_path setting; 84 have explicit authenticated EXECUTE, 0 have explicit anon EXECUTE, and 95 have service_role EXECUTE. These are explicit ACL observations, not a substitute for effective-privilege/call-path validation.
- A scan of all 95 definitions found 0 textual references to AAL2, an AAL comparison, or auth.jwt(). Trigger/event-trigger functions are not session-bound RPCs, so this is not a claim that all 95 need MFA; it confirms the inspected bodies do not visibly enforce JWT assurance.
- Confirmed the helper naming risk: fn_assert_admin() and fn_is_admin() enforce active owner-level/all permission, not generic staff-admin status. Owner-only and permission-based RPC groups are now separately enumerated. The owner-only RPC boundary needs server-side AAL2, while staff actions need their own permission and record/geographic scope.
- Added a prioritized review queue for bodies without a recognized shared guard; those entries are flagged for per-function review, not declared vulnerabilities. No function was executed as a test.
- Status remains **Yellow**. Runtime Auth/MFA/RPC/RLS tests remain **BLOCKED / NOT RUN** because no isolated staging project is available. No live data/settings/grants/policies/accounts/code changed. PR #5 remains Draft/unmerged.
- Next gate: complete direct/nested call-site and table/record-scope trace for the highest-risk functions; prepare a migration and rollback proposal only after that inventory and staging setup, then request explicit approval before any implementation.
