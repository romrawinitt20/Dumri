# Dumri identity verification — review before implementation

Status: **design review only**. This document does not change the Supabase database, Storage buckets, access policies, or app behavior.

## Confirmed product rules

- Customer: phone SMS OTP verification; customer can use customer features after phone confirmation, subject to the existing system rules.
- Merchant: submit national ID evidence and shop information; must be reviewed and approved by an admin before merchant functions are enabled.
- Rider: submit national ID evidence, driving licence evidence, vehicle information, and a face photo captured in the Dumri app; an admin compares the face photo with the portrait on the licence and reviews the submitted information before approving rider access.
- No automatic face matching or liveness vendor is required for the initial version.
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
2. Merchant applicant submits national-ID image(s) and shop details.
3. Rider applicant submits national-ID image(s), driving-licence image(s), an in-app face photo, and vehicle details.
4. The app shows a clear preview and lets the applicant retake an unclear photo before submitting.
5. The application becomes pending review. Re-submission after rejection should be possible with an admin-provided reason.
6. An authorized admin views the private evidence, compares the rider face photo with the licence portrait, and records approve/reject plus a reason.
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
- The app's camera capture can encourage taking a fresh photo, but without a liveness check it cannot guarantee that a person did not photograph a printed image or another screen.

## Proposed fields (not applied)

Prefer a dedicated application/evidence design rather than putting image bytes or public URLs in profile rows. Candidate fields to review:
- applicant user ID and role;
- private Storage object path for national-ID evidence;
- private Storage object path for driving-licence evidence (rider only);
- private Storage object path for in-app face photo (rider only);
- review status: draft / submitted / needs_changes / approved / rejected;
- submitted, reviewed, and updated timestamps;
- reviewer user ID and decision reason.

The exact table design, file requirements (front/back), RLS policies, Storage policies, admin authorization method, and retention period require inspection of the existing RPCs and security policies and owner approval before any migration.

## Safety checks still required

- Inspect current profile registration/approval RPCs and their authorization checks.
- Inspect RLS policies and existing Storage buckets/policies before adding anything.
- Verify the admin identity comes from trusted server-side records, not user-editable metadata.
- Test that an applicant cannot read another applicant's files, cannot approve themselves, and cannot use merchant/rider functions while pending or rejected.
- Run build and end-to-end tests after implementation. The current phone-OTP branch itself still needs fresh CI and real SMS-provider testing.
