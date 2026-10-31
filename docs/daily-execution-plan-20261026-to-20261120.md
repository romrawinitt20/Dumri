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
