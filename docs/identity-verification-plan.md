# Dumri identity verification — review before implementation

Status: **design review only**. This document does not change the Supabase database, Storage buckets, access policies, or app behavior.

## Confirmed product rules

- Customer: phone SMS OTP verification. Phone confirmation alone is not document verification.
- Merchant: submit a photo of the **front of the national ID card only** and shop information; must be reviewed and approved by an admin before merchant functions are enabled.
- Rider: submit a photo of the **front of the national ID card only**, driving-licence evidence, vehicle information, and a face photo captured in the Dumri app. An admin compares the face photo with the portrait on the driving licence and reviews the submitted information before approving rider access.
- The app should capture the photos using the device camera, provide a preview, and allow retaking an unclear photo before submission.
- No automatic face matching or liveness vendor is required for the initial version. Admin checks the face photo manually.
- Phone OTP verification is not the same as document verification or role approval.
- Do not change existing database schema until the owner reviews and confirms the design.

## Initial database inspection (read-only)

The existing public schema already contains:
- `public.users`: role and general account status.
- `public.merchant_profiles`: shop name, contact details, address/location, verification flag, and approval metadata.
- `public.rider_profiles`: national ID value, optional licence number, vehicle plate/type, verification flag, approval metadata, and an optional `id_card` field.

Important gaps to confirm:
- Existing `id_card` and `national_id` fields appear to be data fields, not confirmed secure image storage paths.
- `rider_profiles` does not show dedicated image-path fields for a driving licence and an in-app face photo.
- `merchant_profiles` does not show a dedicated national-ID image-path field.
- Existing approval flags are not by themselves proof that all required documents were submitted and reviewed.
- Existing Storage buckets and their policies were not verified during this inspection. Do not assume an existing bucket is private or safe for identity documents.

## Proposed workflow for review

1. Applicant confirms their phone using SMS OTP.
2. Merchant applicant submits a front-side national-ID image and shop details.
3. Rider applicant submits a front-side national-ID image, driving-licence image(s), an in-app face photo, and vehicle details.
4. The app shows a clear preview and lets the applicant retake an unclear photo before submitting.
5. The application becomes pending review. Re-submission after rejection should be possible with an admin-provided reason.
6. An authorized admin views the private evidence, compares the rider face photo with the portrait on the licence, and records approve/reject plus a reason.
7. Merchant and rider features remain blocked until the appropriate server-side approval is confirmed. A client-side screen or user-editable metadata must never grant approval.
8. Record who reviewed the application, the decision, and timestamps in an auditable way.

## Storage and privacy requirements before implementation

- Identity images must use a **private** Storage bucket, not public URLs.
- Never store identity-document images in public profile/avatar or shop-cover buckets.
- Never place Supabase service-role/secret keys in the mobile/web client.
- Uploads and reads must be protected by server-side authorization and Storage policies. Applicants may only submit/read their own pending evidence; only explicitly authorized admins may review it.
- Use short-lived signed URLs only after an authorized access check; do not save permanent public URLs.
- Validate file types and size, use randomized object names, and prevent applicants from overwriting approved evidence without creating a new review.
- Minimize retention and restrict admin access. Agree a retention/deletion policy before production because national-ID images and face photos are sensitive personal data.
- Camera capture encourages a fresh photo, but without a liveness check it cannot guarantee that a person did not photograph a printed image or another screen.

## Proposed fields (not applied)

Prefer a dedicated application/evidence design rather than putting image bytes or public URLs in profile rows. Candidate fields to review:
- applicant user ID and role;
- private Storage object path for front-side national-ID evidence;
- private Storage object path for driving-licence evidence (rider only);
- private Storage object path for in-app face photo (rider only);
- review status: draft / submitted / needs_changes / approved / rejected;
- submitted, reviewed, and updated timestamps;
- reviewer user ID and decision reason.

The exact table design, driving-licence image requirements, RLS policies, Storage policies, admin authorization method, and retention period require inspection of the existing RPCs and security policies and owner approval before any migration.

## Safety checks still required

- Inspect current profile registration/approval RPCs and their authorization checks.
- Inspect RLS policies and existing Storage buckets/policies before adding anything.
- Verify the admin identity comes from trusted server-side records, not user-editable metadata.
- Test that an applicant cannot read another applicant's files, cannot approve themselves, and cannot use merchant/rider functions while pending or rejected.
- Run build and end-to-end tests after implementation. The current phone-OTP branch itself still needs fresh CI and real SMS-provider testing.


## Confirmed decisions added on 2026-10-25 (still design-only)

- Merchant and rider must submit either a photo of the bank passbook page or a screenshot/photo from their banking app through Dumri.
- The single reviewer for identity and bank evidence must check that the bank account holder name matches the name on the national ID submitted by that applicant. If it does not match, the application must not be approved until the discrepancy is resolved.
- If evidence is rejected, show the applicant the review reason and allow a corrected resubmission. The revised evidence must return to the review queue, and the decision history should be retained.
- The platform owner needs a separate owner dashboard for business overview and admin management.
- The owner/Super Admin can manage multiple staff admins with different permission sets. A normal user must never self-register as an admin. Admin accounts and privileges must be granted only through trusted system-side setup/authorization.
- Keep database and live authorization changes on hold until the owner has reviewed and approved the detailed design.

## Additional read-only inspection findings (2026-10-25)

- The current database already has `admin_profiles`, owner-management RPCs (including `fn_owner_list_admins`, `fn_owner_upsert_admin`, `fn_owner_revoke_admin`) and an admin-access audit table. This suggests an owner/staff permission model already exists in part; it must be reviewed and reused where safe rather than creating a competing design.
- The current owner check in `fn_assert_owner()` uses the existing user ID `1` as well as an active `admin_profiles` row with `admin_level = 'owner'`. Confirm the intended owner-account setup and recovery procedure before relying on it in the UI.
- The existing `fn_owner_upsert_admin()` only permits a fixed list of permission keys. The frontend must match that allowlist and must not assume all admin roles have identical powers.
- The current `fn_register_profile()` rejects `p_role = 'admin'`, but its body only explicitly checks that `auth.uid()` is non-null before inserting a profile. It does not visibly check the Auth user's phone-confirmation timestamp or that `p_phone` equals the verified Auth phone. This needs a security review before treating the RPC as a trusted registration boundary; no function was changed.
- The current rider-profile RPC accepts bank name/account text and a national-ID number, but the reviewed schema does not establish a secure upload workflow for national-ID images, licence evidence, face photos, or bank proof images. A private evidence bucket and strict owner/admin authorization still need to be designed.
- Current Storage inspection found a private `payment-slips` bucket, but no identity-verification evidence bucket was present in the bucket listing. Existing Storage policies allow authorized payment-slip access only; do not reuse that bucket for identity documents.
- The read-only policy inventory found 17 public tables with RLS enabled but no table policies. Some may be intentionally RPC-only, so do not add broad policies. Review each table and its callable RPCs before deciding whether any policy is missing.
- Security Advisor reports callable `SECURITY DEFINER` functions and disabled leaked-password protection. Each privileged RPC needs a function-by-function authorization review; do not bulk-revoke or bulk-change functions without checking callers and intended behavior.

## Auth/dashboard progress note

- The dashboard now reads the signed-in user's own profile through the existing `fn_my_profile()` RPC and displays the database role and account status. It does not use editable Auth metadata as authorization and does not grant capabilities based on the display.
- This is a code-only UI improvement. Role-specific operational screens, the owner business overview, and the owner admin-management interface are still not implemented. The current database has some owner/admin RPCs, but safe UI integration must follow a review of their allowlist, owner-account recovery, and current permissions.
- The dashboard change does not solve the registration RPC gap noted above and does not constitute an end-to-end Auth test.

## Build status note

- A CI build failed because `VerifyPhonePage.tsx` declared an unused `setPhone` state setter. The unused state declaration was removed in code-only commit `7b54243a9ffdedb571190175ebcabbce717d09b0`; GitHub Actions CI run #39 then completed successfully for that code commit. This verifies the TypeScript/Vite build only, not real SMS delivery or end-to-end Supabase Auth. No database changes were made.


## Owner/Super Admin bootstrap — design only, approved direction (2026-10-25)

The owner explicitly chose to design a safer owner setup that does **not** grant ownership automatically to database user ID `1`. No database, Auth users, SQL functions, permissions, or application authorization were changed by this decision.

### Current state observed read-only

- The database currently has exactly one active `admin_profiles` row with `admin_level = 'owner'`, and it belongs to `public.users.id = 1`.
- `public.users.id = 1` is currently active, has role `admin`, and is linked to an Auth UID.
- `fn_assert_owner()` currently requires all of: authenticated session, `fn_my_user_id() = 1`, role `admin`, active owner-level `admin_profiles` row, active user status, and matching `auth_uid`.
- Therefore the current owner-management RPCs are still coupled to ID 1. Do not remove or change this guard until a reviewed replacement has been prepared and tested, or the existing owner account could lose access.
- Existing `fn_owner_upsert_admin()` permits only a fixed list of staff permission keys and prevents staff from receiving owner level. It requires a pre-existing user linked to Auth. Preserve least privilege and the audit log.

### Proposed safe bootstrap sequence (not implemented)

1. The project owner first confirms access to the correct Supabase project and an Auth account they control; require successful Auth verification and a strong recovery method.
2. Use a one-time, trusted setup process outside the public signup UI to link the verified Auth UID to the owner record. Never use a client-provided user ID, editable user metadata, a hard-coded numeric ID, or a normal signup role field as proof of ownership.
3. Make the bootstrap process single-use and fail closed after an active owner has been established. It must not expose a reusable setup secret to the browser; if a server-side Edge Function is used, keep secrets in server-side environment variables, validate the caller and requested Auth UID, and disable/reject bootstrap after first success.
4. The database owner guard must check a trusted owner record linked to `auth.uid()`, active account status, and owner level. It must not grant owner status solely because a row has a particular numeric ID or because a claim in user-editable metadata says `owner`.
5. Maintain exactly one active owner unless a deliberate owner-transfer/recovery process is designed and approved. Staff admins can be many, but cannot promote themselves, edit the owner, or grant owner permissions.
6. Every owner action that adds, edits, disables, or restores a staff admin must be server-authorized and audit-logged. UI hiding alone is not authorization.
7. Before switching the guard, test both the current owner's continued access and denial for customer, merchant, rider, ordinary admin, unauthenticated sessions, and stale/disabled owner accounts. Prepare a recovery path so a failed rollout cannot permanently lock the owner out.
8. Only after the owner reviews the detailed migration and test plan should schema/functions/permissions be changed. Take a backup/export and run Security Advisor after the approved change.

### Important boundaries

- The public registration flow must never create an owner or admin based on submitted role or user metadata.
- The current ID-1 owner guard remains unchanged until an approved migration is implemented.
- Do not merge the open draft PR or apply SQL changes without explicit owner approval.
- This plan is not yet proof that the current owner account has a configured recovery method or MFA; inspect/confirm that separately.


## Owner login — email/password plus a second factor (2026-10-25; design only)

The owner confirmed this login direction. This is a product/design decision only; it does not change the Supabase database, Auth settings, deployed functions, live permissions, or application behavior.

- Owner signs in with email and password, then must complete a second-factor challenge before accessing owner-only features.
- Owner MFA must be enforced by server-verified authentication state, not by a frontend-only screen or a user-editable profile field.
- Owner privileges remain separate from staff-admin permissions. The existing ID-1 owner guard must not be changed until a reviewed migration and recovery/test plan is approved.
- The exact second-factor method is still undecided. Compare supported options and confirm with the owner before implementing or enabling MFA.
- Before implementation, inspect current Supabase Auth MFA support/settings and the app's login/session flow. Keep customer phone SMS OTP behavior unchanged unless the owner separately approves a change.
- No database, Auth configuration, Storage, RPC, or live authorization changes are authorized by this decision.


### Owner MFA method selected (2026-10-25; design only)

- The owner selected the first option: an authenticator app (for example, Google Authenticator or Microsoft Authenticator) as the second factor.
- Planned owner sign-in: email + password, then a server-verified time-based one-time password (TOTP) challenge, before granting access to owner-only features.
- The implementation must use Supabase-supported MFA APIs and verify the session's achieved assurance level before sensitive owner actions; a frontend-only challenge is not sufficient.
- Enrollment, recovery codes/recovery process, lost-device handling, and whether owner access should require a fresh MFA challenge for high-risk actions must be designed and reviewed before enabling this in production.
- This selection does not authorize changes to database schema, Auth configuration, RPCs, live permissions, or deployment. Customer SMS OTP remains unchanged.


### Owner MFA recovery selected (2026-10-25; design only)

- The owner accepted the recommended recovery approach: generate recovery codes in advance, store them securely offline, and provide a carefully verified account-recovery procedure for lost-device scenarios.
- Recovery codes must be high-entropy, single-use, stored/displayed only at enrollment or regeneration, and invalidated after use or regeneration. Store only secure verifiers/hashes server-side if the chosen supported implementation permits it; never log codes or expose them in analytics.
- Recovery must not rely solely on a user-editable profile field, a staff admin's discretion, or knowledge of a numeric user ID. The recovery process must verify control of the owner account through a separate trusted method, be audited, and prevent staff admins from promoting themselves to owner.
- Before implementation, confirm the exact Supabase-supported TOTP enrollment, challenge, assurance-level enforcement, and recovery capabilities. Do not invent a recovery-code feature if the platform does not provide it natively; if a custom secure recovery flow is required, design and review it separately.
- No database schema, Auth configuration, RPC, live permission, or deployment changes are authorized by this decision.


### Technical correction after checking current Supabase MFA docs (2026-10-25; design only)

- Supabase Auth's current MFA API documentation says recovery codes are not supported natively. Do not promise a built-in recovery-code feature or implement a homemade code store without a separate security design.
- Preferred first recovery safeguard: enroll a second TOTP authenticator factor/device under the owner's control, verify it works, and test the recovery procedure before relying on it. Supabase currently permits multiple factors (up to 10), but the exact UX and owner-only enforcement must be implemented and tested.
- If all enrolled authenticator devices are lost, use a separately designed, strongly verified account-recovery procedure with audit logging. Its trusted verification method, authorization boundaries, rate limits, and lockout recovery must be reviewed before implementation.
- Require the session to reach Supabase MFA assurance level AAL2 for owner-only access and sensitive owner actions; frontend-only routing is not a security boundary.
- This correction updates the design document only. No database, Auth configuration, Storage, RPC, permissions, or deployment was changed.


### Owner MFA backup-device requirement confirmed (2026-10-25; design only)

- The owner accepted the recommendation to require a second authenticator factor/device under the owner's control before enabling the owner account for normal owner-only operations.
- Enrollment must not be considered complete until both the primary and backup TOTP factors have been enrolled and successfully challenged. The UI should explain safe setup and storage, and should not display or imply that the account is protected by a working backup factor until its challenge succeeds.
- The recovery procedure for losing all enrolled devices remains a separate, strongly verified and audit-logged process; Supabase does not natively provide recovery codes.
- This records the owner's decision only. No database, Auth configuration, Storage, RPC, permissions, or deployment changes were made.
