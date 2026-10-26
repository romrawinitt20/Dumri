# Cross-App Security Remediation Plan — Read-only / Approval Required

Date: 2026-10-26  
Supabase project: `vdmqhgdcfsswinlilwyn`  
Repository branch: `setup/supabase-auth-routes`

## Scope and safety promise

This is an impact-assessment and rollout plan only. Live database inspection was read-only. No grants, policies, tables, functions, Auth settings, Storage settings, or data were changed. No migration was applied and no pull request was merged. Because this Supabase project is shared by other apps/websites, no production change should be made until the other clients and their query patterns are inventoried and a staging test passes.

## Confirmed findings

### P0 — Publicly selectable merchant payout fields

Live privilege checks show that both `anon` and `authenticated` have table-level `SELECT` on `public.merchant_profiles`, including column-level SELECT for `bank_name`, `bank_account`, `approved_by`, and `approved_at`. RLS policy `ดูร้านที่อนุมัติแล้ว` permits rows where `is_verified = true`, the row belongs to the current user, or `fn_my_role() = 'admin'`. RLS filters rows; it does not hide columns. This is a confirmed risky privilege configuration; no data extraction was attempted and no actual misuse is established.

### P0/P1 — Merchant can update payout bank fields directly

Live column-privilege checks show `authenticated` has column-level `UPDATE` for `bank_name` and `bank_account`. The policy `ร้านแก้ไขร้านตัวเอง` allows a row update when `user_id = fn_my_user_id()`, with a matching ownership check after the update. This may let a merchant change payout details without the separate document-review workflow, while their existing verified state remains. The actual deployed clients' write paths and any triggers must be checked before deciding the final fix.

### Related data and functions

- `rider_profiles` contains identity, licence, and bank fields. Its inspected read policy is self/admin-limited, but its grants and update paths need the same column-level and cross-client review.
- `fn_admin_pending()` returns bank name/account details to callers that pass `fn_assert_admin_permission('users.verify')`. Preserve this workflow for explicitly authorized reviewers; do not replace it with broad table access.
- `fn_list_shops()` returns an explicit public shop-field list and is a possible stable read interface for customer-facing clients.
- Several order, finance, admin, and verification functions join `merchant_profiles`. Do not remove or rename columns or change function signatures without dependency analysis and tests.
- The Security Advisor reports numerous callable SECURITY DEFINER functions. This is a review queue, not proof that each function is exploitable; inspect authorization checks and client dependencies function by function.

## Newly identified client: Midnight Meals

- Deployed URL provided by the user: `https://midnight-meals.lovable.app`.
- The user then supplied `https://vdmqhgdcfsswinlilwyn.supabase.co` as the Supabase project URL associated with this app. This exactly matches the Dumri Supabase project reference `vdmqhgdcfsswinlilwyn`; therefore, for impact planning, treat Midnight Meals as a client of the same Supabase project.
- The public web fetch of the deployed app failed, and GitHub repository search did not find an associated repository. We have not yet inspected the Lovable source or established its deployed version, key type, direct table queries, RPC calls, or write paths.
- Do not share or request API keys, service-role keys, or other secrets. The project URL/reference alone is sufficient to identify the project.

## What the current evidence cannot establish

- Which other apps/websites use this Supabase project, their deployment versions, or whether they use direct table queries, `select('*')`, generated types, RPCs, views, or server-side keys.
- Whether any client has successfully read sensitive data or whether a bank change has occurred through a direct API path.
- Whether all client source repositories are available in the Dumri GitHub repository. GitHub code search for `merchant_profiles` did not return indexed results, so absence from search results is not evidence of absence in deployed clients.
- Recent PostgREST logs inspected so far showed schema-cache/system messages, not enough request detail to map all consumers. Do not treat logs as a complete client inventory.

## Safe rollout plan

### Phase 1 — Inventory every consumer (no production changes)

Create a register of every app, website, admin dashboard, automation, and backend that uses this project. Include Dumri and Midnight Meals as confirmed clients for impact planning. For each, record owner/contact, repository, environment (production/staging), deployed version, key type (publishable/anon vs server-only secret), and whether it calls:
- direct REST reads/writes on `merchant_profiles` or `rider_profiles`;
- wildcard reads such as `select('*')`;
- public shop columns, payout fields, or verification fields;
- RPCs including `fn_list_shops`, `fn_admin_pending`, order/finance functions;
- Storage paths for verification documents.

Do not copy service-role or secret keys into this report. A service-role/secret key must never be present in a browser/mobile client.

### Phase 2 — Establish the intended access contract

Define separate field-level requirements:
- Public/anonymous customer browse: only necessary public shop fields (name, slug, category, description, public phone/address/location, cover, open status, prep-time and ratings as product requirements allow).
- Merchant self-service: only fields the merchant may change; verification state and audit fields are server/admin-controlled.
- Payout details: never exposed in public browse APIs; read only in a narrowly authorized, audited review/payment workflow.
- Rider identity, licence, and bank data: only the rider where necessary and specifically authorized reviewers; no public access.
- Admin review: use a permission-checked RPC or protected private relation; preserve least-privilege staff permissions.

### Phase 3 — Build a compatibility layer before restricting direct access

Prefer a backward-compatible transition:
1. Add or confirm a stable public shop-read interface (the existing `fn_list_shops()` already returns explicit fields) and document its response contract.
2. Add/confirm a narrowly authorized server-side path for merchant/rider payout-detail review. Keep `fn_admin_pending()` permission-checked and ensure its result includes only fields required by authorized reviewers.
3. Replace direct `select('*')` and private-column reads in every known client with explicit public field lists or approved RPCs.
4. For bank-detail changes, introduce a pending-change/reverification workflow or equivalent approval guard before making a new payout account active. Preserve a way for merchants to submit changes, but do not let a verified status silently validate new payout details.
5. Check whether any app depends on direct updates to bank fields, `is_verified`, `approved_by`, `approved_at`, `gp_tier_id`, or other controlled fields. Do not revoke grants until replacements are tested.

### Phase 4 — Test in staging / isolated test project

Test at minimum with separate sessions for anonymous, unrelated customer, merchant owner, rider owner, staff reviewer with `users.verify`, finance staff, and owner:
- public browse returns only approved public shop fields;
- direct API attempts to select bank/approval fields are denied to anon and ordinary users;
- merchants cannot read other merchants' payout fields;
- merchants cannot alter active payout account without required re-verification;
- staff reviewer can review only permitted submissions; staff without review permission cannot;
- rider identity and payout fields remain private;
- menu browsing, order quote/place, delivery, payments, refunds, admin review, finance exports, and owner controls still work;
- every deployed app build and server integration passes regression tests;
- RLS, column grants, RPC grants, and Security Advisor are rechecked after migration in staging.

### Phase 5 — Production rollout only after explicit approval

1. Take/verify a recoverable database backup and save the exact pre-change grants/policies.
2. Deploy client compatibility updates first where feasible.
3. Apply a narrow migration that revokes broad table SELECT and grants only explicitly approved public columns, while preserving required RPCs and authorized admin review paths.
4. Separately restrict direct bank-field UPDATE and implement the approved bank-change review workflow; do not bundle untested behavioral changes into the same release.
5. Verify effective privileges immediately after deployment using `has_table_privilege` and `has_column_privilege` for anon/authenticated, plus role-based functional tests.
6. Monitor API/function errors and client health. Keep a tested rollback script that restores only the recorded prior grants; rollback must not re-open sensitive fields without a documented emergency decision.

## Rollback and change controls

- Any failed staging test blocks production rollout.
- Any unlisted client or unknown dependency blocks production rollout.
- Do not blanket-grant access to tables with RLS enabled but no policies.
- Do not blindly revoke EXECUTE on all SECURITY DEFINER functions; some are legitimate RPC endpoints or internal dependencies.
- Do not change function signatures, role semantics, or owner bootstrap as part of the bank-column fix.
- Production changes require the owner's explicit confirmation after reviewing the exact migration and impact matrix.

## Status

**Prepared plan only.** The project reference supplied for Midnight Meals matches Dumri's Supabase project. No live changes made. The next required input is access to the Midnight Meals Lovable source/project view or its repository so its deployed code paths can be inventoried. Until that client and any other consumers are mapped, the production migration must remain blocked.
