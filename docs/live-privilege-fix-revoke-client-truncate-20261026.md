# Live Privilege Fix — Revoke Client TRUNCATE — 2026-10-26

## Change performed
In Supabase project `vdmqhgdcfsswinlilwyn`, revoked PostgreSQL `TRUNCATE` privilege from client roles `anon` and `authenticated` on the following 21 existing `public` tables:

- `addresses`
- `menu_items`
- `merchant_profiles`
- `option_groups`
- `options`
- `order_items`
- `rider_profiles`
- `complaint_messages`
- `complaints`
- `customer_profiles`
- `gp_tiers`
- `menu_categories`
- `merchant_hours`
- `merchant_invoices`
- `notifications`
- `order_assignments`
- `order_item_options`
- `order_status_history`
- `reviews`
- `rider_locations`
- `zones`

No tables, rows, schemas, RLS policies, Auth users, Storage objects, or application deployments were deleted or modified by this change. No TRUNCATE or other destructive data statement was executed.

## Verification
After revoking the privilege, a read-only catalog query using PostgreSQL `has_table_privilege` found **0 public base tables** where either `anon` or `authenticated` still has effective `TRUNCATE` privilege.

## Impact and limitations
- Normal browser application flows should not require clients to truncate entire database tables. Nevertheless, this is a shared project, and any app that incorrectly depended on client TRUNCATE will no longer have that capability.
- The project is shared with Midnight Meals. The privilege change is project-wide for these table grants; it does not delete or modify Midnight Meals tables or data, but could affect that app if it relied on this unsafe privilege.
- This fix does **not** yet remove other broad `anon` INSERT/UPDATE/DELETE grants or prove all RLS and Storage paths are safe. Continue auditing before public launch.
- No anonymous exploit attempt was performed.

## Scope of Midnight Meals
The linked GitHub account currently exposes only the `romrawinitt20/Dumri` repository in the queried account listing. No Midnight Meals source repository or deployment settings were available through that listing, so this action did not disconnect or change the Midnight Meals deployment. No Midnight Meals code, tables, or data were intentionally removed.

## Rollback
If a verified app dependency unexpectedly breaks, restore only after reviewing the exact table and role impact. The prior state granted TRUNCATE to both `anon` and `authenticated` on the listed tables. Re-granting that privilege broadly is not recommended; investigate the failing flow and use a safer server-side administrative path instead.

## Next steps
1. Audit all remaining direct `anon` DML grants and confirm required public read-only access.
2. Inspect Storage bucket policies and sensitive column access.
3. Continue reviewing security-definer RPCs and registration/approval checks.
4. Run app regression tests; do not claim a full security clearance from this targeted fix alone.
