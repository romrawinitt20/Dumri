# Dumri Auth, Storage, and Demo Test Checklist

Date: 2026-10-26  
Branch: `setup/supabase-auth-routes`  
Scope: testing guidance. Storage review was read-only; no Supabase schema, Auth users, Storage objects, policies, or production data were changed.

## Current test entry points

- `/login`: sign in using an existing Supabase Auth phone account and SMS OTP.
- `/verify-phone`: enter the OTP for the login attempt. The verification step expects navigation state from the login page; refreshing this page may lose that state.
- `/dashboard`: protected page. It calls `fn_my_profile` to read the profile linked to the signed-in user.
- `/demo`: isolated in-memory customer → merchant → rider order journey. It does not use Supabase Auth, persist orders, or handle real payments.
- `/demo/payouts`: isolated in-memory payout demo. The slip file picker only reads a local filename; it does not upload a file, record a real transfer, or send email.

## Test an existing Supabase Auth user

1. Open the Dumri test deployment that points to the intended Supabase project. Confirm the deployment environment uses the expected Supabase URL and publishable key; do not paste keys or secrets into a public issue.
2. Open `/login` and enter the phone number belonging to an existing test account, using Thai international format if needed (for example, `+66812345678`).
3. Receive the OTP through the configured test SMS provider/phone and enter it on `/verify-phone`. Do not share the OTP with anyone.
4. Confirm that the app navigates to `/dashboard` and displays the profile returned by `fn_my_profile`.
5. Sign out, then repeat for each existing test account. Record only the account's test label/role and outcome, not phone numbers, OTPs, access tokens, or identity documents.

## Expected checks per account

- **Customer:** authenticated session is restored after a page reload; dashboard shows the correct linked profile and role.
- **Merchant:** dashboard shows the correct linked profile and status. Pending merchants must not be treated as approved for merchant actions.
- **Rider:** dashboard shows the correct linked profile and status. Pending riders must not be treated as approved for rider jobs.
- **Protected route:** opening `/dashboard` while signed out should redirect to `/login`.
- **Sign out:** session is cleared and a protected page redirects to login.
- **Profile missing:** if `fn_my_profile` returns no linked profile, the UI should show an error and must not grant role-specific capabilities.

## Demo-only order workflow

1. Open `/demo`.
2. As customer, choose a sample shop, quantity, and simulated payment, then create an order.
3. As merchant, move the order through accepted → preparing → ready.
4. As rider, move it through picked up → delivered.
5. Reset the demo and verify that no real payment or persisted database order was created.

## Demo-only payout workflow

1. Open `/demo/payouts`.
2. Confirm the page says demo mode, displays the 02:00 Thailand daily close, and shows the 10:00–12:00 payout window.
3. Select a fake merchant or rider payout. Confirm the amount and period match the selected row.
4. Try to record without a transaction reference or selected filename; the action should be disabled.
5. Add a fake reference (do not use a real bank reference) or select a harmless test file, then record the simulated payout.
6. Confirm the row moves to the simulated-paid state and totals update. Select the same row again and verify it cannot be recorded twice.
7. Reset demo data and confirm totals return to their initial values.
8. Verify the page explicitly says that a selected file is not uploaded and that no real bank transfer, database write, or email occurred.

## Storage policy review — read-only findings

The private `payment-slips` bucket is configured with a 10 MiB maximum and MIME allowlist `image/jpeg`, `image/png`, and `application/pdf`. The observed policies allow authenticated customers to upload under their own user/order path only when the order is unpaid, in an eligible status, and uses transfer/PromptPay. Reads are scoped to the user's path, with an exception for `fn_my_role() = 'admin'`. No UPDATE or DELETE policy was observed.

The role mapping behind `fn_my_role() = 'admin'` has not yet been verified to mean only approved Super Admins. Do not broaden this policy without that review. Full details are in [payment-slip storage policy review](payment-slip-storage-policy-review-20261026.md).

## Required Storage negative tests (not yet run)

Use two disposable customer test accounts and non-sensitive test orders only. These are not to be run against real customer files.

- Customer A can upload a valid test slip only to A's eligible order path.
- Customer A cannot upload under Customer B's user ID or order ID.
- Customer A cannot read Customer B's slip.
- Customer A cannot overwrite or delete another customer's slip.
- A malformed path, nonexistent order, delivered/cancelled/paid order, cash order, or unsupported payment method is denied.
- A non-admin customer cannot list or read slips outside their own allowed path.
- Confirm the exact users who satisfy `fn_my_role() = 'admin'`; only the intended Super Admin role should have global read access.
- Confirm unsupported MIME types and files larger than 10 MiB are rejected. MIME declarations alone do not prove the underlying file bytes are safe.

Do not perform these tests until disposable test accounts/orders are available and the owner has approved creating test records. No such test records were created during this review.

## Known limitations / test blockers

- The current login flow uses SMS OTP only. It does not provide email/password sign-in or a bypass for test accounts.
- Actual authentication testing requires access to the test phone/SMS channel or a test OTP mechanism already configured by the project owner. The agent cannot receive the user's OTP or inspect account passwords.
- The dashboard currently verifies that a session exists and reads a profile, but it is not the completed role-specific application. UI role labels are not server-side authorization.
- `/demo` and `/demo/payouts` are separate prototypes. Passing their workflows does not prove Supabase Auth, RLS, RPC authorization, Storage access control, payment handling, or cross-app isolation.
- Avoid using real customer, merchant, rider, bank, identity, or payment data in demo tests.
- Dumri and Midnight Meals share the same Supabase project. Keep tests read-only unless the project owner approves a specific, reviewed change.

## Current CI verification

GitHub Actions workflow run `40318585324` completed successfully for dependency installation and the application build. This is a build check, not an end-to-end authentication or Storage authorization test.
