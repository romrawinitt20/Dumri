# Critical Shared-Supabase Privilege Finding — 2026-10-26

## Severity
**Critical to investigate before public launch.** This is a privilege/configuration finding, not a confirmed exploit. No destructive action or exploit test was performed.

## Read-only evidence
The live catalog query of `information_schema.role_table_grants` showed `anon` has `TRUNCATE` privilege on these exposed `public` tables:
- `addresses`
- `menu_items`
- `merchant_profiles`
- `option_groups`
- `options`
- `order_items`
- `rider_profiles`

The same result showed broad table-level grants to `anon` on some tables (including INSERT/UPDATE/DELETE on `addresses`, `menu_items`, `option_groups`, `options`, and `order_items`). The inspected RLS policies for these tables are primarily scoped to `authenticated`; however, **PostgreSQL TRUNCATE is not governed by row-level security**. Therefore, RLS alone is not a defense against an anonymous role that holds TRUNCATE privilege.

This catalog evidence does not prove an anonymous client can reach the Data API endpoint under the current project configuration, nor was any destructive request attempted. Nevertheless, the privilege should be treated as urgent because it is unnecessary for normal customer/merchant/rider browser flows.

## Safe proposed mitigation (NOT APPLIED)
Before applying, inspect whether these grants are intentional and whether other apps share the project. Do not revoke broad table privileges blindly.

Proposed minimal SQL to remove only the clearly unnecessary TRUNCATE privilege from the public anonymous role:
```sql
REVOKE TRUNCATE ON TABLE
  public.addresses,
  public.menu_items,
  public.merchant_profiles,
  public.option_groups,
  public.options,
  public.order_items,
  public.rider_profiles
FROM anon;
```

This SQL was **not run**. Because Dumri and Midnight Meals share this project, even this targeted grant change must be reviewed for cross-app impact and explicitly approved by the project owner before execution. It does not drop or modify any tables or rows, but changes database privileges for the `anon` role across the shared project.

## Required follow-up
1. Check whether `PUBLIC` or another role also holds TRUNCATE on these tables; revoking only from `anon` may not remove inherited access.
2. Audit effective privileges and RLS together for all exposed tables and Storage.
3. Replace broad grants with least-privilege grants only after mapping both apps' usage.
4. After any approved change, verify the effective privilege result and run Supabase security advisors.
5. Never test this by issuing TRUNCATE or a destructive anonymous request against the live project.

## Decision boundary
Read-only audit only. No database changes, data reads, deletes, or application-setting changes were performed.
