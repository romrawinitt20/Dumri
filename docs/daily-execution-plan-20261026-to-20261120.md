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


## Daily scorecard — 2026-10-28

- Date and target deliverable: Wednesday 28 October — Auth/profile-link review, including a negative-test plan for mismatched phone and Auth UID.
- Status: **Yellow**. The read-only review work has been prepared and documented on draft PR #5, but that documentation is not merged into `main`; runtime acceptance tests remain blocked/not run. This is not a claim that the Auth/profile flow passed.
- Evidence snapshot:
  - Main HEAD at the start of this review: [`1162a23478c919910b66896b785812a9f1dc2cd1`](https://github.com/romrawinitt20/Dumri/commit/1162a23478c919910b66896b785812a9f1dc2cd1), commit message `docs: refresh Dumri Oct 27 CI evidence`. Its diff updates this tracking document only.
  - Effective main CI: [run #40510932200](https://github.com/romrawinitt20/Dumri/actions/runs/40510932200), event `push`, branch `main`, head SHA `1162a23478c919910b66896b785812a9f1dc2cd1`, conclusion `success`. The `build` job completed checkout, Node.js 22 setup, dependency installation, and `npm run build` successfully.
  - Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) only installs dependencies and builds. `package.json` has no test script. This run is build evidence only; it is not evidence for OTP, profile linkage, route authorization, RLS/RPC, MFA/AAL2, or end-to-end flows.
  - Main already contains [`docs/auth-profile-link-review-20261026.md`](auth-profile-link-review-20261026.md) and [`docs/shared-supabase-consumer-inventory-20261026.md`](shared-supabase-consumer-inventory-20261026.md). The new 2026-10-28 source review and manual test matrix are on [draft PR #5](https://github.com/romrawinitt20/Dumri/pull/5), head SHA `80e799e37bd7455d895d794e1d2941bed6d425e2`; PR #5 is open, draft, and unmerged, so these additions are not part of `main`.
- What actually passed:
  - The main-branch build workflow passed on SHA `1162a23478c919910b66896b785812a9f1dc2cd1` in run #40510932200.
  - The prior Auth/profile review and shared-client inventory are present on `main`; the 28 October review has been prepared on the draft documentation branch.
  - This review made no production Supabase/Auth/Storage/permission/account/data changes and did not merge a PR.
- Not passed / blocked:
  - No repeatable SMS/email OTP registration, confirmed-phone-to-profile linkage, mismatched-phone/UID negative test, duplicate-registration test, protected-route role-isolation test, RLS/RPC authorization test, or end-to-end customer/merchant/rider journey is evidenced as executed.
  - The source/SQL review identifies reliance on client-editable metadata and missing server-side confirmation/canonical-identity checks in the reviewed registration path. Treat this as a high-priority unresolved security/integrity risk until isolated tests and an approved remediation demonstrate otherwise.
  - No isolated staging environment is available in the inspected evidence; runtime tests against the only shared/live Supabase project were not run. The reported Supabase Dashboard “connection refused” issue also remains unverified by CI.
- Impact on 20 November 2026 target: **Yellow with schedule risk**. A testable MVP is not yet evidenced. Authentication/profile linkage remains on the critical path; the target is not declared missed at this checkpoint. If this blocker remains by 6 November, follow the plan and reduce scope/reassess rather than weakening security.
- Next actions:
  1. On 29 October, continue the read-only owner/staff/area-admin and MFA/AAL2 review; map owner-only versus staff-permission RPCs and bootstrap/recovery risks without changing accounts or production settings.
  2. Keep PR #5 draft/unmerged until reviewed; use an isolated staging project with disposable identities for positive and negative tests before treating Auth/profile linkage as accepted.
  3. Keep remediation as a proposal until exact SQL, impact, rollback, cross-consumer impact, and explicit owner approval are available.
- Scope guardrail: no production changes, no account/data changes, no PR merge, no Midnight Meals work, and no Supabase region change.


## Daily scorecard — 2026-10-29

- Date and target deliverable: Thursday 29 October — read-only owner/admin and MFA/AAL2 review; distinguish owner-only from staff permission RPCs and record bootstrap/call-path risks.
- Status: **Yellow**. The read-only catalog inventory and a first direct-guard/trigger trace are documented on draft PR #5, but the trace is not complete and no runtime authorization/MFA tests were run. The new inventory is on the PR branch, not on `main`; no PR was merged.
- Evidence snapshot:
  - Main HEAD before this scorecard update: [`f7f01033285643146dd37a5b2a44cb0cc01fb816`](https://github.com/romrawinitt20/Dumri/commit/f7f01033285643146dd37a5b2a44cb0cc01fb816), which added the 28 October scorecard.
  - Main build workflow: [run #40685800730](https://github.com/romrawinitt20/Dumri/actions/runs/40685800730) — job `build` completed successfully, including dependency installation and `npm run build`, on the recorded main checkpoint. This is build evidence only.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) only installs dependencies and runs `npm run build`; [`package.json`](../package.json) has no test script. No OTP, RLS/RPC authorization, MFA/AAL2, or end-to-end result is evidenced by this CI.
  - Read-only inventory and follow-up trace are on [draft PR #5](https://github.com/romrawinitt20/Dumri/pull/5), branch `docs/auth-profile-test-matrix-20261028`, head SHA [`d74b79a5c4e523211150e6440e74564d9eb9df29`](https://github.com/romrawinitt20/Dumri/commit/d74b79a5c4e523211150e6440e74564d9eb9df29). The inventory records 95 `public` SECURITY DEFINER functions; all 95 have function-level `search_path`; 84 have explicit `authenticated` EXECUTE grants, 0 explicit `anon` EXECUTE grants, and 95 `service_role` grants. These are catalog observations, not proof of effective authorization.
  - The same read-only review found 0/95 function bodies with textual AAL2/AAL/auth.jwt checks. This scan does not imply every function needs MFA; trigger functions are not session RPCs. Shared owner/admin guard behavior and four trigger bindings are recorded, but nested/dynamic call paths and data-scope rules remain incomplete.
  - Security Advisor snapshot recorded in the inventory: 17 RLS-enabled tables without policies (INFO), 84 authenticated-callable SECURITY DEFINER functions (WARN), and leaked-password protection disabled (WARN). These are triage signals, not automatically exploitable findings.
  - The available commit-specific workflow lookup returned no PR-triggered workflow runs for head SHA `d74b79a5c4e523211150e6440e74564d9eb9df29`; this lookup is limited to PR-triggered runs and is not proof that no other check exists.
- What actually passed:
  - Read-only catalog/grant inventory and an initial direct caller/trigger trace were recorded on the draft documentation branch.
  - The referenced main build job completed successfully.
  - No function was invoked to test behavior; no production code, database, Auth, Storage, grants, policies, accounts, permissions, or configuration was changed.
- Not passed / blocked:
  - Runtime tests for owner AAL1 deny/AAL2 allow, staff least privilege, revoked/inactive admin denial, cross-scope access, direct RPC bypass, RLS, OTP/profile linkage, and end-to-end journeys remain **BLOCKED / NOT RUN**.
  - Full transitive/dynamic-SQL call-path tracing, effective privilege analysis, and per-function record/geographic scope validation remain incomplete.
  - No isolated staging project is available in the inspected evidence; do not use the shared/live project for negative authorization tests.
- Impact on 20 November 2026 target: **Yellow with schedule risk**. A testable MVP is not yet evidenced. Owner/admin authorization and Auth/profile integrity remain foundation gates; if the auth/authorization blocker remains on 6 November, reduce scope and reassess rather than weakening security.
- Next actions:
  1. Complete the highest-risk nested caller and table/record/geographic-scope trace, including finance, payment verification, refunds, user verification, and owner-only operations.
  2. Establish an isolated staging environment with disposable identities, then execute and retain repeatable positive/negative test evidence; do not probe production.
  3. Keep remediation as a proposal until exact SQL, consumer impact, rollback, staging results, and explicit owner approval are available.
- Scope guardrail: no production Supabase/Auth/Storage/permission changes, no account/data changes, no PR merge, no Midnight Meals work, and no Supabase region change.

## Daily scorecard — 2026-10-30

- Date and target deliverable: Friday 30 October — RLS and sensitive-field audit; produce a prioritized table/column/function matrix for identity, bank, payment, wallet, and complaints, separating direct table/column grants from RPC authorization.
- Status: **Yellow**. Main contains useful read-only audit artifacts dated 26 October, but this review found no new 30 October audit commit or consolidated matrix. The prior artifacts partially cover the planned areas; they do not establish that all required tables, sensitive columns, direct grants, RPC paths, and role scopes have been reconciled. No new live Supabase query or runtime test was performed in this review.
- Evidence snapshot:
  - Main HEAD at the start of this review: [`a2e5b3391c0c54c3a9787a4604efc2e69e030836`](https://github.com/romrawinitt20/Dumri/commit/a2e5b3391c0c54c3a9787a4604efc2e69e030836), commit message `docs: add Dumri Oct 29 daily scorecard`.
  - Main workflow run [#40874705580](https://github.com/romrawinitt20/Dumri/actions/runs/40874705580) is `push` on `main` at that SHA and completed with conclusion `success`. Job `build` completed checkout, Node.js setup, dependency installation, and `npm run build`. This is build evidence only.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs dependency installation and `npm run build` only. [`package.json`](../package.json) has no test script. No RLS, direct-grant, RPC authorization, Storage, OTP, or end-to-end test is evidenced by this CI.
  - Existing main-branch read-only artifacts include [`docs/rls-sensitive-column-audit-20261026.md`](rls-sensitive-column-audit-20261026.md), [`docs/payment-slip-storage-policy-review-20261026.md`](payment-slip-storage-policy-review-20261026.md), [`docs/order-payment-security-review-20261026.md`](order-payment-security-review-20261026.md), [`docs/function-authorization-audit-20261026.md`](function-authorization-audit-20261026.md), [`docs/admin-area-scope-security-gates-20261026.md`](admin-area-scope-security-gates-20261026.md), and [`docs/supabase-security-advisor-triage-20261026.md`](supabase-security-advisor-triage-20261026.md). These are dated 26 October and are evidence of prior review, not a fresh 30 October live audit.
  - The 26 October RLS/column review records that `merchant_profiles` had table SELECT privileges for `anon` and `authenticated`, including bank columns, and `authenticated` had UPDATE privileges on `bank_name` and `bank_account`. This is a historical catalog observation; it was not re-queried on 30 October and no actual row extraction or unauthorized update was attempted.
  - The same prior review identifies sensitive fields in `rider_profiles`, finance/wallet tables with RLS but no policies, and payment/admin policy patterns needing per-role tests. The Storage review records a private `payment-slips` bucket but leaves the scope of the generic admin read path unverified. The function review records RPC authorization questions for order, payment, refund, complaint, and finance operations. These are review leads, not confirmed runtime failures.
  - PR #5 remains open, draft, and unmerged; its head is `d74b79a5c4e523211150e6440e74564d9eb9df29`. No combined status entries were returned for that head in this check. Do not treat PR-only documentation as merged into `main`.
- What actually passed:
  - The prior read-only review documents provide a useful starting inventory for merchant/rider identity and bank fields, payment-slip Storage, order/payment RPCs, wallet/finance tables, and admin/complaint authorization.
  - Main build run #40874705580 passed on the recorded main SHA.
  - This review did not change production Supabase, Auth, Storage, grants, policies, permissions, accounts, or data; no PR was merged.
- Not passed / blocked:
  - A single reconciled table/column/function matrix for identity, bank, payment, wallet, and complaints is not evidenced as completed for 30 October.
  - Current live effective privileges and policies were not re-queried in this run; the 26 October catalog observations must not be assumed unchanged.
  - Negative/positive runtime tests for anonymous and unrelated-user access to bank/identity fields, merchant/rider self-service, staff-vs-owner access to payment slips, wallet/refund/complaint RPCs, and direct RPC bypass remain **NOT RUN / NOT EVIDENCED**.
  - No isolated staging environment or disposable role-based test identities are evidenced. Do not perform these negative tests against the shared/live Supabase project.
- Impact on 20 November 2026 target: **Yellow with security and schedule risk**. The existing audits identify sensitive-data and authorization areas that must be resolved before the MVP can be accepted. The target is not declared missed, but a testable MVP is not yet evidenced. Keep the 6 November authentication/authorization checkpoint and the 17 November security/regression gate; do not weaken security to meet the date.
- Next actions:
  1. Consolidate the existing documents into one matrix with, for each table/column/RPC: data sensitivity, direct `anon`/`authenticated` grants, RLS policy, function EXECUTE grant, server-side guard, intended roles/scope, and required allow/deny tests. Mark the source date for every live observation.
  2. Prioritize merchant/rider bank and identity data, payment slips, wallet/finance, refunds, and complaints. Reconcile direct table/column access separately from RPC and Storage authorization.
  3. Obtain an isolated staging database and disposable identities before running positive/negative tests; any production mitigation remains a proposal until exact SQL, cross-consumer impact, rollback, staging evidence, and explicit owner approval are available.
  4. Extend CI with focused automated tests only after a safe test database and repeatable fixtures exist; keep build success separate from security acceptance.
- Scope guardrail: no production Supabase/Auth/Storage/grant/policy/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-10-31

- Date and target deliverable: Saturday 31 October — document payment-slip Storage policies, Edge Function presence/behavior, and a role-based security test plan.
- Status: **Yellow**. The main branch contains a prior read-only Storage policy review and a manual negative-test checklist, but no new 31 October implementation/test artifact is present. The admin-role semantics remain unresolved, no Edge Function source was found in the checked main-branch repository tree, and no Storage/Edge Function runtime test evidence was found. This is partial preparation, not acceptance.
- Evidence snapshot:
  - Main HEAD before this scorecard update: [`f2f9416937751621799bac020aaab4b10fd3d1d4`](https://github.com/romrawinitt20/Dumri/commit/f2f9416937751621799bac020aaab4b10fd3d1d4), commit message `docs: add Dumri Oct 30 RLS audit scorecard`, dated 2026-10-30T12:21:52Z. Its only changed file was this daily execution plan.
  - Latest main workflow at that checkpoint: [run #41054779430](https://github.com/romrawinitt20/Dumri/actions/runs/41054779430), event `push`, branch `main`, head SHA `f2f9416937751621799bac020aaab4b10fd3d1d4`, conclusion `success`. Job `build` completed checkout, Node.js 22 setup, dependency installation, and `npm run build`. This is build evidence only.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) has one `build` job; it installs dependencies and runs `npm run build`. [`package.json`](../package.json) has no test script. The recursive main-branch tree contains no test/spec files, no `supabase/functions` directory, and no Edge Function source file. This repository observation does not establish whether any function is deployed outside this repository.
  - Existing [payment-slip Storage review](payment-slip-storage-policy-review-20261026.md) records a private `payment-slips` bucket, 10 MiB maximum, JPEG/PNG/PDF allowlist, customer path/order-bound INSERT, and SELECT for the user's path or `fn_my_role() = 'admin'`; no UPDATE/DELETE policy was observed. The review explicitly leaves the exact admin-role scope unresolved.
  - [Storage admin-role follow-up](payment-slip-admin-role-followup-20261026.md) confirms the `admin` enum and `admin_profiles` metadata exist, but the function body for `fn_my_role()` could not be verified; therefore global slip-read access cannot be certified as Super Admin-only.
  - [Manual Auth/Storage/demo checklist](manual-auth-and-demo-test-checklist.md) enumerates cross-customer read/upload, path tampering, overwrite/delete, invalid-order, MIME/size, and admin-scope tests as required but not yet run. It also says disposable accounts/orders and owner approval are required before creating test records.
  - Main has no newer commit than the 30 October checkpoint at the start of this review. Open PRs remain draft/unmerged; PR-only material is not counted as main-branch evidence.
- What actually passed:
  - Read-only inspection confirmed the main-branch file tree, existing Storage review/checklist, CI definition, package scripts, and latest workflow result.
  - The latest main build workflow passed on SHA `f2f9416937751621799bac020aaab4b10fd3d1d4` in run #41054779430.
  - No Storage object, Auth user, production row, policy, grant, permission, or project setting was changed; no PR was merged.
- Not passed / blocked:
  - No repeatable Storage allow/deny test was executed with two disposable customers and dummy orders/files.
  - The `fn_my_role()` body and exact active-owner/staff semantics remain unverified; do not assume every `admin` role is a Super Admin.
  - No Edge Function source or test was found in the checked main repository. Deployment-side inventory remains unverified.
  - No automated test suite runs in CI; build success does not validate Storage, Auth, RLS/RPC, or role isolation.
  - No isolated staging project and approved disposable Storage fixtures are evidenced; do not run negative tests against the shared/live project.
- Impact on 20 November 2026 target: **Yellow with security/schedule risk**. The target is not declared missed, but Storage authorization and role isolation are not accepted, and the planned 31 October deliverable is only partially evidenced. The 6 November Auth/authorization checkpoint is six days away; if foundation blockers remain then, reduce scope and reassess as required by the plan rather than weakening security.
- Next actions:
  1. Establish an isolated staging database/project and disposable customer/admin identities plus dummy orders/files before any write/deny tests; confirm cloud-branch cost or use local Supabase CLI/Docker without changing production.
  2. Verify the full `fn_my_role()` definition and active admin-level checks through a supported read-only source in staging; map the intended Super Admin versus staff access to payment slips.
  3. Execute and record the Storage matrix in staging: valid own upload/read; cross-user read/upload denial; malformed or ineligible order path denial; overwrite/delete behavior; MIME/size rejection; and Super Admin versus staff access.
  4. Inventory deployed Edge Functions separately from repository source. If none exist, record that explicitly; if any exist, inspect their auth checks, secrets handling, CORS, and error paths without invoking production mutations.
  5. Add automated tests to CI only after a safe test database and repeatable fixtures are available.
- Scope guardrail: no production Supabase/Auth/Storage/grant/policy/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-11-01

- Date and target deliverable: Sunday 1 November — core app architecture freeze: confirm the current route map, role/status states, data-ownership boundaries visible in source, and explicit MVP/demo exclusions without inventing unresolved rules.
- Status: **Yellow**. The existing source is sufficient to document the current thin application shell and demo boundaries, but it does not yet establish a complete role-based architecture or end-to-end MVP. The route map is observable; role-specific routing and client-side role/status gating are not present in the inspected route guard. Persisted order ownership is described in older read-only database/RPC reviews, but is not end-to-end evidenced in the current client routes or runtime tests.
- Evidence snapshot:
  - Main HEAD at start of review: [`7b4409a1933d066bbceb267c02b76342508c01d6`](https://github.com/romrawinitt20/Dumri/commit/7b4409a1933d066bbceb267c02b76342508c01d6), commit message `docs: add Dumri Oct 31 Storage security scorecard`, created 2026-10-31T12:21:47Z. The commit diff changes this daily execution plan only.
  - Latest verified main workflow at the start of review: [run #41200763300](https://github.com/romrawinitt20/Dumri/actions/runs/41200763300), associated with main SHA `7b4409a1933d066bbceb267c02b76342508c01d6`; job `build` and all listed steps completed with conclusion `success`. It installs dependencies and runs `npm run build`; this is build/type-check evidence only, not auth/security/E2E acceptance.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) has one `build` job on pull requests to main and pushes to main or `setup/**`. [`package.json`](../package.json) exposes `build: tsc -b && vite build` but no `test` script.
  - Route map from [`src/App.tsx`](../src/App.tsx), [`src/main.tsx`](../src/main.tsx), and [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx): `/login`, `/register`, `/verify-phone`, and protected `/dashboard`; public `/demo` and `/demo/payouts`; `/` redirects according to configuration/session/phone-confirmation; unknown paths redirect to `/`. `AuthProvider` wraps the router app.
  - Current route guard checks Supabase configuration, loading, signed-in user, and `phone_confirmed_at`. It does **not** load/check profile role or status before rendering the protected outlet. There are no separate customer, merchant, rider, staff-admin, or owner-admin routes in the inspected App route map.
  - [`src/pages/RegisterPage.tsx`](../src/pages/RegisterPage.tsx) offers signup choices customer/merchant/rider and writes name/phone/role into Auth user metadata before SMS OTP. [`src/pages/VerifyPhonePage.tsx`](../src/pages/VerifyPhonePage.tsx) verifies SMS OTP and relies on transient router state for mode/phone/name/role; refresh/direct navigation loses that state and shows a restart error. [`src/auth/ensureCustomerProfile.ts`](../src/auth/ensureCustomerProfile.ts) reads role/name/phone from user metadata and calls `fn_register_profile` after the client-side confirmed-phone check. The existing read-only review identifies this metadata trust as needing server-side validation; no remediation is applied.
  - [`src/pages/DashboardPage.tsx`](../src/pages/DashboardPage.tsx) reads the signed-in user's profile via `fn_my_profile` and displays role/status. Its current UI types are roles customer/merchant/rider/admin and statuses pending/active/suspended/banned. It explicitly states that the UI role is display-only and real actions require server-side authorization. No `rejected` status or separate owner/staff/area-admin state is represented in this page.
  - Data-ownership evidence is partial across layers: dashboard profile data is obtained through `fn_my_profile` and registration invokes `fn_register_profile`; the current demo order is held in React component state with static sample shops and is lost on refresh, while the payout demo is also in-memory. The 26 October read-only database reviews describe backend ownership checks for order creation, cancellation, payment submission, merchant/rider workflow, and order detail (`docs/order-payment-security-review-20261026.md` and `docs/function-authorization-audit-20261026.md`); `docs/admin-area-scope-security-gates-20261026.md` records merchant/rider IDs on orders but no canonical district ID. These are static review findings, not runtime test evidence, and they do not prove the current client routes are integrated with those workflows or that all data domains are correctly scoped.
  - MVP/demo exclusions are explicit in [`src/pages/DemoPage.tsx`](../src/pages/DemoPage.tsx) and [`src/pages/PayoutDemoPage.tsx`](../src/pages/PayoutDemoPage.tsx): no persisted order/database write, real payment/transfer, real rider assignment, map, SMS in the demo, actual slip upload, or real email. The actual integrated app routes currently amount to an Auth/profile shell plus these separate demos; do not count demo completion as backend workflow acceptance.
  - Open PRs #3, #4, and #5 are not merged; PR #4's email-OTP changes and PR #5's test matrix are not part of main evidence. The main source inspected still uses phone/SMS OTP.
- What actually passed:
  - Read-only source inspection established the current route map, session wrapper, current role/status types, profile RPC entry points, and the in-memory-only boundaries of the order/payout demos.
  - Main build workflow run #41200763300 completed successfully on SHA `7b4409a1933d066bbceb267c02b76342508c01d6`.
  - This review and scorecard update did not change production Supabase, Auth, Storage, grants, RLS, permissions, accounts, or data; no PR was merged and no Midnight Meals work was performed.
- Not passed / blocked:
  - No runtime tests were executed for session restore, sign-out, OTP, route refresh, profile linkage, role/status access, or data ownership.
  - No automated unit/integration/E2E tests are configured in the inspected CI; `npm run build` is the only job command.
  - Role-specific route authorization and pending/rejected/suspended account workflow enforcement are not evidenced in the client route guard. Server-side enforcement must be tested separately; the current UI must not be treated as its substitute.
  - The current Auth/profile registration flow still relies on client-editable metadata before calling the registration RPC; the hardening proposal remains draft-only and untested in staging.
  - The inspected main client routes do not yet expose a complete integrated customer browse/cart/order, merchant order, rider delivery, payment, wallet, or admin journey. Read-only database/RPC reviews describe some backend functions and ownership checks, but no runtime/E2E evidence proves these are wired into the current UI and work together. Demo pages are not persistent backend workflows.
  - No isolated staging environment and disposable role-based test identities are evidenced; do not run write/deny tests against the shared/live project.
- Impact on 20 November 2026 target: **Yellow with rising schedule risk**. The architecture snapshot is documented, but the planned freeze is only partial because data ownership and role boundaries for integrated workflows remain unresolved/unimplemented. The 6 November Auth/authorization checkpoint is five days away. If those blockers remain at that gate, reduce MVP scope and reassess the forecast as required by the plan; do not weaken security to preserve the date.
- Next actions:
  1. Owner review: confirm whether the route map and MVP exclusions above match the intended first testable release; unresolved merchant/rider/admin route and approval details must remain explicitly open until decided.
  2. Keep Auth/session work on main's current SMS path until the email-OTP PR is reviewed and approved; first create a safe isolated staging/test path and run disposable-account OTP/profile linkage tests. Do not change production Auth.
  3. Define an ownership matrix for users/profiles, shops, menus, orders, order items, rider assignments, payments/slips, wallets, and admin scopes from the existing schema/RPCs before implementing role dashboards.
  4. Add role/status route tests only after server-side authorization and safe staging fixtures are available; test signed-out, unconfirmed, pending, suspended, banned, customer, merchant, rider, staff-admin, and owner-admin cases.
  5. Keep demo order/payout flows clearly labeled as simulations until persistent database behavior, payment simulation, idempotency, and audit evidence exist.
- Scope guardrail: no production Supabase/Auth/Storage/grant/policy/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-11-02

- Date and target deliverable: Monday 2 November — Auth/session behavior: review loading, session restore, sign-out, and OTP error handling; acceptance requires a successful build and focused repeatable tests.
- Status: **Yellow**. Static source inspection confirms that several basic session and UI error-handling paths are present, and the current main build workflow passes. However, the planned focused runtime/automated tests are not present or evidenced, so today's acceptance criteria are only partially met. No application code was changed during this review.
- Evidence snapshot:
  - Main HEAD inspected: [`9152c6d59d89b8a3d2e9efec36b1f82f754f8398`](https://github.com/romrawinitt20/Dumri/commit/9152c6d59d89b8a3d2e9efec36b1f82f754f8398), commit message `docs: clarify Dumri architecture scorecard data ownership evidence`, created 2026-11-01T12:46:39Z. Its diff changes this tracking document only; no new main commit was present on 2026-11-02 at review time.
  - Latest main workflow for that exact SHA: [Dumri CI run #41308089400](https://github.com/romrawinitt20/Dumri/actions/runs/41308089400), event `push`, branch `main`, conclusion `success`. Job `build` completed checkout, Node.js 22 setup, dependency installation, and `npm run build` successfully.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) contains only the `build` job; [`package.json`](../package.json) has `build: tsc -b && vite build` but no `test` script. The recursive main tree contains no test/spec files or test directory.
  - [`src/auth/AuthProvider.tsx`](../src/auth/AuthProvider.tsx) calls `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, maintains an initial loading state, and exposes `signOut()`. [`src/App.tsx`](../src/App.tsx) and [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx) show loading states and redirect signed-out or unconfirmed sessions.
  - [`src/pages/LoginPage.tsx`](../src/pages/LoginPage.tsx) and [`src/pages/RegisterPage.tsx`](../src/pages/RegisterPage.tsx) validate phone input, show request errors, and expose busy states. [`src/pages/VerifyPhonePage.tsx`](../src/pages/VerifyPhonePage.tsx) handles OTP verification/resend errors and busy states; [`src/pages/DashboardPage.tsx`](../src/pages/DashboardPage.tsx) catches sign-out errors.
  - PR #4 (email OTP) and PR #5 (Auth/profile test matrix) remain open Draft PRs and are not part of main. Main continues to use the SMS OTP path.
- What actually passed:
  - Static source inspection confirmed the session restore/listener/loading/sign-out code paths and user-visible OTP request/verification error handling described above.
  - Main build passed on the exact inspected SHA in workflow run #41308089400. This is build/type-check evidence only.
  - No production Supabase/Auth/Storage/permission, account, or data changes were made; no PR was merged.
- Not passed / blocked:
  - No runtime test evidence for session restoration after refresh, sign-out followed by protected-route redirect, OTP success/failure/expiry/resend, network/provider errors, or verification-page refresh was found.
  - `VerifyPhonePage` depends on transient React Router `location.state` for phone and mode; direct navigation or refresh loses this state and the page asks the user to restart. This remains a source-level limitation, not a runtime test result.
  - `AuthProvider` logs a `getSession()` error to the console but has no dedicated user-visible session-load error state.
  - CI does not run unit/integration/E2E tests; the main tree has no test/spec files. No isolated staging test evidence or disposable OTP test identity is recorded.
- Impact on 20 November 2026 target: **Yellow with rising schedule risk**. Authentication remains a foundation dependency and the 6 November auth/authorization scope gate is four days away. If repeatable Auth/profile/authorization tests and a safe test environment are still unavailable at that gate, reduce MVP scope and reassess the forecast as required by this plan; do not weaken security or test against the shared/live project.
- Next actions:
  1. Establish an isolated test target (local Supabase CLI/Docker or an explicitly cost-approved isolated staging project) with disposable identities; do not use production accounts or data.
  2. Add focused tests for session restore, loading/error behavior, sign-out, protected-route redirects, and OTP success/failure/resend using a controlled test harness; wire them into CI before claiming acceptance.
  3. Resolve the verification-page state-loss behavior and decide how session-load failures should be surfaced, then verify both with repeatable tests.
  4. Keep PR #4 and PR #5 draft/unmerged until reviewed and tested against the intended base; do not treat their contents as main functionality.
- Scope guardrail: no production Supabase/Auth/Storage/grant/RLS/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-11-03

- Date and target deliverable: Tuesday 3 November — registration/profile linkage. Acceptance requires the profile to be bound to the authenticated identity and a server-trusted confirmed phone, with repeatable duplicate, mismatched-phone, expired/unconfirmed, unauthenticated, and existing-profile tests.
- Status: **Yellow (high schedule risk)**. The current main source still has the previously identified client-metadata trust and server-side phone-validation gaps. The hardening proposal remains documentation only; no implementation or runtime acceptance evidence was found for this date.
- Evidence snapshot:
  - Main HEAD at start of review: [`0b3444833c0ca4f5d6717c97da410a2f7308d0d9`](https://github.com/romrawinitt20/Dumri/commit/0b3444833c0ca4f5d6717c97da410a2f7308d0d9), commit message `docs: add Dumri Nov 2 auth session scorecard`, created 2026-11-02T12:47:30Z. The commit diff changes only `docs/daily-execution-plan-20261026-to-20261120.md`; no application source or migration changed in that commit.
  - Latest verified main workflow at review start: [Dumri CI run #41447571963](https://github.com/romrawinitt20/Dumri/actions/runs/41447571963), event `push`, branch `main`, exact SHA `0b3444833c0ca4f5d6717c97da410a2f7308d0d9`, conclusion `success`. Its only job, `build`, completed checkout, Node.js 22 setup, dependency installation, and `npm run build` successfully.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs only dependency installation and `npm run build`; [`package.json`](../package.json) defines `build: tsc -b && vite build` and has no test script. The recursive main tree contains no SQL migration files and no test/spec files or test directory.
  - [`src/pages/RegisterPage.tsx`](../src/pages/RegisterPage.tsx) sends SMS OTP and places `full_name`, `phone`, and the selected `role` in Auth user metadata. [`src/pages/VerifyPhonePage.tsx`](../src/pages/VerifyPhonePage.tsx) verifies the SMS OTP, then calls `ensureUserProfile`. [`src/auth/ensureCustomerProfile.ts`](../src/auth/ensureCustomerProfile.ts) checks `phone_confirmed_at` in the client, reads role/name/phone from mutable `user_metadata`, and passes those values to `fn_register_profile` after `fn_my_profile` returns no profile.
  - [`docs/auth-profile-link-review-20261026.md`](auth-profile-link-review-20261026.md) records the prior read-only database review: `fn_register_profile` accepts caller-supplied phone and does not itself bind that value to the Auth user's confirmed phone; `users.auth_uid` has a UNIQUE constraint, but the reviewed function was not idempotent for repeated calls. These are prior inspection findings, not a fresh live database query on 3 November.
  - [`docs/proposed-auth-profile-hardening-20261026.md`](proposed-auth-profile-hardening-20261026.md) is explicitly a draft proposal and has not been applied. Its prerequisite is to verify the real phone-OTP flow with a new disposable account in isolated staging. The earlier read-only snapshot found 9 existing linked test accounts with null Auth phone/confirmation fields; the owner confirmed those accounts were created for testing, so they are not treated as production customer defects and must not be rewritten.
  - PR #5 remains open and Draft; its description says it is a test plan and no tests are claimed as executed. PR #4's email-OTP proposal is also not merged and is not the active main flow. Neither PR is counted as main functionality.
  - The GitHub branch API reports `main` is not protected and required status-check enforcement is off. The successful build is evidence for the inspected SHA, but it is not currently a branch-protection gate.
- What actually passed:
  - Read-only source inspection mapped the current registration → SMS OTP verification → profile lookup/registration caller sequence and confirmed the exact metadata fields passed by the client.
  - The build-only main workflow completed successfully on exact SHA `0b3444833c0ca4f5d6717c97da410a2f7308d0d9` in run #41447571963.
  - No production Supabase/Auth/Storage/grant/RLS/permission changes, account changes, or data changes were made; no PR was merged and no Midnight Meals work was performed.
- Not passed / blocked:
  - No disposable new-account OTP run or read-only post-verification check of `auth.users.phone` and `phone_confirmed_at` was executed on 3 November.
  - No runtime tests were executed for mismatched Auth phone vs RPC phone, tampered metadata, unconfirmed/expired phone, unauthenticated registration, admin-role rejection, duplicate/concurrent registration, existing-profile preservation, or merchant/rider pending status.
  - The server-side identity/phone hardening proposal remains unapplied and untested in staging. Do not deploy it based solely on the draft SQL; first verify the Auth provider behavior and the exact live function signature, grants, constraints, and caller compatibility in an isolated environment.
  - No focused tests are configured in CI. The successful build does not establish profile-linkage or authorization acceptance.
- Impact on 20 November 2026 target: **Yellow with high schedule risk**. The 6 November auth/authorization scope gate is three days away. If a safe staging path and repeatable profile-linkage/negative tests are still unavailable at that gate, reduce MVP scope and reassess the forecast as required by the plan; do not weaken server-side identity checks or test against the shared/live project.
- Next actions:
  1. Establish an isolated test target (local Supabase CLI/Docker or an explicitly cost-approved separate staging project) and create one disposable phone-OTP identity only there.
  2. After successful OTP, verify through read-only staging inspection that `auth.users.phone` and `phone_confirmed_at` are populated; record only a test label and outcome, never OTPs or tokens.
  3. In staging, inspect the exact `fn_register_profile` signature, body, owner, EXECUTE grants, relevant constraints, and all callers; validate the draft's named-argument compatibility before preparing a migration.
  4. Run repeatable allow/deny tests for canonical-phone mismatch, metadata tampering, unconfirmed/unauthenticated callers, admin role, duplicate/concurrent calls, existing-profile preservation, and pending merchant/rider status. Capture database and application results.
  5. Add focused tests to CI only after a safe isolated test harness and disposable fixtures are reproducible. Keep the proposal and PRs draft/unmerged pending owner review.
- Scope guardrail: no production Supabase/Auth/Storage/grant/policy/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-11-04

- Date and target deliverable: Wednesday 4 November — protected routes and approval states. Acceptance requires role-specific access for customer/merchant/rider/admin to be tested, and pending/rejected/disabled accounts to be unable to use approved workflows.
- Status: **Yellow (high schedule risk)**. The current main source provides a single authenticated/phone-confirmed gate around `/dashboard`, but it does not enforce role- or profile-status-specific routes. The planned allow/deny tests are not present in the repository or CI and were not run. This is a source-level review, not runtime acceptance.
- Evidence snapshot:
  - Main HEAD at start of review: [`bf255d8ddc235e483f05f8e45fc6811351cf1f7b`](https://github.com/romrawinitt20/Dumri/commit/bf255d8ddc235e483f05f8e45fc6811351cf1f7b), commit message `docs: add Dumri Nov 3 profile-linkage scorecard`, dated 2026-11-03T12:20:18Z. Its only changed file was this daily execution plan; no application source changed in that commit.
  - Latest main workflow at review time: [Dumri CI run #41634860918](https://github.com/romrawinitt20/Dumri/actions/runs/41634860918), event `push`, branch `main`, exact head SHA `bf255d8ddc235e483f05f8e45fc6811351cf1f7b`, conclusion `success`. Job `build` completed checkout, Node.js 22 setup, dependency installation, and `npm run build`. This is build/type-check evidence only, not role/approval-state test evidence.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) contains one `build` job and runs `npm install --no-audit --no-fund` followed by `npm run build`. [`package.json`](../package.json) has `build: tsc -b && vite build` but no `test` script. The recursive `main` tree contains no test/spec files or test directory.
  - Route map from [`src/App.tsx`](../src/App.tsx): public `/demo` and `/demo/payouts`; `/login`, `/register`, and `/verify-phone`; the only route wrapped in `ProtectedRoute` is `/dashboard`. No distinct customer, merchant, rider, staff-admin, or owner-admin route groups are defined.
  - [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx) checks Supabase configuration, loading, signed-in user, and `phone_confirmed_at`; it does not fetch/check the Dumri profile role or account status before rendering its outlet.
  - [`src/pages/DashboardPage.tsx`](../src/pages/DashboardPage.tsx) calls `fn_my_profile` and displays role/status. Its UI types include roles `customer/merchant/rider/admin` and statuses `pending/active/suspended/banned`. The page explicitly says role display is not authorization; it does not gate separate role workflows. The inspected UI does not model `rejected` or `disabled` states.
  - [`src/pages/RegisterPage.tsx`](../src/pages/RegisterPage.tsx) permits customer/merchant/rider signup and displays a notice that merchant/rider accounts require review. That notice is not proof that protected workflows are blocked server-side.
  - Open PRs #4 and #5 remain Draft and unmerged; their content is not part of `main` and is not counted as implementation or test evidence.
- What actually passed:
  - Read-only inspection established the current route map, the exact checks in `ProtectedRoute`, the profile fields/statuses displayed by the dashboard, and the CI workflow scope.
  - The build-only main workflow completed successfully on exact SHA `bf255d8ddc235e483f05f8e45fc6811351cf1f7b` in run #41634860918.
  - No production Supabase/Auth/Storage/grant/RLS/permission changes, account/data changes, or application source changes were made; no PR was merged and no Midnight Meals work was performed.
- Not passed / blocked:
  - No runtime allow/deny tests were executed for signed-out, unconfirmed, customer, merchant, rider, admin, pending, rejected, disabled, suspended, or banned accounts.
  - No role-specific route tests or server-side workflow authorization tests are present in the checked repository/CI.
  - Pending merchant/rider approval is communicated in UI text, but the current route guard does not enforce profile status. The actual enforcement of each backend RPC must be verified separately in isolated staging.
  - `rejected` and `disabled` are acceptance states in today's plan but are not represented in the inspected dashboard status union; the intended persisted status model and resubmission behavior need an explicit owner/product decision rather than an invented mapping.
  - No isolated staging/local test target or disposable role-based identities are evidenced. No negative tests were run against the shared/live Supabase project.
- Impact on 20 November 2026 target: **Yellow with high schedule risk**. The 6 November authentication/authorization scope gate is two days away. Role/status enforcement and registration/profile linkage remain unaccepted, while the current CI only proves the app builds. If a safe test target and repeatable auth/route allow-deny evidence are still unavailable at the 6 November gate, reduce MVP scope and reassess the forecast as required by the plan; do not weaken authorization to preserve the date.
- Next actions:
  1. Establish an isolated local Supabase CLI/Docker test target or an explicitly cost-approved staging project, with disposable identities for each role/status. Do not use the shared/live production project for negative tests.
  2. Define and approve the exact persisted meaning of `rejected` and `disabled`, including whether rejected merchant/rider applications may resubmit; do not silently map them to `pending` or `suspended`.
  3. Build an allow/deny matrix for signed-out, unconfirmed, customer, merchant, rider, staff-admin, owner-admin, pending, active, rejected, disabled, suspended, and banned states. Test both route behavior and server-side RPC authorization in staging.
  4. Add repeatable route/auth tests to CI only after fixtures and the isolated test target are reproducible; keep build success separate from security acceptance.
  5. At the 6 November gate, make an explicit scope/forecast decision if the above tests are still blocked.
- Scope guardrail: no production Supabase/Auth/Storage/grant/RLS/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.


## Daily scorecard — 2026-11-05

- Date and target deliverable: Thursday 5 November — owner/staff admin boundary. Acceptance requires the admin UI and server authorization design to align, owner-only operations to be denied to staff, and MFA/AAL2 gaps to be explicitly gated.
- Status: **Red (critical auth/authorization gate at risk)**. The design principles are documented, but the acceptance evidence is not present: there is no Admin/Owner/Staff admin page or route in the current app, owner email/password + TOTP is not implemented, the Auth provider/route guard do not evaluate MFA assurance, and no owner-vs-staff allow/deny runtime test or automated test exists. The 6 November scope gate is the next day. This is a schedule/acceptance status, not a claim that an exploit was demonstrated.
- Evidence snapshot:
  - Main HEAD at start of review: [`40f83471e8d006a9fe706fc5eb8ef7064c793b2c`](https://github.com/romrawinitt20/Dumri/commit/40f83471e8d006a9fe706fc5eb8ef7064c793b2c), commit message `docs: add Dumri Nov 4 protected-route scorecard`. The commit diff contains only `docs/daily-execution-plan-20261026-to-20261120.md`; no app source changed in that commit. No newer main commit was returned by the recent-commit check.
  - Latest main workflow at review: [Dumri CI run #41830764989](https://github.com/romrawinitt20/Dumri/actions/runs/41830764989), event `push`, branch `main`, exact head SHA `40f83471e8d006a9fe706fc5eb8ef7064c793b2c`, conclusion `success`. Job `build` completed checkout, Node.js 22 setup, dependency installation, and `npm run build`. This is build/type-check evidence only.
  - Effective workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) has one `build` job and no unit, integration, auth, RPC, MFA, or E2E test step. [`package.json`](../package.json) defines `build: tsc -b && vite build` and has no `test` script.
  - Current `src/pages` listing contains Dashboard, Demo, Login, Payout Demo, Register, Verify Email, and Verify Phone pages; it contains no Admin, Owner Admin, or Staff Admin page. `src/components` contains only `ProtectedRoute.tsx`. `src/App.tsx` has no separate admin routes; only `/dashboard` is wrapped by the current auth/phone-confirmation guard.
  - `src/auth/AuthProvider.tsx` restores the Supabase session and signs out, but has no MFA factor/AAL state or AAL2 gate. `ProtectedRoute.tsx` checks configuration, loading, signed-in user, and `phone_confirmed_at` only.
  - [`docs/owner-mfa-enforcement-review.md`](owner-mfa-enforcement-review.md) is a read-only review dated 2026-10-26. It records that login uses SMS OTP for all roles, owner email/password + TOTP is not implemented, and the inspected `fn_assert_owner()`, `fn_assert_admin()`, `fn_assert_admin_permission(text)`, and `fn_is_admin()` definitions had no JWT AAL2 check. These are prior read-only findings, not a fresh live-database query today.
  - [`docs/admin-area-scoped-permissions-design-20261026.md`](admin-area-scoped-permissions-design-20261026.md), [`docs/admin-area-permissions-migration-plan-20261026.md`](admin-area-permissions-migration-plan-20261026.md), and [`docs/admin-area-scope-security-gates-20261026.md`](admin-area-scope-security-gates-20261026.md) describe design and staging gates only; they explicitly do not represent an applied implementation or passed test matrix.
  - PR #4 (email OTP) and PR #5 (Auth/profile test matrix) remain open, Draft, and unmerged. Neither is counted as main implementation or test evidence.
  - The `main` branch API reports `protected: false`; CI is not configured as an enforced required status check.
- What actually passed:
  - Read-only repository inspection confirmed the absence of admin UI/routes in the current source tree and identified the current Auth/ProtectedRoute checks.
  - The documented admin design separates Super Admin management, functional permissions, geographic scope, and sensitive finance/document permissions; this is design evidence only.
  - Build-only CI completed successfully on exact main SHA `40f83471e8d006a9fe706fc5eb8ef7064c793b2c` in run #41830764989.
  - No production Supabase/Auth/Storage/grant/RLS/permission change, account/data change, PR merge, or Midnight Meals work was performed.
- Not passed / blocked:
  - No Admin/Owner/Staff Admin UI or dedicated admin route exists in the inspected main source tree.
  - Owner email/password login, TOTP enrollment/challenge, backup-factor flow, and AAL2-aware session state are not implemented.
  - Prior read-only findings show no AAL2 check in the inspected shared owner/admin guards; the complete transitive RPC inventory and runtime owner-vs-staff denial behavior remain unverified in an isolated test target.
  - No runtime evidence for staff denied from owner-only operations, owner at AAL1 denied, owner at AAL2 allowed, least-privilege staff permissions, inactive/revoked admin denial, or audit logging.
  - No isolated staging/local database test harness or disposable owner/staff identities is evidenced in the repository; no negative tests were run against the shared/live project.
  - CI remains build-only and does not enforce tests or a required check on `main`.
- Impact on 20 November 2026 target: **Red at the 5 November checkpoint for the auth/admin acceptance gate; the 20 November date is at risk, not yet declared impossible.** The 6 November rule in this plan requires a scope downgrade and forecast reassessment if authentication/authorization blockers remain. Only 15 calendar days remain after today; admin/MFA implementation and test evidence cannot be counted as complete based on design documents or build success.
- Next actions:
  1. At the 6 November gate, record a formal scope/forecast decision. Do not continue feature expansion while the auth/admin test environment is absent.
  2. Establish a local Supabase CLI + Docker environment or a separately cost-approved staging project, using synthetic disposable identities only; do not use the shared production project for negative tests.
  3. In that isolated environment, map every owner-only and staff-permission RPC plus wrapper/caller paths; test staff-denied/owner-AAL1-denied/owner-AAL2-allowed, inactive/revoked admin, and audit outcomes.
  4. Decide the minimum owner/admin UI required for the testable MVP and implement only after the authorization contract is reviewed; do not treat frontend menu hiding as security.
  5. Add repeatable auth/admin tests to CI and verify the exact workflow run on the resulting commit before changing the status to Green.
- Scope guardrail: no production Supabase/Auth/Storage/grant/RLS/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.

## Daily scorecard — 2026-11-06

- Date and target deliverable: Friday 6 November — automated auth/route tests. Acceptance requires CI to cover build, type checks, and repeatable core auth/route tests, with the exact workflow result recorded.
- Status: **Red (6 November authentication/authorization gate not met; 20 November target at risk)**. The current main branch has no test/spec files, no `test` script, no isolated Supabase test harness, and no auth/route test job. The only workflow job is build. No runtime auth, profile-linkage, route, role, owner/staff, or MFA test was executed. This is a failed acceptance gate, not a claim that a live exploit was demonstrated.
- Evidence snapshot:
  - Main HEAD at start of review: [`caf2a0a3799231f10ae2bdf980278fe5f2191c2e`](https://github.com/romrawinitt20/Dumri/commit/caf2a0a3799231f10ae2bdf980278fe5f2191c2e), commit message `docs: add Dumri Nov 5 owner-admin boundary scorecard`, committed 2026-11-05T12:29:25Z. The recent main commit list contains no commit dated 6 November; the Nov 5 commit changed only this execution-plan document.
  - Latest verified main workflow at review: [Dumri CI run #42027562027](https://github.com/romrawinitt20/Dumri/actions/runs/42027562027), event `push`, branch `main`, exact head SHA `caf2a0a3799231f10ae2bdf980278fe5f2191c2e`, conclusion `success`. Its single `build` job completed checkout, Node.js setup, dependency installation, and `npm run build`. This proves build/type-check completion only; it is not auth or route test evidence.
  - [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) contains one `build` job and no unit, integration, auth, RPC, MFA, or E2E test step. [`package.json`](../package.json) defines `build: tsc -b && vite build` and has no `test` script.
  - Recursive main tree at SHA `caf2a0a3799231f10ae2bdf980278fe5f2191c2e` contains 64 entries and no test/spec files or test directory. It has two SQL drafts under `docs/drafts/`, but no applied `supabase/migrations/` directory or isolated test configuration.
  - [`src/App.tsx`](../src/App.tsx) has public `/demo` and `/demo/payouts`, and only `/dashboard` is wrapped by `ProtectedRoute`; there are no role-specific or admin routes in the current route map.
  - [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx) checks Supabase configuration, loading, signed-in user, and `phone_confirmed_at`; it does not check Dumri profile role/status or MFA assurance.
  - [`src/auth/AuthProvider.tsx`](../src/auth/AuthProvider.tsx) restores the session and signs out but exposes no MFA factor or AAL state. [`src/pages/LoginPage.tsx`](../src/pages/LoginPage.tsx) uses phone SMS OTP; the owner email/password + TOTP flow is not present in this page.
  - PR #4 (`Use email OTP for Dumri auth testing`) and PR #5 (`isolated Auth/profile-link test matrix`) are still Open / Draft / Unmerged. They are not part of main and are not counted as implementation or executed tests.
  - GitHub branch API reports `main` is unprotected and required status-check enforcement is off.
- What actually passed:
  - Read-only inspection confirmed the current main commit, route map, AuthProvider, ProtectedRoute, LoginPage, workflow definition, package scripts, recursive repository tree, and PR states.
  - The build-only workflow completed successfully on exact SHA `caf2a0a3799231f10ae2bdf980278fe5f2191c2e` in run #42027562027; all steps in its only `build` job concluded `success`.
  - No production Supabase/Auth/Storage/grant/RLS/permission changes, account/data changes, PR merge, or Midnight Meals work was performed.
- Not passed / blocked:
  - The planned CI auth/route tests are absent; no repeatable test command or fixtures exist in the inspected main tree.
  - No isolated local Supabase CLI/Docker target or separately approved staging project is evidenced in main. No new disposable OTP identity or post-OTP Auth phone/confirmation inspection was performed.
  - No runtime evidence for confirmed-phone/profile binding, metadata tampering, unauthenticated registration, duplicate/concurrent profile creation, pending/rejected/disabled route denial, owner-vs-staff authorization, AAL1 denial/AAL2 allowance, or audit behavior.
  - Build success does not meet the 6 November acceptance criterion. The latest successful workflow is from 5 November and is build-only.
- Scope/forecast gate:
  - The plan's 6 November schedule-risk rule is triggered because authentication/authorization blockers remain. **Recommended action: freeze new feature expansion and re-baseline the 20 November MVP around only flows that can be implemented and repeatably tested with synthetic data and simulated payments.** Do not claim the broader role/admin/MFA/security acceptance as complete.
  - No product-scope change, production setting change, database migration, permission change, or account change was applied in this scorecard. The final MVP inclusion/defer decision and revised forecast remain owner decisions requiring explicit approval.
- Impact on 20 November 2026 target: **Red / at risk, not declared impossible.** Fourteen calendar days remain after 6 November. The current evidence does not support a claim that the app is a secure testable MVP; schedule recovery depends first on an isolated test target, a narrowed owner-approved scope, and repeatable auth/route acceptance tests.
- Next actions:
  1. Freeze feature expansion until the owner approves a scope/forecast re-baseline; keep production launch separate from the testable-MVP target.
  2. Establish Local Supabase CLI + Docker on a computer or a separately cost-approved staging project. Use synthetic disposable identities only; do not run negative tests against the shared production project.
  3. Add a minimal reproducible test harness for Auth/profile linkage and protected routes, then add CI steps for focused tests. Keep build and security acceptance as separate checks.
  4. Execute and capture allow/deny tests for signed-out/unconfirmed users, customer/merchant/rider states, pending/rejected/disabled accounts, staff vs owner, and owner AAL1/AAL2. Include the exact commit SHA, workflow run, and test output.
  5. Reforecast the remaining customer browse, cart/order, merchant, rider, promotion, simulated payment, commission, COD, and regression scope only after the auth foundation has repeatable test evidence.
- Scope guardrail: no production Supabase/Auth/Storage/grant/RLS/permission changes, no account/data changes, no PR merge, and no Midnight Meals work.
