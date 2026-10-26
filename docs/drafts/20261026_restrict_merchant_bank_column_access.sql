-- REHEARSAL ONLY — THIS SCRIPT ALWAYS ROLLS BACK.
-- DO NOT RUN AGAINST LIVE DATABASE AS A FIX.
-- Dumri high-priority mitigation: restrict direct reads of merchant payout details.
-- Inspected live schema on 2026-10-26:
-- merchant_profiles is RLS-enabled; anon/authenticated have table SELECT;
-- the verified-shop policy allows public reads of verified rows; the table includes
-- bank_name, bank_account, approved_by and approved_at.
--
-- This rehearsal temporarily applies the proposed privilege change inside a
-- transaction, checks effective privileges, then ALWAYS ROLLS BACK. It does not
-- persist a fix. After client dependency checks and staging tests, prepare a separate
-- reviewed migration that intentionally commits.

BEGIN;

REVOKE SELECT ON TABLE public.merchant_profiles FROM anon, authenticated;

-- Public-safe shop directory columns only. Sensitive payout/approval fields excluded.
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

SELECT
  has_table_privilege('anon', 'public.merchant_profiles', 'SELECT') AS anon_table_select,
  has_column_privilege('anon', 'public.merchant_profiles', 'bank_account', 'SELECT') AS anon_can_read_bank_account,
  has_column_privilege('anon', 'public.merchant_profiles', 'shop_name', 'SELECT') AS anon_can_read_shop_name,
  has_column_privilege('authenticated', 'public.merchant_profiles', 'bank_account', 'SELECT') AS authenticated_can_read_bank_account,
  has_column_privilege('authenticated', 'public.merchant_profiles', 'shop_name', 'SELECT') AS authenticated_can_read_shop_name;

-- Expected: table-level SELECT=false; bank_account=false for both roles;
-- shop_name=true for both roles. Any mismatch requires investigation.
-- This only checks privileges; it does not test RLS row filtering or app compatibility.

ROLLBACK;
