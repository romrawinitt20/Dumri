# Payment Slip Admin Role Follow-up — 2026-10-26

Read-only follow-up for `payment-slips` Storage access. No live settings, policies, rows, Auth users, or Storage objects were changed.

## Verified metadata
- `user_role` enum values include `customer`, `rider`, `merchant`, and `admin`.
- `public.admin_profiles` contains `user_id`, `admin_level`, `permissions` (JSONB), and `is_active`.
- `public.fn_my_role()` returns `user_role`, is marked SECURITY DEFINER, and has `search_path=public`.
- The Storage SELECT policy grants read access to an object if the path belongs to the current user OR `fn_my_role() = 'admin'`.

## What is not verified
The available safe query path blocked retrieval of the function body and some table metadata queries. Therefore we cannot confirm whether `fn_my_role()` requires an active `admin_profiles` row, whether it distinguishes owner from staff, or whether it checks `admin_level` and permissions. We cannot claim that global slip-read access is restricted to Super Admins.

## Recommended next steps
1. Inspect the function definition through a supported, read-only SQL editor or reviewed source/migration file.
2. Confirm the exact policy for who may read every customer's payment slip. Prefer a dedicated Super Admin authorization check if that is the intended business rule.
3. Review the `search_path=public` setting alongside schema CREATE privileges and the function's object references; do not alter it without dependency review.
4. Once disposable test accounts and orders are available, test cross-customer read/upload, invalid order paths, overwrite, and delete behavior.
5. Prepare a scoped policy change and rollback plan only after the findings are confirmed; ask the owner before applying any live change.

## Safety
No tests created data, and no live changes were made. Dumri and Midnight Meals share the Supabase project; do not run write tests against production data or alter Midnight Meals objects.
