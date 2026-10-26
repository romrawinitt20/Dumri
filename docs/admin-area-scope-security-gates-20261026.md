# Dumri Admin Area Scope — Security Gates and Test Plan

Date: 2026-10-26
Status: Review plan only. No production schema or policy changes applied.

## 1. Newly verified live baseline

Read-only Supabase metadata checks confirmed:

- `public.admin_profiles` has columns `user_id`, `admin_level`, `permissions` (JSONB), and `is_active`. The metadata tool reported 0 rows at inspection time. Confirm the intended bootstrap procedure before any rollout; do not manufacture an admin or promote an account as part of a test.
- `public.admin_access_audit` has `actor_id`, `target_user_id`, `action`, `old_permissions`, `new_permissions`, and `created_at`. Scope changes need an explicit audit representation; verify the action constraint and writer before changing it.
- `public.zones` has only `id`, `name`, `center_lat`, `center_lng`, `is_active`, and `created_at`. Merchant/rider profiles reference `zone_id`; this is not enough to prove official district/province membership.
- `public.orders` records merchant and rider IDs plus pickup/drop-off addresses and coordinates, but no canonical district ID. Orders must inherit verified geography from a trusted merchant/operational assignment or a validated location mapping; do not use client-provided labels as authority.
- `public.payments` and `public.complaints` are sensitive operational tables and must be included in the scope audit.

The Supabase security advisor currently reports:
- 17 RLS-enabled tables with no RLS policies (INFO). Earlier privilege checks found no direct anon/authenticated read/write grants for the tables reviewed, but each table's effective privileges still need to be verified before relying on this as protection.
- 84 SECURITY DEFINER functions executable by authenticated users (WARN). This is a review queue, not proof that all 84 are vulnerable. Each function needs its own caller-authorization and scope review.
- The advisor is not a substitute for testing actual calls under customer, merchant, rider, area-admin, and Super Admin identities.

## 2. Priority review order

Review exact function definitions and grants in this order, before implementing geographic scope:

1. **Admin identity and administration**
   - `fn_assert_admin`
   - `fn_assert_admin_permission`
   - `fn_assert_owner`
   - functions that create, edit, deactivate, or revoke admin profiles
2. **Order and merchant/rider operations**
   - order listing/detail/update/cancel/assignment RPCs
   - merchant approval and rider approval RPCs
   - complaint list/detail/assignment/resolution RPCs
3. **Payments and finance**
   - payment/slip review
   - merchant invoice and payout operations
   - rider wallet adjustments/top-ups/bonus settlement
   - refunds, finance reports, tax reserve and exports
4. **Storage and private documents**
   - payment-slip read/upload policies
   - identity-document and bank-account access paths
5. **Audit and profile changes**
   - admin permission/scope audit writer
   - profile self-update and admin-profile lookup functions

The function names above identify the review areas; do not infer their full behavior from names alone. The exact function source must be retrieved through a supported read-only method and reviewed before changing grants or definitions.

## 3. Fail-closed authorization requirements

Every area-admin request must establish all of the following server-side:

- Authenticated Supabase UID maps to the expected active Dumri user.
- Account is not suspended/banned and admin profile is active.
- The actor is an area admin (not merely a user with editable metadata).
- The required functional permission is granted.
- The record has a verified canonical geography.
- The record geography falls inside the actor's active scope.
- Sensitive actions require their additional permission (finance, payouts, bank details, payment slips, identity documents, exports).
- The operation is audited where required.

Missing profile, inactive admin, missing scope, ambiguous geography, failed mapping, or invalid permission must deny access. Never silently fall back to global access.

## 4. Proposed geography data model — still design only

Before migration, select a canonical official Thai administrative geography dataset with stable province/district identifiers. Verify the license/source and map each current active zone to a district only when evidence supports it.

Recommended relational shape:
- canonical province reference table
- canonical district table with province foreign key
- explicit admin scope record with mutually exclusive mode: `districts` or `province`
- district assignment child rows with a database-enforced limit of 3 per admin
- validated zone-to-district mapping
- audit history for grant, change, expansion, and revocation

Enforce mutually exclusive scope modes in database constraints/transactional server-side logic, not just UI state. A province-wide scope references exactly one province and no district rows; district mode has 1–3 district rows and no province-wide assignment.

Do not backfill current `zones` by guessed names or coordinates. Unknown mappings must remain explicitly unresolved and excluded from area-admin access until verified.

## 5. Test matrix before staging acceptance

| Actor | Action | Expected result |
|---|---|---|
| Super Admin | Assign one district | Allowed; audit written in same transaction |
| Super Admin | Assign three districts | Allowed |
| Super Admin | Assign a fourth district | Rejected server-side |
| Super Admin | Select province mode and districts together | Rejected server-side |
| Area admin | Read a record inside assigned district | Allowed only if functional permission also exists |
| Area admin | Read a different district | Denied |
| Area admin | Read another province under province mode | Denied |
| Area admin | Grant another admin permissions/scope | Denied |
| Area admin | Expand own scope through altered RPC parameters | Denied |
| Inactive admin | Call otherwise permitted RPC | Denied |
| Customer/merchant/rider | Call admin RPC directly | Denied |
| Area admin without finance permission | Read bank details, payout, payment slips, or finance exports | Denied |
| Any area admin | Access a record with unknown geography | Denied and flagged for cleanup |
| Super Admin | Revoke scope | Takes effect on next server-side authorization check |
| All roles | Existing checkout, delivery, cancellation, complaint, and profile flows | No regression |

Also test direct REST/RPC requests, not only frontend menus, and test storage URLs as a separate authorization boundary.

## 6. Rollback and rollout gates

Do not apply a production migration until:
1. Exact current guard/function/policy definitions and grants have been inspected.
2. Official geography source and zone mapping have been verified.
3. A migration draft, rollback SQL, and test fixtures have been reviewed.
4. An isolated staging/test database has passed the test matrix.
5. The owner has reviewed the exact production change and explicitly authorized it.

Rollback must remove only the newly introduced scope objects/policies/functions and restore only the exact prior definitions captured in the migration plan. Do not use broad grant resets or alter shared Supabase-wide configuration, and do not touch Midnight Meals objects.

## 7. Current boundary

This is a planning and verification document only. No live database changes were made for admin area scope. No admin was created/promoted, no scope was assigned, no geography was guessed, and no PR was merged.
