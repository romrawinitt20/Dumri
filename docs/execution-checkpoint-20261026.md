# Dumri Execution Checkpoint — 2026-10-26

## What is complete
- PR #1 was merged into `main` as merge commit `3b28be84fd96e99ab99c61fed30aaa8ac5b3250b`.
- The GitHub Actions production build passed on the PR head immediately before merge (run `40329725881`). This does not prove SMS OTP or end-to-end authorization works.
- Existing migrations were inventoried read-only. The database contains migrations for order, payment, rider wallet, refund, accounting, onboarding, and admin authorization workflows. Do not recreate these objects without checking existing definitions.

## Read-only findings from the current live metadata
- `fn_my_profile`, `fn_register_profile`, `fn_assert_admin`, `fn_assert_admin_permission`, and `fn_assert_owner` are SECURITY DEFINER functions with `search_path=pg_catalog, public`; EXECUTE is granted to authenticated and service_role (and postgres).
- The `fn_register_profile` signature accepts a caller-provided phone value. The client currently passes phone metadata from the registration flow. Function-body validation against `auth.uid()` and the confirmed Auth phone has not been verified, so profile linking remains a blocker.
- RLS policy metadata shows several policies use `fn_my_role() = 'admin'` as an administrative gate, including user and payment/order paths. This does not by itself establish that only an active Super Admin passes the check; the helper/function body and admin bootstrap must be verified.
- The current policy listing returned no policies for `admin_profiles` or `admin_access_audit`. Advisor also reports 17 RLS-enabled tables with no policies. Before changing anything, confirm their grants and all intended RPC-only access paths; do not create broad policies just to silence the advisor.
- Security Advisor reports 84 SECURITY DEFINER functions executable by authenticated users. Treat this as a review queue, not proof that all 84 are vulnerable. Review each exposed function's guard, arguments, row scope, and grants.
- Admin area-scoping remains design-only. Existing `zones` metadata has no canonical province/district identifiers; do not infer official geography from zone labels or coordinates.
- No live schema, row, Auth user, Storage object, RLS policy, or permission changes were made as part of this checkpoint.

## Next actions in order
1. Retrieve and review exact SQL for the existing profile-registration and admin guard functions using a supported safe source path. If source is unavailable, keep the relevant change blocked rather than guessing.
2. Verify the exact grants and intended access paths for the 17 no-policy tables and the 84 SECURITY DEFINER functions, starting with identity, admin, payments, finance, wallet, refunds, and Storage.
3. Prepare narrowly scoped SQL proposals with rollback and cross-client impact analysis for Dumri and Midnight Meals; do not apply them until reviewed and approved.
4. Complete auth/profile tests using existing disposable test accounts only. Never create/promote real admin accounts or alter production identities as a shortcut.
5. Only after the security baseline is understood, proceed to role-specific end-to-end workflow tests and the pricing/accounting regression matrix.

## Current release status
**Merged starter; not production-ready.** SMS OTP, registration/profile linkage, server-side role/approval enforcement, admin MFA/AAL2, payments, and payout flows still need explicit tests. Real money transfers remain outside the demo.
