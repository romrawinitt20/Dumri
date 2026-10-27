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
