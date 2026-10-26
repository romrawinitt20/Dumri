# Dumri Auth and Demo Test Checklist

Date: 2026-10-26  
Branch: `setup/supabase-auth-routes`  
Scope: read-only testing guidance. No Supabase schema, Auth users, Storage, policies, or production data are changed by this checklist.

## Current test entry points

- `/login`: sign in using an existing Supabase Auth phone account and SMS OTP.
- `/verify-phone`: enter the OTP for the login attempt. The verification step expects navigation state from the login page; refreshing this page may lose that state.
- `/dashboard`: protected page. It calls `fn_my_profile` to read the profile linked to the signed-in user.
- `/demo`: isolated in-memory customer → merchant → rider order journey. It does not use Supabase Auth, persist orders, or handle real payments.

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

## Demo-only workflow

1. Open `/demo`.
2. As customer, choose a sample shop, quantity, and simulated payment, then create an order.
3. As merchant, move the order through accepted → preparing → ready.
4. As rider, move it through picked up → delivered.
5. Reset the demo and verify that no real payment or persisted database order was created.

## Known limitations / test blockers

- The current login flow uses SMS OTP only. It does not provide email/password sign-in or a bypass for test accounts.
- Actual authentication testing requires access to the test phone/SMS channel or a test OTP mechanism already configured by the project owner. The agent cannot receive the user's OTP or inspect account passwords.
- The dashboard currently verifies that a session exists and reads a profile, but it is not the completed role-specific application. UI role labels are not server-side authorization.
- `/demo` is a separate prototype. Passing the demo workflow does not prove Supabase Auth, RLS, RPC authorization, payment handling, or cross-app isolation.
- Avoid using real customer, merchant, rider, bank, identity, or payment data in demo tests.
- Dumri and Midnight Meals share the same Supabase project. Keep tests read-only unless the project owner approves a specific, reviewed change.

## Current CI verification

GitHub Actions workflow run `40301772256` completed successfully for dependency installation and the application build. This is a build check, not an end-to-end authentication test.
