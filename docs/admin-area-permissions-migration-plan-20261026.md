# Dumri Admin Area Permissions — Migration and Verification Plan
Date: 2026-10-26
Status: Planning only. No live database change has been applied.

## Confirmed live metadata
- `public.admin_profiles` exists with `user_id`, `admin_level` (default `staff`), `permissions` JSONB, and `is_active`.
- `public.admin_access_audit` exists with `actor_id`, `target_user_id`, `action`, `old_permissions`, `new_permissions`, and `created_at`. Its current action check allows `ADMIN_GRANTED`, `ADMIN_PERMISSIONS_UPDATED`, and `ADMIN_REVOKED`; area assignment audit events will need a reviewed extension or a separate dedicated audit mechanism.
- `public.zones` exists with `id`, `name`, `center_lat`, `center_lng`, `is_active`, and `created_at`. Merchant and rider profiles refer to `zone_id`.
- Existing migrations include owner-controlled admin permissions, owner-only admin management, scoped admin approval/payment/order access, and seeded Dumri launch zones. Existing guard and policy behavior must be reviewed before any additive change.
- The live schema does not yet expose a canonical district/province reference in the inspected `zones` table. The current mapping from zones to official Thai administrative geography remains unverified.

## Recommended implementation phases
### Phase 0 — no-write discovery
1. Read the exact SQL for the existing admin guard, admin permission checks, admin-management RPCs, RLS policies, and seeded zones from the repository/migration history.
2. Establish the exact existing Super Admin identity and owner-only rules; do not infer that `admin_level` or the `admin` enum alone proves Super Admin.
3. Choose a canonical source for Thai province/district identifiers and record its provenance/version. Verify launch districts against that source.
4. Map each zone, merchant, rider, order, complaint, and payment-slip access path to a canonical district. Identify records with missing or ambiguous geography.
5. Produce a dependency matrix for every admin RPC, RLS policy, Storage policy, and sensitive table before drafting a migration.

### Phase 1 — additive schema (migration draft only)
Preferred normalized design:
- `geo_provinces`: stable official province identifier and display names.
- `geo_districts`: stable official district identifier, province foreign key, display names.
- Add a verified district foreign key to operational geography records (or a separate reviewed zone-to-district mapping table where direct assignment would be unsafe).
- `admin_area_scopes`: one row per scoped admin, unique admin user ID, mode `districts` or `province`, and a nullable province ID used only for province mode.
- `admin_area_scope_districts`: child rows linking a scope to district IDs, unique per scope/district.
- A transaction-safe server-side assignment RPC that validates the caller is an active Super Admin, validates the target admin is active, and atomically enforces:
  * district mode has 1–3 district rows and no whole-province assignment;
  * province mode has exactly one province and zero district rows;
  * the two modes cannot coexist;
  * the client cannot choose the actor ID or self-grant.
- A dedicated area-scope audit table or carefully reviewed extension of the existing audit action schema, recording actor, target admin, old/new mode and IDs, reason, and timestamp.
- Keep all new tables private to direct client access unless a specific RLS policy is reviewed and needed. Prefer narrow RPCs for reading/editing scope summaries.

Names above are proposals, not an applied schema. Constraints, triggers, and RPC signatures must be validated against the actual existing schema before writing final SQL.

### Phase 2 — authorization
- Build a server-side helper that derives the current actor from the authenticated session and checks active account, active admin profile, required functional permission, and record geography.
- Apply it to each existing admin RPC and relevant RLS policy. Do not rely on the frontend to filter records.
- Default-deny for missing/ambiguous geography, inactive admins, absent scope, and unrecognized role semantics.
- Keep Super Admin-only functions (admin creation, permission changes, area scope changes, global exports, and payout approval) separately guarded.
- Review Storage payment-slip read policy separately. Area scope alone must not grant access to every customer's slip or bank details.
- Preserve customer, merchant, and rider workflows and existing restrictions.

### Phase 3 — UI
- Super Admin only: choose functional permissions and geographic scope independently.
- Exactly one scope mode per admin: “เลือกอำเภอ” or “ทั้งจังหวัด”.
- District mode: choose province filter, then 1–3 districts; reject a fourth selection in both UI and server.
- Province mode: select exactly one province and display that all its districts are included.
- Show an explicit scope summary and require confirmation for scope expansion.
- Area admins cannot create admins, change their own permissions, or expand their own scope.

### Phase 4 — staging and rollout
1. Apply the migration only in an isolated test/staging project first, never directly to the shared live project.
2. Seed only verified geography reference rows in staging and create synthetic test users/data there.
3. Run all tests below, existing auth/order/payment/Storage regression tests, and production build.
4. Review the exact migration, cross-app impact, and rollback. Because the Supabase project is shared with paused Midnight Meals, inventory every shared policy/grant/function dependency; do not alter Midnight-specific objects.
5. Present the exact live SQL and rollback plan to the owner and obtain explicit approval before any production apply.
6. After an approved live migration, verify policies and RPC results with separate test identities; do not use real customer payment slips for testing.

## Required tests
- District scope with one, two, and three districts grants access only to those districts.
- A fourth district is rejected server-side even when called directly.
- Province scope includes all districts in the selected province and excludes all other provinces.
- Mixed province and district scope is rejected by database constraints or transactional RPC.
- Direct requests changing district/province IDs cannot bypass the scope.
- No scope, unknown geography, inactive admin, suspended user, or malformed assignment yields no area-admin access.
- Functional permissions remain enforced inside the allowed geography.
- Scope revocation/changes are honored on the next server-side authorization check.
- Area scope alone cannot approve payouts or expose bank account, national ID, payment slip, or global exports.
- Only Super Admin can create admins, change permissions, and grant/revoke area scopes.
- Every scope grant, change, expansion, and revocation creates an immutable audit entry.
- Regression: customers can access only their own data; merchants and riders retain their intended workflows; pending/suspended roles remain blocked; existing admin payment, refund, complaint, and order workflows still enforce their current safeguards.
- Storage payment-slip access is tested with separate synthetic customer and admin accounts, including cross-customer reads and invalid object paths.

## Current boundary
This plan is documentation only. No live schema, policy, function, table data, Auth user, Storage object, or Midnight Meals object was changed for area-scoped permissions. Do not implement or apply a live migration until Phase 0 is complete and the owner approves the exact production change.
