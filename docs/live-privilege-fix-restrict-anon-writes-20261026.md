# Live Privilege Fix — Restrict Anonymous Table Writes — 2026-10-26

## Change performed
In shared Supabase project `vdmqhgdcfsswinlilwyn`, revoked these direct table privileges from role `anon` on 21 existing `public` tables:
- `INSERT`
- `UPDATE`
- `DELETE`
- `REFERENCES`
- `TRIGGER`

Tables: `addresses`, `complaint_messages`, `complaints`, `customer_profiles`, `gp_tiers`, `menu_categories`, `menu_items`, `merchant_hours`, `merchant_invoices`, `merchant_profiles`, `notifications`, `option_groups`, `options`, `order_assignments`, `order_item_options`, `order_items`, `order_status_history`, `reviews`, `rider_locations`, `rider_profiles`, `zones`.

The change intentionally retains existing `SELECT` privileges, with RLS still governing row access. No tables or rows were deleted or modified. No application code or Storage objects were changed.

## Verification
A read-only query using `has_table_privilege` confirmed **zero public base tables** where `anon` has effective `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` privileges after the change. The earlier fix also removed effective `TRUNCATE` for `authenticated` on all 21 listed tables.

## Impact
- Anonymous browser sessions can no longer directly write/delete rows in these tables. Dumri's SMS-OTP registration flow is expected to use authenticated sessions and guarded RPCs for writes; it still requires regression testing.
- Public reads, where already permitted, remain subject to existing RLS policies.
- Because this is a shared Supabase project, the privilege change is project-wide and may break any Midnight Meals flow that relied on anonymous direct writes. Such writes are unsafe and should be replaced with authenticated, server-authorized operations.
- This does not prove all RLS policies, authenticated write grants, RPCs, or Storage policies are secure.

## Verification still required
1. Run the manual Auth/demo checklist with existing test accounts.
2. Test customer address/menu/order flows and merchant/rider flows without using destructive requests.
3. Audit authenticated direct-write grants and RLS `WITH CHECK` conditions.
4. Inspect Storage policies and sensitive-column access.
5. Re-run Supabase Security Advisor and inspect remaining findings.

No destructive data operation was executed.
