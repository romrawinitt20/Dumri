# Dumri Auth/Profile Link Test Matrix

Date prepared: 2026-10-27 (Asia/Bangkok)
Status: **Test plan only — no tests executed by this document**
Target: the 2026-10-28 Auth/profile-link review in `docs/daily-execution-plan-20261026-to-20261120.md`.

## Scope and safety

- Target repository: Dumri only.
- Current `main` implementation uses phone/SMS OTP (`RegisterPage.tsx`, `VerifyPhonePage.tsx`, `ProtectedRoute.tsx`, `ensureCustomerProfile.ts`). Email OTP changes remain isolated in draft PR #4 and must not be assumed to be on `main`.
- Use an isolated Supabase staging project and disposable test accounts only. If staging is unavailable, mark runtime cases **BLOCKED / NOT RUN**; do not use production accounts as substitutes.
- This plan does not authorize a migration, production Auth/provider/template change, database/grant/RLS/Storage/permission change, account mutation, PR merge, or deployment.
- Never record OTP values, passwords, access/refresh tokens, service-role keys, or personal customer data in the report.

## Preconditions

1. Confirm the tested commit SHA and the Supabase environment is explicitly identified as staging (project reference only; never include secrets).
2. Capture the existing schema/function signature and grants read-only before any proposed database test.
3. Create disposable accounts with known role choice and test phone numbers controlled by the tester.
4. Confirm how the configured phone provider records the verified number in Auth. Do not assume `auth.users.phone` or `phone_confirmed_at` is populated until observed after OTP verification.
5. Save redacted screenshots/logs and exact test timestamps; redact all tokens and contact data.

## Test matrix

| ID | Scenario | Expected result | Evidence to record |
|---|---|---|---|
| A01 | Open protected dashboard without a session | Redirect to login; protected content not shown | URL and redacted screenshot |
| A02 | Session exists but phone is unconfirmed | Redirect to phone verification; no dashboard access | Auth state summary and screenshot |
| A03 | Valid SMS OTP for a disposable staging account | Verification succeeds; confirmed phone state is observed from the returned Auth user | Redacted result; never capture OTP |
| A04 | Wrong, expired, malformed, or reused OTP | Verification rejected; no profile is created as a side effect | Error category and profile count before/after |
| A05 | Refresh/open `/verify-phone` without router state | Current expected behavior is a restart/expired-context message; record as UX limitation, not an auth bypass | Screenshot and URL |
| P01 | Unauthenticated direct call to `fn_register_profile` | Denied; no user/profile row created | SQL/RPC error class and before/after counts in staging |
| P02 | Authenticated account with unconfirmed phone calls registration RPC | Denied by the approved server-side security boundary; if current function allows it, record a failure, do not remediate in production | RPC result and row counts |
| P03 | Auth phone A with client metadata/RPC phone B | Server must reject mismatch or ignore caller-supplied phone and use trusted verified identity; no row with phone B | Redacted Auth state, RPC result, row counts |
| P04 | Attempt role `admin` or unsupported role | Rejected; no admin profile or elevated access | RPC result and profile count |
| P05 | Change client-editable role metadata before profile creation | Must not grant privileges; only explicitly allowed signup choices and pending merchant/rider approval apply | Before/after role/status and denied access result |
| P06 | Call profile registration twice for the same Auth UID | Deterministic result; no duplicate row and no mutation of existing role/name/phone/status | IDs and selected before/after fields |
| P07 | Existing Auth UID with an existing profile | Ensure-profile path does not mutate identity, role, phone, status, or ownership | Redacted before/after comparison |
| R01 | Customer attempts to read/write another user's protected records | Denied or filtered to explicitly allowed rows | Query/RPC identity and row counts |
| R02 | Merchant attempts to access another merchant's shop/menu/order data | Denied | Two disposable merchant IDs and redacted result |
| R03 | Rider attempts to view an unassigned order | Denied | Disposable order/assignment state and result |
| R04 | Staff/inactive/disabled admin attempts owner-only operation | Denied unless a verified owner-level permission and required assurance level are present | Role/permission fixture and denial result |

## Known issue to validate before choosing remediation

The read-only report `docs/auth-profile-link-review-20261026.md` records that all 9 currently linked test Auth records had null `phone` and `phone_confirmed_at`, while linked profile phone fields were populated. This does not prove OTP is broken. The first release-gating experiment is A03 with a newly created disposable staging account. If the Auth record does not contain a trusted verified phone after successful OTP, **do not deploy** a migration that requires those fields until the identity design is revised and reviewed.

The current main RPC path passes client-editable `user_metadata` fields to `fn_register_profile`. The client-side phone confirmation check is not a server-side security boundary. The draft hardening proposal is not approved for deployment.

## Execution record (fill only after running tests)

- Tested commit SHA:
- Staging project reference (no secrets):
- Tester / timestamp (Asia/Bangkok):
- A01–A05 results:
- P01–P07 results:
- R01–R04 results:
- Failed/blocked cases and sanitized evidence links:
- Follow-up decision:
- Production changes: **None authorized by this plan**.

Do not mark any case PASS without repeatable evidence. Build success alone does not satisfy this matrix.


## Environment readiness check — 2026-10-27

- A read-only Supabase project-list check returned one project available to this connection: `Dumri` (project ref `vdmqhgdcfsswinlilwyn`). No separate staging/test project was listed.
- Treat the available Dumri project as shared/live and **do not run the runtime matrix against it**. This is an environment-readiness finding, not a claim that the app or OTP is broken.
- Runtime cases A01–A05, P01–P07, and R01–R04 remain **BLOCKED / NOT RUN** until an isolated staging project is available and explicitly identified. Do not create/promote/delete accounts, run SQL/RPC probes, or change Auth/DB/Storage/grants/policies in the only available project to work around this blocker.
- Next safe action: owner provisions or connects an isolated staging project, then the tester records its project ref (no secrets) and runs the matrix with disposable accounts.
