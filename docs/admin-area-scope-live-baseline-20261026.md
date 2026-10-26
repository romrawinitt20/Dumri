# Admin Area Scope — Verified Live Baseline (2026-10-26)

## Purpose

Record what was verified against the Dumri Supabase project before implementing the owner-approved Option A admin geography scope. This is a discovery note, not an authorization to change production schema.

## Project scope and safety

- Supabase project ref: `vdmqhgdcfsswinlilwyn`.
- Continue Dumri only. Do not alter Midnight Meals objects or data.
- Do not apply this feature to the live database until the current authorization paths and zone mapping have been reviewed.
- PR #1 remains a draft/open PR and must not be merged without the owner's explicit approval.

## Verified migration history

The Supabase migration listing returned these relevant migrations as applied:

- `20261023165649 add_owner_controlled_admin_permissions`
- `20261023165733 scope_admin_approval_payment_and_order_access`
- `20261023165837 add_scoped_pending_payment_review_queue`
- `20261023165848 preserve_customer_access_when_revoking_admin`
- `20261023172335 enforce_owner_only_admin_management_and_expense_approval`
- `20261024180211 seed_dumri_launch_zones`
- `20261024191315 restrict_admin_definer_rpc_to_authenticated`
- `20261024194639 restrict_direct_execution_of_admin_assign_rider_raw`

These names establish that admin permissions and some scoped workflows already exist. Migration names alone do **not** prove their exact implementation or whether each sensitive query enforces the required geographic boundary.

## Verified table metadata

The live table metadata lists:

### `public.admin_profiles`

Known fields from prior metadata inspection:
- `user_id`
- `admin_level` (default observed as `staff`)
- `permissions` (JSONB)
- `is_active`

### `public.zones`

The live schema listing confirms:
- `id` bigint primary key
- `name`
- `center_lat`
- `center_lng`
- `is_active`
- `created_at`

Foreign keys from `merchant_profiles.zone_id` and `rider_profiles.zone_id` point to `zones.id`.

The current `zones` schema does not expose canonical province/district IDs or codes. Do not infer a zone's official district solely from its display name or coordinates.

### `public.admin_access_audit`

Prior metadata inspection identified actor, target user, action, old permissions, new permissions, and timestamp fields. Existing allowed audit actions include `ADMIN_GRANTED`, `ADMIN_PERMISSIONS_UPDATED`, and `ADMIN_REVOKED`. Scope-change audit semantics must be checked against the actual constraint and existing write function before changing either.

## Owner-approved product rules

The selected Option A is:

1. District mode: assign up to three districts.
2. Province mode: assign one province, covering every district in that province.
3. Province and district modes are mutually exclusive.
4. Functional permissions are independent of geography.
5. Only Super Admin may create/manage area admins and grant permissions.
6. Area admins cannot grant permissions or change their own scope.
7. Enforcement must happen in server-side RPC/RLS, not only in frontend navigation.
8. Sensitive payment, payout, bank-account, and payment-slip access needs separate permission checks as well as geography checks.

## Verification limitation

The migration listing and table metadata were retrieved successfully. Attempts to retrieve SQL function bodies and some detailed catalog/policy queries were blocked by the tool's safety validator. Therefore this note does **not** claim that the bodies of existing admin guards, RLS policies, or migration SQL were audited.

Before writing a production migration, retrieve the actual SQL through a supported read-only route and verify at minimum:
- Super Admin identity and active-account checks;
- whether every admin-management RPC is owner/Super-Admin-only;
- every RPC and policy that reads or mutates orders, merchant/rider profiles, complaints, payment reviews, payouts, payment slips, and financial reports;
- whether any SECURITY DEFINER helper bypasses a geographic scope;
- existing audit-action constraints and transactional audit behavior;
- actual seeded zone names and their verified official Thai district/province mapping.

## Safe implementation sequence

1. Inspect exact existing migration/function/policy source without writes.
2. Establish canonical Thai geography IDs/codes from a verified official dataset.
3. Design normalized scope storage and constraints; enforce mutually exclusive province/district modes and the maximum of three district assignments.
4. Add one reusable server-side authorization helper with explicit fail-closed behavior.
5. Apply geographic checks to each affected RPC/policy, keeping sensitive finance permissions separate.
6. Write scope changes to an audit record in the same transaction as the permission update.
7. Test positive and negative cases for Super Admin, area admin, customer, merchant, rider, inactive admin, unassigned district, cross-district access, province-wide access, and attempted self-escalation.
8. Apply only to an isolated test/staging database first; inspect migration diff and rollback plan before any production change.

## Current status

- Documentation only; no live schema, policies, rows, auth users, storage objects, or app settings were changed for this feature.
- No geography IDs have been invented or assigned.
- No production migration has been applied.
