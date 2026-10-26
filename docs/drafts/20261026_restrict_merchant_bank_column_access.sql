-- DRAFT ONLY — DO NOT RUN AGAINST LIVE DATABASE WITHOUT REVIEW/APPROVAL
-- Dumri high-priority mitigation: restrict direct reads of merchant payout details.
-- Inspected live schema on 2026-10-26:
-- merchant_profiles is RLS-enabled; anon/authenticated have table SELECT;
-- the verified-shop policy allows public reads of verified rows; the table includes
-- bank_name, bank_account, approved_by and approved_at.
--
-- Intended effect:
--   * Keep row-level policy behavior.
--   * Remove table-wide SELECT for anon/authenticated.
--   * Grant SELECT only on explicitly public-safe shop columns.
--   * Do not change data, RLS policies, write privileges, Auth settings, or Storage.
--
-- IMPORTANT:
--   1. Audit all deployed clients for SELECT * / direct reads that expect private columns.
--   2. Test all shop browse, merchant profile, order placement, and admin review flows.
--   3. This is a privilege migration, not a complete fix for all identity-data storage.
--   4. Run in staging first, verify expected results, and have a rollback plan.
--   5. Do not use this draft as a substitute for private document Storage policies.

BEGIN;

REVOKE SELECT ON TABLE public.merchant_profiles FROM anon, authenticated;

-- These columns are intended to be customer-facing shop directory data.
-- Deliberately exclude bank_name, bank_account, approved_by and approved_at.
GRANT SELECT (
  user_id,
  shop_name,
  shop_slug,
  category,
  description,
  phone,
  address_text,
  lat,
  lng,
  zone_id,
  cover_url,
  is_open,
  prep_time_min,
  rating_avg,
  rating_count
) ON TABLE public.merchant_profiles TO anon, authenticated;

-- Review-only verification. Inspect the returned privileges before committing in
-- a controlled staging run. This query does not prove that every frontend flow works.
SELECT
  has_table_privilege('anon', 'public.merchant_profiles', 'SELECT') AS anon_table_select,
  has_column_privilege('anon', 'public.merchant_profiles', 'bank_account', 'SELECT') AS anon_can_read_bank_account,
  has_column_privilege('anon', 'public.merchant_profiles', 'shop_name', 'SELECT') AS anon_can_read_shop_name,
  has_column_privilege('authenticated', 'public.merchant_profiles', 'bank_account', 'SELECT') AS authenticated_can_read_bank_account,
  has_column_privilege('authenticated', 'public.merchant_profiles', 'shop_name', 'SELECT') AS authenticated_can_read_shop_name;

-- Expected: anon_table_select=false; both bank_account checks=false;
-- both shop_name checks=true. If any expected result differs, ROLLBACK.
-- This file intentionally does not COMMIT. Reviewer must decide commit/rollback
-- after validating results and testing all dependent app flows.
