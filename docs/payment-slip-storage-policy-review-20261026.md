# Payment Slip Storage Policy Review — 2026-10-26

## Scope and safety
Read-only inspection of Supabase project `vdmqhgdcfsswinlilwyn` and the `storage.objects` policies. No Storage objects, database rows, policies, grants, Auth users, or project settings were changed. This review does not inspect or modify Midnight Meals data.

## Observed bucket configuration
- Bucket: `payment-slips`
- Public: `false` (private)
- Max object size: 10 MiB
- Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`

## Observed Storage policies
Only two policies were returned for `storage.objects`:

1. **Customers and admins read payment slips** — SELECT for `authenticated`
   - Requires bucket ID `payment-slips`.
   - Allows an object when its path has two folder components and the first folder matches `fn_my_user_id()`, OR when `fn_my_role() = 'admin'`.
   - Follow-up needed: verify that the application's `admin` role represents only approved Super Admin operators. If it includes ordinary staff/admin accounts, the policy grants them broad access to all payment slips.

2. **Customers upload own payment slips** — INSERT for `authenticated`
   - Requires bucket ID `payment-slips`.
   - Requires the expected two-folder path shape and first folder equal to `fn_my_user_id()`.
   - Checks that the order ID in the second folder belongs to that user, is unpaid, is in `pending_payment` or `placed`, and uses `transfer` or `promptpay`.

No UPDATE or DELETE policy was observed on `storage.objects`. This appears to prevent ordinary authenticated clients from replacing or deleting objects through the Storage API, but this must be verified with adversarial tests using test accounts before production.

## Positive controls observed
- Private bucket, not public.
- Explicit size and MIME allowlist.
- Upload policy binds the object path to the authenticated user's profile and an eligible order.
- Read policy limits customer access by path and restricts cross-customer reads, subject to the admin-role caveat above.

## Remaining risks and required tests
1. **Admin role scope:** verify `fn_my_role()` and the underlying role model; do not assume the generic enum value `admin` is equivalent to a narrowly assigned Super Admin.
2. **Overwrite and deletion:** with two disposable test customers, confirm customer A cannot read, overwrite, or delete customer B's slip. Confirm the intended owner can upload a second file only if the business rules allow it; absent UPDATE policy, upsert should fail.
3. **Order/path tampering:** verify upload is denied when the path's user ID or order ID is another user's, malformed, or an ineligible order.
4. **MIME spoofing:** Storage's MIME allowlist is not a guarantee that file bytes match the declared content type. Validate actual content/size server-side where feasible and keep a private object path.
5. **Download delivery:** use short-lived signed URLs only when needed; never expose permanent public URLs or log signed URLs.
6. **Payment submission RPC:** the existing static review says `fn_submit_payment` checks the current user's order/path and verifies the object exists. That check complements but does not replace Storage policy tests.
7. **Retention and cleanup:** if slips must be removed after a retention period, implement a separately authorized server-side process with audit logging; do not grant broad client DELETE privileges.

## Decision
No live policy change is recommended from this read-only review alone. First verify the exact admin-role semantics and run negative tests with disposable accounts. Any production policy change requires a scoped SQL proposal, impact assessment, test plan, rollback plan, and explicit owner approval.
