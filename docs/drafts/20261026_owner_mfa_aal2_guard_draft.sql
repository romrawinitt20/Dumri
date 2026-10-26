-- DRAFT ONLY — DO NOT APPLY TO THE LIVE DATABASE YET.
-- Dumri owner MFA/AAL2 enforcement draft, 2026-10-26.
--
-- Scope: add AAL2 checks to the shared owner guards while preserving
-- staff-admin permission behavior. This draft intentionally DOES NOT remove
-- the current user_id = 1 owner bootstrap rule.
--
-- Before applying:
-- 1. Complete the audit of every SECURITY DEFINER function and all direct
--    admin checks/wrappers. This helper-only draft is not a complete audit.
-- 2. Confirm the owner can enroll and verify both TOTP factors.
-- 3. Test on a non-production project with owner AAL1 denied, owner AAL2
--    allowed, staff permissions unchanged, and non-admin roles denied.
-- 4. Prepare and test an owner lockout recovery plan.
-- 5. Obtain explicit approval for a live database migration.

CREATE OR REPLACE FUNCTION public.fn_assert_owner()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_me bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden: owner login required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(auth.jwt()->>'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'forbidden: owner MFA verification required' USING ERRCODE = '42501';
  END IF;

  v_me := public.fn_my_user_id();

  IF v_me IS DISTINCT FROM 1
     OR public.fn_my_role() IS DISTINCT FROM 'admin'::public.user_role
     OR NOT EXISTS (
       SELECT 1
       FROM public.admin_profiles ap
       JOIN public.users u ON u.id = ap.user_id
       WHERE ap.user_id = v_me
         AND ap.admin_level = 'owner'
         AND ap.is_active = true
         AND u.status = 'active'::public.user_status
         AND u.auth_uid = auth.uid()
     ) THEN
    RAISE EXCEPTION 'forbidden: owner permission required' USING ERRCODE = '42501';
  END IF;

  RETURN v_me;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_assert_admin()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_me bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden: owner login required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(auth.jwt()->>'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'forbidden: owner MFA verification required' USING ERRCODE = '42501';
  END IF;

  SELECT u.id INTO v_me
  FROM public.users u
  JOIN public.admin_profiles ap ON ap.user_id = u.id
  WHERE u.auth_uid = auth.uid()
    AND u.role = 'admin'::public.user_role
    AND u.status = 'active'::public.user_status
    AND ap.is_active = true
    AND ap.admin_level = 'owner'
    AND COALESCE(ap.permissions->>'all','false') = 'true'
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'forbidden: owner permission required' USING ERRCODE = '42501';
  END IF;

  RETURN v_me;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_assert_admin_permission(p_permission text)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_me bigint;
  v_permissions jsonb;
  v_admin_level text;
BEGIN
  IF auth.uid() IS NULL OR p_permission IS NULL OR length(btrim(p_permission)) = 0 THEN
    RAISE EXCEPTION 'forbidden: authenticated admin permission required' USING ERRCODE = '42501';
  END IF;

  SELECT u.id, ap.permissions, ap.admin_level
    INTO v_me, v_permissions, v_admin_level
  FROM public.users u
  JOIN public.admin_profiles ap ON ap.user_id = u.id
  WHERE u.auth_uid = auth.uid()
    AND u.role = 'admin'::public.user_role
    AND u.status = 'active'::public.user_status
    AND ap.is_active = true
  LIMIT 1;

  IF v_me IS NULL OR NOT (
    COALESCE(v_permissions->>'all','false') = 'true'
    OR COALESCE(v_permissions->>p_permission,'false') = 'true'
  ) THEN
    RAISE EXCEPTION 'forbidden: missing admin permission %', p_permission USING ERRCODE = '42501';
  END IF;

  IF v_admin_level = 'owner'
     AND COALESCE(auth.jwt()->>'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'forbidden: owner MFA verification required' USING ERRCODE = '42501';
  END IF;

  RETURN v_me;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(auth.jwt()->>'aal', 'aal1') = 'aal2'
    AND EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.admin_profiles ap ON ap.user_id = u.id
      WHERE u.auth_uid = auth.uid()
        AND u.role = 'admin'::public.user_role
        AND u.status = 'active'::public.user_status
        AND ap.is_active = true
        AND ap.admin_level = 'owner'
        AND COALESCE(ap.permissions->>'all','false') = 'true'
    );
$function$;

-- Important: audit all SECURITY DEFINER functions before using this draft.
-- Any owner-sensitive function that bypasses these helpers may still need a
-- direct AAL2 guard. Do not run this file as-is against production.
