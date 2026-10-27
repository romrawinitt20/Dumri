# Owner/Admin Function Authorization Inventory — 2026-10-28

Status: **Yellow — partial inventory; exact per-function SQL call paths are not verified**  
Scope: read-only repository/document inventory for Dumri. This is a classification and evidence-gap register, not an executable migration or a claim that every function body was inspected.

## Evidence and limits

Reviewed:
- `docs/owner-mfa-enforcement-review.md`
- `docs/admin-area-scope-security-gates-20261026.md`
- `docs/admin-area-scope-live-baseline-20261026.md`
- `docs/owner-admin-mfa-review-20261028.md`
- The migration names recorded in the read-only live baseline.

The current GitHub connector could fetch the review documents but returned 404 for the guessed migration file paths, and repository code search did not return matching function definitions. Therefore the exact SQL bodies, grants, dependency graph, and all direct-call paths could not be independently reconstructed from the repository route used in this pass. The migration names below are confirmed from the existing read-only baseline only; names are not proof of implementation details.

No live SQL was executed. No code, migration, Auth setting, grant, policy, account, or data was changed.

## Function and policy boundary register

| Function / area | Known from existing read-only review | Intended authorization class | AAL2 rule | Evidence status / next check |
|---|---|---|---|---|
| `fn_assert_owner()` | Checks authenticated session, application user ID 1, admin role, active owner-level admin profile, active account status, and matching Auth UID; no JWT AAL check recorded | Owner-only | **Required** before owner-only operation succeeds | Helper definition was reviewed previously; retrieve exact current SQL/grants and every caller before implementation |
| `fn_assert_admin()` | Checks active owner account with `all` permission; no AAL check recorded | Owner/Super Admin boundary requires clarification because helper name is broad | **Required only where it represents owner-only authority**; do not automatically impose on every staff workflow | Exact semantics and callers need function-by-function validation |
| `fn_assert_admin_permission(text)` | Checks active admin status and requested permission; no AAL check recorded | Staff permission / least-privilege | Staff actions should follow the approved risk policy; owner-only operations additionally require AAL2 | Verify callers, permission keys, owner handling, and sensitive finance separation |
| `fn_is_admin()` | Owner-status helper; no AAL check recorded | Helper only; not sufficient by itself as a complete authorization boundary | AAL2 must be enforced on each owner-only operation, not inferred from this boolean helper | Find all callers and direct checks; exact function body/grants must be re-read |
| Admin create/edit/deactivate/revoke | Existing migration history includes owner-controlled admin permissions and owner-only admin management/expense approval | Owner-only | **Required** | Enumerate every RPC and verify no staff or direct-RPC bypass |
| Order / merchant / rider approval, listing, detail, assignment | Scope review identifies these as priority areas; exact call graph not available in this pass | Staff permission plus record ownership/geographic scope; some configuration actions may be owner-only | AAL2 only for explicitly owner-only actions; never use AAL2 as a substitute for permission/scope checks | Enumerate exact functions and confirm each checks identity, active status, permission, ownership, scope |
| Complaint listing/detail/assignment/resolution | Identified as sensitive operational scope in the review | Staff permission plus record scope | AAL2 for owner-only overrides only; routine staff handling remains least-privilege | Exact function names and SQL paths unverified |
| Payments, slips, payouts, bank details, wallet adjustments, bonuses, refunds, tax/finance reports/exports | Identified as sensitive finance areas; security gates require a separate finance permission in addition to scope | Separate finance permission + active account + verified scope + audit; some finance/admin controls may be owner-only | **Required for owner-only finance control**; do not assume AAL2 alone authorizes a staff member | Enumerate read and write RPCs separately, grants, storage paths, audit transaction behavior |
| Profile and admin-profile lookup/self-update | Prior review identifies admin-profile lookup and profile changes as priority | Self-access or narrowly permissioned admin access; never trust editable metadata as authority | AAL2 only for owner-only changes | Verify caller identity, target-user binding, role escalation prevention, and direct grants |

## Migration-history clues to inspect (not proof of behavior)

The prior read-only live baseline lists these migrations as applied:
- `20261023165649 add_owner_controlled_admin_permissions`
- `20261023165733 scope_admin_approval_payment_and_order_access`
- `20261023165837 add_scoped_pending_payment_review_queue`
- `20261023165848 preserve_customer_access_when_revoking_admin`
- `20261023172335 enforce_owner_only_admin_management_and_expense_approval`
- `20261024180211 seed_dumri_launch_zones`
- `20261024191315 restrict_admin_definer_rpc_to_authenticated`
- `20261024194639 restrict_direct_execution_of_admin_assign_rider_raw`

These names suggest useful inspection targets but do not establish which function definitions/grants are currently active or whether every caller enforces the intended policy.

## Classification rules for the implementation design

1. **AAL2 is an assurance gate, not a role or permission.** For owner-only RPCs, validate the current request's JWT assurance server-side (expected `aal2`) and separately validate the owner identity, active account, and owner bootstrap invariant.
2. **Staff permission is not owner authority.** A staff RPC must check active admin status, the exact permission key, record ownership/geographic scope, and any sensitive-data permission. A permission string must not grant admin-management or owner-only actions.
3. **Sensitive finance needs both functional permission and scope.** AAL2 must not replace finance permission; geography must not replace either one.
4. **Fail closed.** Missing profile, inactive/revoked account, unknown scope, invalid geography, missing permission, or an unverifiable identity denies the operation.
5. **Audit privileged mutations atomically.** Permission/scope changes and their audit records must commit or roll back together.
6. **Direct RPC is the security boundary.** Frontend route guards are useful UX but cannot replace SQL-side authorization.
7. **Do not remove the current owner ID-1 bootstrap dependency casually.** First design and test a verified bootstrap, recovery, backup, and rollback path.

## Required next evidence

- Obtain the exact current SQL definitions and execute grants through a supported read-only path, without running test mutations against the only available shared/live project.
- Build a complete table of every SECURITY DEFINER function with: signature, execute grants, guard/helper calls, direct role checks, tables touched, read/write effect, owner-only/staff/finance classification, AAL2 requirement, geography/ownership requirement, and audit behavior.
- Trace wrappers and nested RPC calls, including functions that perform direct checks rather than using the shared guards.
- Keep runtime tests **BLOCKED / NOT RUN** until isolated staging and disposable test identities are available.
- Before any implementation, provide exact migration SQL, impact, rollback, and test plan for explicit owner approval.

## Test cases (planned, not executed)

- Owner at AAL1 calls every owner-only RPC directly → denied.
- Owner at AAL2 calls an owner-only RPC with active owner identity → allowed.
- Customer, merchant, rider, and inactive admin call admin RPCs → denied.
- Staff with one permission tries another permission, admin management, or self-escalation → denied.
- Staff without finance permission requests bank/slip/payout/export data → denied.
- Staff with finance permission but outside verified geography requests a record → denied.
- Unknown geography, missing admin profile, or inactive account → denied.
- Revocation is effective on the next server-side authorization check.
- Privileged permission/scope mutation without audit write → transaction fails.
- Bypassing UI and calling RPC directly yields the same authorization result.

## Final status

**Partial progress only.** The policy classes and the high-risk review queue are now organized, but this is not yet the complete function-by-function inventory requested. Exact SQL call paths and grants remain unverified through the available repository retrieval route. No runtime tests passed or failed because none were run. No production changes and no PR merge occurred.
