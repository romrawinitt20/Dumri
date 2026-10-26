# Dumri Project Scope Decision — 2026-10-26

## Decision
The user chose to stop maintaining Midnight Meals and continue developing Dumri, without changing or deleting any Midnight Meals components.

## Operational boundaries
- Treat Dumri as the active product and roadmap.
- Do not spend further development effort preserving Midnight Meals compatibility unless the user later requests it.
- Do not delete, modify, disable, migrate, or otherwise alter Midnight Meals tables, data, Auth users, Storage objects, app settings, or deployment.
- The apps share Supabase project `vdmqhgdcfsswinlilwyn`; therefore any proposed Dumri database change must still be reviewed for its direct effect on the shared project, but Midnight Meals is not a reason to maintain its application behavior.
- No live database or Supabase settings were changed by this decision.
- Keep the Dumri PR open and unmerged until the user explicitly approves merge.

## Next Dumri work
1. Continue read-only audit of order creation, merchant order updates, rider assignment/acceptance/status changes, and sensitive data exposure.
2. Record findings and proposed fixes in the Dumri branch.
3. Prefer code/docs/tests and non-production validation before proposing database changes.
4. Before any production database change, provide exact SQL, impact, verification plan, and rollback steps for approval.
5. Continue using the existing Auth test accounts through normal sign-in only; do not request passwords or OTPs and do not edit Auth accounts without explicit approval.
