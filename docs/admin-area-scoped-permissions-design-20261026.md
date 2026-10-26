# Dumri — Admin Area-Scoped Permissions Design
Date: 2026-10-26
Status: Owner-approved design requirement; implementation not yet applied to the live database.

## Owner decision (authoritative)
Admin area scope must use **Option A**, with mutually exclusive modes:
- **District mode:** assign up to three districts (Thai: อำเภอ) to one admin.
- **Whole-province mode:** assign one province, covering all districts in that province.
- An admin cannot combine district mode with whole-province mode in the same active assignment.
- Super Admin is a distinct system-wide role and may manage admin assignments. Area admins must not grant or expand their own scope or permissions.

## Why this is needed
Dumri intends to distribute local operations among people who know their communities. Area scope is a boundary on which records an admin may access; it is separate from what actions they may perform.

## Permission model
Authorization must require all applicable checks:
1. Authenticated identity is linked to the expected Dumri user record.
2. Account is active and the admin profile is active.
3. The admin has the required functional permission (e.g. merchant operations, rider operations, order support, complaints).
4. The target record falls inside the admin's assigned geography.
5. Sensitive financial, payout, bank-account, identity-document, and payment-slip access requires separate explicit permissions and server-side checks; being an area admin alone must not grant global access.
6. Super Admin actions, including creating/revoking admins and assigning provinces/districts, must be protected server-side and audited.

Frontend menu filtering is usability only; it must never be the authorization boundary. Enforce scope in RLS policies and/or narrowly scoped server-side RPCs/Edge Functions. Avoid blanket grants or client-controlled user IDs/roles.

## Geography model and current-schema caveat
Read-only schema inspection found:
- `public.admin_profiles` currently has `user_id`, `admin_level` (default `staff`), `permissions` (JSONB), and `is_active`.
- `public.zones` currently has `id`, `name`, `center_lat`, `center_lng`, `is_active`, and `created_at`; it does not contain authoritative province/district codes.
- Merchant and rider profiles reference `zone_id`; a zone must not be assumed to equal an official district without verified mapping.
- `public.admin_access_audit` currently records actor, target user, action, old/new permissions, and timestamp, but does not yet express geography assignment changes explicitly.

Therefore, do not implement area checks by matching free-text zone names or guessing coordinates. First establish a canonical Thai administrative geography source with stable province/district identifiers and a verified mapping from each merchant/rider/order to a district. Where the record's geography is missing or ambiguous, deny area-admin access by default and flag it for data cleanup; do not silently widen access.

## Proposed data shape (design only; not applied)
A normalized approach is preferred over storing district names in a JSON permissions blob:
- Canonical geography reference tables for provinces and districts, with stable identifiers and district-to-province foreign key.
- An explicit admin scope record with a mode such as `districts` or `province`, and the corresponding province ID when whole-province mode is selected.
- A child assignment table for district IDs in district mode, with a database-enforced maximum of three assignments per admin.
- Constraints/transactional RPC logic ensuring exactly one mode is active, whole-province mode has one province and no district rows, and district mode has 1–3 district rows and no whole-province assignment.
- Audit entries for assignment create/change/revoke, actor, target admin, prior/new scope, timestamp, and reason.
- Server-side helper(s) that evaluate whether the current active admin can access the geography of a record, using canonical IDs and the authenticated actor—not client-supplied actor IDs.

Exact table names, constraints, backfill, RLS, and RPC changes require a migration plan after the current schema, role semantics, and record-geography mapping are fully verified.

## Creation/edit UI requirements
In Super Admin's create/edit-admin screen:
1. Choose functional permissions independently from geographic scope.
2. Choose exactly one scope mode: “เลือกอำเภอ” or “ทั้งจังหวัด”.
3. District mode: province filter, then multi-select up to three districts; disable further selections at three.
4. Whole-province mode: select exactly one province; explain that every district in it is included.
5. Display a clear scope summary before saving.
6. On edits, show the previous scope and require explicit confirmation when expanding scope.
7. Log every grant, scope change, deactivation, and revocation.
8. Do not permit area admins to create admins or edit their own scope.

## Minimum security and regression tests
- District-mode admin with 1, 2, and 3 districts can access only matching records.
- Attempt to assign a fourth district is rejected server-side.
- Whole-province admin can access records in every district of the selected province but not another province.
- The UI and database reject mixed district + whole-province scope.
- An admin cannot alter request parameters to read another district/province.
- Inactive admin, suspended account, missing scope, and unknown geography are denied.
- Changing an admin's scope takes effect on the next server authorization check; revoked scope does not remain usable through stale client state.
- Functional permissions still restrict actions inside the allowed geography.
- Area scope alone does not permit payout approval, bank account access, payment-slip access, or global user exports.
- Only Super Admin can grant/revoke admin permissions and scope; all changes appear in audit logs.
- Regression-test customers, merchants, riders, existing admin RPCs, and Storage policies.

## Safety / rollout boundary
This document is design-only. No live database schema, policy, function, data, Auth user, Storage object, or Midnight Meals object was changed for this feature. Do not apply a production migration until the geography mapping and existing admin authorization semantics are verified, SQL and rollback are reviewed, and the owner explicitly approves the exact live change. Keep the existing PR unmerged until the owner approves merging.
