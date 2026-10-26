# Dumri Delivery Roadmap — Target 2026-11-20

Date prepared: 2026-10-26  
Target date requested by owner: **2026-11-20**  
Repository: `romrawinitt20/Dumri`  
Working branch: `setup/supabase-auth-routes`  
Supabase project: `vdmqhgdcfsswinlilwyn`

## Team operating rules

- Treat the owner as the final decision-maker for product behavior and production-risk decisions. The assistant coordinates implementation, testing, documentation, and task sequencing; ask the owner when a product decision is genuinely required.
- Use the existing requirements recorded in project context; do not repeatedly ask questions already answered.
- No production database/Auth/Storage/permission changes, destructive operations, or PR merge without the owner's explicit approval after showing the exact change and impact.
- Do not put service-role/secret keys in frontend code, chat, repository, or `VITE_*` variables.
- The owner says the other app, Midnight Meals, is paused. Its deployed URL is not proof that it has no active users or background activity; keep it in the shared-Supabase compatibility inventory until checked.
- Do not claim the app is finished based on UI-only mockups. Mark each feature as implemented, tested, blocked, or awaiting owner decision.

## Known product requirements

- Initial target areas: Si That District and Tha Khantho, Thailand.
- One app supports customer, merchant, rider, and admin roles.
- Platform commission: 7% of each merchant's daily total sales; split platform share and tax reserve in end-of-day accounting.
- No paid restaurant ads; visibility should be based on proximity, reviews, and merchant-created promotions.
- Rider pay: THB 20 for the first 4 km, then +THB 3 per additional kilometre from 4.1 km onward.
- Incentive: only orders with total at least THB 100 qualify; monthly payout using the owner's rule of 2 qualifying orders per THB 1.
- Orders over THB 500 require bank transfer or a 50% deposit.
- For cash orders, the rider fronts the restaurant payment; the rider wallet debt to the platform is only the platform commission, not the full order amount.
- Merchant and rider onboarding require document review and approval. Sensitive ID, licence, and bank documents must remain private.
- Admin accounts are not publicly self-registered; owner and staff permissions are separate.
- Customer phone SMS OTP and owner email/password plus MFA are distinct authentication flows.
- Fraud/dispute controls and safe rider workflows are required.

## Current baseline

The repository README describes a starter, not a complete delivery platform. Current UI has basic authentication and a protected test dashboard. Customer/merchant/rider roles are illustrative UI and are not yet fully wired to database-backed authorization. Owner email/password MFA and server-side AAL2 enforcement are not implemented in the frontend baseline.

A read-only security review found two high-priority database privilege risks requiring cross-client analysis before a production fix:
1. Anonymous/authenticated SELECT access may expose merchant payout bank columns for rows allowed by RLS.
2. Authenticated merchants have direct UPDATE privileges on their bank fields, potentially without a re-verification transition.

The shared Supabase project is also used by Midnight Meals according to the project URL supplied by the owner. The app source/deployed query paths have not yet been inspected. No live database/Auth/Storage change has been made.

## Delivery phases

### Phase 0 — Freeze scope and baseline (Oct 26–27)
- [x] Record shared Supabase project and current high-priority findings.
- [x] Record Midnight Meals as a same-project client for impact planning.
- [ ] Confirm the target definition of "complete": testable MVP versus production launch.
- [ ] Inspect repository tree, existing schema/functions/RLS, build and CI status.
- [ ] Maintain a feature and risk register; do not change live database permissions during inventory.

### Phase 1 — Security and access design (Oct 27–31)
- [ ] Inventory all known consumers of the shared Supabase project, including Midnight Meals and any admin/automation/back-end clients.
- [ ] Map each role to allowed operations and sensitive fields.
- [ ] Review auth/profile linking, profile registration function, owner bootstrap, and MFA route/assurance design.
- [ ] Review function authorization and Storage access one workflow at a time; no blanket grants/revokes.
- [ ] Prepare exact proposed SQL changes plus rollback and role-based test matrix for owner review.

### Phase 2 — Core app foundation (Nov 1–7)
- [ ] Finish authentication/session handling and route structure for agreed scope.
- [ ] Implement role selection and approval states without trusting editable user metadata.
- [ ] Implement owner/staff admin entry and permission checks appropriate to the agreed scope.
- [ ] Add explicit loading, empty, error, and retry states.
- [ ] Add automated checks for build, types, and core auth/route behavior.

### Phase 3 — Core delivery workflows (Nov 8–13)
- [ ] Customer: browse approved shops/menu, cart, order quote and order status.
- [ ] Merchant: shop/menu management and order acceptance within approved permissions.
- [ ] Rider: availability, assigned orders, delivery status, distance/fare calculation.
- [ ] Promotions: merchant-configured rules, validated discount calculation; no paid-ad ranking.
- [ ] Payment and wallet flows: document state transitions and prevent duplicate deductions/credits.
- [ ] Mark any payment-provider integration, mapping, SMS cost, insurance purchase, or external dependency as blocked until credentials, pricing, and owner decisions are available.

### Phase 4 — Security, accounting, and regression (Nov 14–17)
- [ ] Verify role/ownership restrictions for customer, merchant, rider, reviewer, finance staff, and owner.
- [ ] Test merchant bank-change review flow before restricting old access paths.
- [ ] Test order totals, >THB 500 payment/deposit rules, commission, tax reserve, rider pay, and monthly incentive calculations.
- [ ] Test cancellation, disputes, refunds, idempotency, audit logs, and failure recovery.
- [ ] Test all known client compatibility paths against staging/test data.
- [ ] Run build/CI and resolve critical/high findings.

### Phase 5 — Owner acceptance and release decision (Nov 18–20)
- [ ] Provide a checklist of what is complete, tested, incomplete, and blocked.
- [ ] Owner reviews proposed production SQL and impact/rollback plan.
- [ ] Apply production changes only after explicit approval and only if staging/regression tests pass.
- [ ] Verify post-deploy access and critical workflows.
- [ ] Do not call it production-ready if payments, identity verification, privacy, operations, or rollback requirements remain untested.

## Definition of done (provisional until owner chooses launch target)

- The agreed workflows can be tested end-to-end with separate test accounts for each role.
- No known critical/high security finding is left without an accepted mitigation.
- Sensitive bank/identity data is not accessible to unauthorized roles.
- Core pricing, commission, wallet, and incentive calculations have repeatable tests.
- Build and automated checks pass.
- Known integrations and shared-Supabase clients are inventoried, with regression results recorded.
- Deployment, backup/rollback, monitoring, and operator steps are documented.
- Any unimplemented feature is explicitly disclosed; UI mockups do not count as complete backend functionality.

## Current status

**Planning and implementation in progress; not production-ready.** The requested date is an aggressive target with roughly 25 calendar days from preparation. Whether full production launch is feasible depends on the owner's launch target, source access for other clients, external integrations, and test results. Prioritize a secure, testable release over silently weakening security to meet the date.
