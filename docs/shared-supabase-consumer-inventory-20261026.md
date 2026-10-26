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


## Applied migration inventory snapshot

Read-only Supabase migration listing checked on 2026-10-26 returned **89 applied migration records**, from `20261023145910` (`fix_gp_qualifying_order_calculation`) through `20261024194639` (`restrict_direct_execution_of_admin_assign_rider_raw`). Names indicate broad functional areas, but names alone do not verify exact SQL behavior or cross-app ownership.

| Version | Applied migration name |
|---|---|
| `20261023145910` | `fix_gp_qualifying_order_calculation` |
| `20261023150122` | `restrict_sensitive_rpc_execution` |
| `20261023150211` | `restrict_account_and_rider_rpc_execution` |
| `20261023150641` | `validate_order_item_options` |
| `20261023150730` | `harden_public_rpc_functions` |
| `20261023151055` | `secure_admin_dashboard_rpcs` |
| `20261023151128` | `set_search_path_on_definer_functions` |
| `20261023151401` | `scope_order_item_reads_and_guard_rider_jobs` |
| `20261023151423` | `set_search_path_on_remaining_public_functions` |
| `20261023151457` | `remove_legacy_broad_order_item_option_policy` |
| `20261023151715` | `add_core_order_and_billing_indexes` |
| `20261023151807` | `guard_rider_order_transitions_and_high_value_cash_orders` |
| `20261023151831` | `index_foreign_key_lookup_columns` |
| `20261023151915` | `restrict_user_table_column_privileges` |
| `20261023151933` | `optimize_users_rls_and_remove_duplicate_index` |
| `20261023152000` | `lock_internal_configuration_and_audit_tables` |
| `20261023152957` | `add_merchant_invoice_order_snapshots` |
| `20261023153015` | `add_admin_merchant_invoice_payment_record` |
| `20261023153239` | `add_rider_wallet_ledger_tables` |
| `20261023153633` | `add_secure_rider_wallet_read_rpc` |
| `20261023153644` | `add_secure_rider_wallet_history_rpc` |
| `20261023153716` | `prevent_changes_to_paid_merchant_invoices` |
| `20261023153956` | `integrate_cash_gp_debit_into_rider_delivery` |
| `20261023154029` | `add_admin_rider_wallet_adjustment` |
| `20261023154318` | `add_rider_monthly_bonus_settlement` |
| `20261023154345` | `index_rider_bonus_audit_foreign_keys` |
| `20261023154658` | `add_audited_rider_wallet_topups` |
| `20261023154733` | `add_admin_platform_finance_summary` |
| `20261023154749` | `correct_admin_platform_finance_summary_totals` |
| `20261023155132` | `harden_customer_order_placement` |
| `20261023155247` | `fix_and_harden_admin_payment_verification` |
| `20261023155647` | `harden_order_cancellation_and_prevent_paid_order_loss` |
| `20261023155718` | `restrict_direct_order_table_mutations` |
| `20261023160047` | `secure_customer_payment_submission` |
| `20261023160150` | `close_pending_payments_on_order_cancellation` |
| `20261023160456` | `add_audited_refund_workflow` |
| `20261023160553` | `add_secure_refund_status_queries` |
| `20261023160806` | `add_admin_financial_reconciliation_report` |
| `20261023161046` | `create_platform_finance_setting_audit` |
| `20261023161055` | `audit_tax_reserve_reallocation_trigger` |
| `20261023161119` | `add_admin_tax_reserve_audit_reader` |
| `20261023161235` | `set_platform_tax_reserve_to_seven_percent` |
| `20261023161500` | `index_uncovered_finance_and_refund_foreign_keys` |
| `20261023161828` | `allow_retry_after_rejected_refund_request` |
| `20261023162057` | `secure_private_payment_slip_storage` |
| `20261023162750` | `secure_merchant_profile_onboarding` |
| `20261023163020` | `tighten_menu_management_policies` |
| `20261023163240` | `enforce_order_payment_threshold` |
| `20261023163601` | `harden_admin_payment_verification` |
| `20261023163825` | `harden_rider_job_acceptance` |
| `20261023164005` | `fix_admin_guard_null_role_check` |
| `20261023164045` | `pin_search_path_utility_functions` |
| `20261023164247` | `harden_rider_order_status_updates` |
| `20261023164503` | `add_secure_merchant_order_status_workflow` |
| `20261023164534` | `anonymize_public_review_names` |
| `20261023164721` | `pin_order_workflow_search_paths` |
| `20261023164939` | `restrict_profile_column_privileges` |
| `20261023165015` | `make_public_review_reader_invoker` |
| `20261023165051` | `secure_self_profile_update_rpc` |
| `20261023165113` | `pin_registration_function_search_path` |
| `20261023165649` | `add_owner_controlled_admin_permissions` |
| `20261023165733` | `scope_admin_approval_payment_and_order_access` |
| `20261023165837` | `add_scoped_pending_payment_review_queue` |
| `20261023165848` | `preserve_customer_access_when_revoking_admin` |
| `20261023170200` | `add_accounting_reports_and_company_expenses` |
| `20261023170251` | `fix_accounting_thai_date_ranges_and_yearly_report` |
| `20261023170531` | `add_accounting_expense_categories_and_order_export` |
| `20261023172335` | `enforce_owner_only_admin_management_and_expense_approval` |
| `20261023172407` | `add_owner_expense_review_capability_check` |
| `20261024175028` | `add_rider_profile_self_registration` |
| `20261024175114` | `harden_rider_profile_registration_validation` |
| `20261024180211` | `seed_dumri_launch_zones` |
| `20261024180449` | `restrict_merchant_profile_self_update_columns` |
| `20261024180514` | `restrict_rider_profile_self_update_columns` |
| `20261024181019` | `add_secure_my_profile_rpc` |
| `20261024181246` | `secure_merchant_store_open_and_menu` |
| `20261024181600` | `add_secure_rider_online_toggle` |
| `20261024181630` | `enforce_rider_delivery_transition_timestamps` |
| `20261024181940` | `guard_order_checkout_payment_and_merchant_status` |
| `20261024182235` | `harden_remaining_function_search_paths` |
| `20261024182539` | `harden_order_payment_rider_search_paths` |
| `20261024182610` | `harden_customer_order_refund_search_paths` |
| `20261024182935` | `harden_rider_job_acceptance_and_status` |
| `20261024183136` | `prepare_order_payment_installments` |
| `20261024183408` | `restrict_rider_available_jobs_to_active_riders` |
| `20261024184345` | `index_remaining_finance_audit_foreign_keys` |
| `20261024191315` | `restrict_admin_definer_rpc_to_authenticated` |
| `20261024191354` | `restrict_direct_notification_rpc` |
| `20261024194639` | `restrict_direct_execution_of_admin_assign_rider_raw` |

This is a metadata inventory only. It is not authorization to rerun, edit, reverse, or apply migrations. Any future change needs the actual migration SQL, dependency analysis, isolated validation, rollback plan, and owner approval where production/shared resources are affected.
