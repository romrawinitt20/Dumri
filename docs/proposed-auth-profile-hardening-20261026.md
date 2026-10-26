# Proposed Auth Profile Registration Hardening — Draft Only

Date: 2026-10-26  
Status: **Proposal only — NOT applied to Supabase**  
Target: Dumri project `vdmqhgdcfsswinlilwyn`  
Prerequisite: review migration in a disposable/staging project, then run the negative-test matrix in `auth-profile-link-review-20261026.md`.

## Scope

Replace the body of the existing `public.fn_register_profile(varchar, varchar, public.user_role, varchar)` function while preserving its signature for current client compatibility. The proposal:

- Requires a logged-in Auth user.
- Reads the phone, confirmation timestamp, and email from `auth.users` using `auth.uid()`.
- Requires a confirmed phone and uses the Auth phone as canonical; ignores caller-supplied `p_phone`.
- Rejects `admin` and any role other than customer/merchant/rider.
- Returns an existing profile for the same Auth UID without modifying it.
- Uses the existing unique `users.auth_uid` constraint to protect against concurrent duplicate registration.
- Keeps customers active and merchant/rider accounts pending, matching the current business rule.
- Creates a customer profile only for a new customer, as the current function does.

## Preflight checks required before migration

Run in staging first. On production, run only after explicit approval and after backup/rollback planning.

```sql
-- Check any Auth phone that differs from its linked public profile.
SELECT u.id, u.auth_uid, u.phone AS profile_phone, au.phone AS auth_phone,
       au.phone_confirmed_at, u.role, u.status
FROM public.users AS u
LEFT JOIN auth.users AS au ON au.id = u.auth_uid
ORDER BY u.id;

-- Confirm duplicate Auth linkage is absent (the UNIQUE constraint should enforce this).
SELECT auth_uid, count(*)
FROM public.users
WHERE auth_uid IS NOT NULL
GROUP BY auth_uid
HAVING count(*) > 1;

-- Confirm existing constraint before relying on it.
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_auth_uid_key';
```

Current read-only inspection found 9 users, all 9 linked to an Auth UID, no missing profile phone values, and a UNIQUE constraint on `users.auth_uid`. A follow-up comparison found **all 9 Auth records have `auth.users.phone IS NULL` and `phone_confirmed_at IS NULL`**, while the corresponding `public.users.phone` values are populated. This is a release-blocking mismatch to investigate in the Auth/provider/test-account setup; do not assume these are valid confirmed-phone accounts and do not rewrite existing user data. The strict phone requirement below would reject new registrations until Auth phone storage/confirmation is verified end-to-end.

## Proposed replacement function

This SQL is a review artifact only. Do not execute it directly against production without a reviewed migration and explicit approval.

```sql
CREATE OR REPLACE FUNCTION public.fn_register_profile(
  p_phone character varying,
  p_full_name character varying,
  p_role public.user_role,
  p_email character varying DEFAULT NULL::character varying
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_phone text;
  v_phone_confirmed_at timestamptz;
  v_auth_email text;
  v_user_id bigint;
  v_status public.user_status;
  v_full_name varchar;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required'
      USING ERRCODE = '42501';
  END IF;

  -- Return an existing profile before new-registration validation so that
  -- a legacy linked account is not broken by this registration RPC.
  SELECT u.id INTO v_user_id
  FROM public.users AS u
  WHERE u.auth_uid = v_uid
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  SELECT au.phone, au.phone_confirmed_at, au.email
    INTO v_auth_phone, v_phone_confirmed_at, v_auth_email
  FROM auth.users AS au
  WHERE au.id = v_uid;

  IF NOT FOUND
     OR v_auth_phone IS NULL
     OR v_phone_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'confirmed Auth phone required'
      USING ERRCODE = '42501';
  END IF;

  IF p_role IS NULL
     OR p_role NOT IN (
       'customer'::public.user_role,
       'merchant'::public.user_role,
       'rider'::public.user_role
     ) THEN
    RAISE EXCEPTION 'unsupported signup role'
      USING ERRCODE = '22023';
  END IF;

  v_full_name := NULLIF(btrim(p_full_name), '');
  IF v_full_name IS NULL OR length(v_full_name) > 120 THEN
    RAISE EXCEPTION 'valid full name required'
      USING ERRCODE = '22023';
  END IF;

  -- Never trust p_phone or p_email as identity sources.
  -- Auth owns the canonical, confirmed phone and email.
  v_status := CASE
    WHEN p_role = 'customer'::public.user_role
      THEN 'active'::public.user_status
    ELSE 'pending'::public.user_status
  END;

  INSERT INTO public.users (
    phone, email, password_hash, full_name, role, status, auth_uid
  )
  VALUES (
    v_auth_phone,
    v_auth_email,
    '',
    v_full_name,
    p_role,
    v_status,
    v_uid
  )
  ON CONFLICT (auth_uid) DO NOTHING
  RETURNING id INTO v_user_id;

  -- Concurrent duplicate registration may win the insert race.
  IF v_user_id IS NULL THEN
    SELECT u.id INTO v_user_id
    FROM public.users AS u
    WHERE u.auth_uid = v_uid
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'profile registration did not complete';
  END IF;

  IF p_role = 'customer'::public.user_role THEN
    INSERT INTO public.customer_profiles (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN v_user_id;
END;
$function$;
```

## Important review notes

1. `p_phone` and `p_email` remain in the function signature for compatibility but are intentionally not trusted. A later cleanup may remove them only after all callers are inventoried and migrated.
2. This proposal still accepts the requested role as a signup choice, but only among customer/merchant/rider; merchant and rider accounts remain pending. If policy requires a separate application/approval record, design that explicitly rather than treating Auth metadata as authority.
3. The existing `password_hash` column is populated with an empty string by the current function. Confirm all code paths treat Supabase Auth as the only authentication source before considering a schema cleanup.
4. `ON CONFLICT (user_id)` assumes `customer_profiles.user_id` has a unique/primary-key constraint. Verify this in staging; if not, add a safe migration after duplicate preflight.
5. Phone uniqueness may reject a newly authenticated user if that phone is already attached to another profile. This should fail closed and trigger a support/reconciliation workflow, not overwrite the other account.
6. Review EXECUTE grants and function ownership in the migration; do not widen grants. Confirm `authenticated` is the intended caller and anonymous execution remains denied.
7. The client helper should later stop treating mutable `user_metadata` as the authoritative phone source. The database function remains the security boundary.
8. **Do not deploy this exact draft until the Auth phone mismatch is understood.** First test a disposable phone-OTP account end-to-end and verify `auth.users.phone` plus `phone_confirmed_at` are populated after OTP verification. If the provider configuration intentionally does not populate them, redesign the trusted server-side verification flow rather than trusting user metadata.
9. The existing-profile lookup is deliberately before the new-user confirmed-phone check, so this RPC remains idempotent for legacy linked accounts. New profile creation still fails closed until Auth phone verification is proven.

## Rollback

Rollback must restore the exact previous function definition captured from the target environment immediately before deployment, not a guessed version. Save the current definition and grants as a versioned migration artifact before applying. If any test fails, restore the previous definition, re-run registration/duplicate tests, and keep the release blocked. Do not delete or rewrite existing user records as part of rollback.

## Acceptance gate

Do not mark complete until tests prove: unconfirmed phone denied; metadata/RPC phone tampering cannot change canonical phone; admin role denied; duplicate/concurrent calls return one profile; existing profiles remain unchanged; duplicate phone collision fails closed; merchant/rider status stays pending; customer profile creation is idempotent; and all relevant grants/RLS checks pass.
