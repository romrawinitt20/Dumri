# Dumri Shared Supabase Consumer Inventory — 2026-10-26

## Scope and confidence

This is a source-level inventory of the Dumri repository on `main` and a read-only metadata/advisor snapshot of Supabase project `vdmqhgdcfsswinlilwyn`. It is **not** a complete inventory of every application using the shared Supabase project: the Midnight Meals source repository was not available in this inspection, so its consumers and dependencies remain unknown. Do not infer that an object belongs exclusively to Dumri from its name alone.

No database, Auth, Storage, grants, policies, production accounts, or application settings were changed during this inventory.

## Confirmed Dumri client and call sites

| File | Observed use | Risk / follow-up |
|---|---|---|
| `src/lib/supabase.ts` | Creates the browser client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; persists and refreshes sessions. | Confirm environment points at the intended project. Never put service-role/secret keys in `VITE_*` or client code. |
| `src/auth/AuthProvider.tsx` | Calls `auth.getSession()`, subscribes to `onAuthStateChange`, and calls `auth.signOut()`. | Session restore/listener is present. MFA/AAL2 assurance is not checked in this provider. |
| `src/pages/LoginPage.tsx` | Calls `auth.signInWithOtp` with `shouldCreateUser: false`. | Requires a pre-existing Auth user and working SMS provider; actual SMS flow needs manual test evidence. |
| `src/pages/RegisterPage.tsx` | Calls `auth.signInWithOtp` with `shouldCreateUser: true`, passing full name, phone, and requested role as Auth user metadata. | User metadata is user-editable and must not be trusted for authorization. Server-side profile registration must bind to `auth.uid()` and verified Auth phone. |
| `src/pages/VerifyPhonePage.tsx` | Calls `auth.verifyOtp`; after registration, calls `ensureUserProfile(data.user)`; resend uses `auth.signInWithOtp`. Route state carries phone/name/role and can be lost on refresh. | Review exact `ensureUserProfile` implementation and its RPC caller; add tests for missing state, mismatched phone/UID, duplicate registration, and expired OTP. |
| `src/pages/DashboardPage.tsx` | Calls RPC `fn_my_profile` and displays the returned role/status. | UI display is not authorization. RPC body and server-side role/active checks need source review and negative tests. |
| `src/components/ProtectedRoute.tsx` and `src/App.tsx` | Protect `/dashboard` in the browser based on session and phone confirmation. `/demo` and `/demo/payouts` are public routes. | Route guard is UX only, not a security boundary. Every data-changing RPC and RLS policy must enforce permissions server-side. Demo pages are intended to remain simulated. |
| `src/pages/DemoPage.tsx` | In-memory simulated order flow; no Supabase writes in the inspected source. | Do not represent this as a live ordering/payment test. |
| `src/pages/PayoutDemoPage.tsx` | In-memory simulated payouts; no real transfer, upload, or email in the inspected source. | Keep real-money handling disabled until server authorization, reconciliation, and payment readiness are reviewed. |

The package manifest pins `@supabase/supabase-js` to `2.57.4`. CI workflow `.github/workflows/ci.yml` runs `npm install --no-audit --no-fund` and `npm run build` on pushes to `main` and pull requests targeting `main`; build success alone does not prove Auth/RLS/RPC security.

## Read-only database findings

- The live metadata listing contains business tables including `users`, `zones`, `orders`, `payments`, merchant/rider profiles, wallet/ledger tables, refunds/complaints, and admin/audit tables. This establishes that the shared project contains multiple functional domains, not that every table is consumed by Dumri.
- `public.zones` has `id`, `name`, `center_lat`, `center_lng`, `is_active`, and `created_at`; merchant and rider profile `zone_id` foreign keys point to it. The schema listing does not provide canonical province/district codes.
- Security Advisor snapshot at 2026-10-26 reported 84 findings for `SECURITY DEFINER` functions executable by authenticated users, and a warning that leaked-password protection is disabled. The advisor wording is a review signal, not proof that every function is exploitable; each function body and authorization condition must be checked before changing grants.
- Performance Advisor reported 68 unused-index candidates and 3 multiple-permissive-policy findings. Do not drop indexes or rewrite policies based on these notices alone; validate query patterns and cross-app impact first.
- Attempts to retrieve exact SQL function bodies/policy definitions through the available read-only route were blocked by the safety validator. Therefore this inventory does not claim the bodies were audited.

## Shared-project safety boundaries

1. Do not delete, rename, migrate, disable, or alter Midnight Meals tables, data, Auth users, Storage objects, policies, grants, or settings.
2. Do not change global grants, Auth settings, Storage policies, or shared RPC behavior until impact on all consumers is understood and the owner approves the exact change.
3. Prefer source-level review, read-only metadata, and isolated test/staging validation first.
4. Do not use user-editable Auth metadata as an authorization source.
5. Do not treat client route guards or a successful production build as server-side security evidence.

## Remaining unknowns / next steps

- Obtain the Midnight Meals repository or an owner-provided consumer inventory; map its client configuration and RPC/table/Storage use before shared-project changes.
- Retrieve exact source for `ensureUserProfile` and the SQL bodies for `fn_register_profile`, `fn_my_profile`, admin guards, order/payment/payout RPCs through a supported safe route.
- Map each sensitive function to its EXECUTE grants, identity check, active-account check, role/permission check, ownership predicate, and area-scope check.
- Verify the exact CI run for a code change and add repeatable negative tests; do not mark security checks passed without evidence.

## Acceptance status

- Dumri source-level shared-client inventory: **partially complete** for the files inspected above.
- Whole shared-Supabase consumer inventory including Midnight Meals: **blocked** until its source/consumer map is available.
- Production security audit: **not complete**; no production changes were made.
