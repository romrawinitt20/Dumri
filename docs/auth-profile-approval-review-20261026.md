# Authentication and Role Approval Review — 2026-10-26

## Scope
Read-only review of Dumri branch `setup/supabase-auth-routes` and shared Supabase project `vdmqhgdcfsswinlilwyn`. No database, policy, permission, Auth-user, Storage, or live-data changes were made. PR remains unmerged.

## Build
GitHub Actions run `40302919758` succeeded, including dependency installation and production build.

## Findings
1. Login uses phone SMS OTP and does not create new users.
2. Registration sends name, phone, and selected role as Auth user metadata. After OTP verification, the client helper reads these metadata values and calls `fn_register_profile` if no profile exists.
3. `fn_register_profile` rejects admin self-registration and sets customer accounts active while merchant/rider accounts start pending.
4. The database function accepts a caller-supplied phone value and does not visibly verify that it matches the authenticated user's confirmed Auth phone. This is a profile-linking/data-integrity risk. No exploitation was attempted.
5. The dashboard and frontend route guard are not sufficient authorization by themselves; privileged actions must continue checking role, account status, ownership, and approval on the server.
6. Read-only inspection found server-side active/verified checks in key merchant and rider workflows, including merchant shop availability and rider online/job actions. Remaining write paths still need a complete inventory and regression tests.
7. The OTP screen relies on router navigation state, so refreshing it loses the registration/login context. This is a reliability issue, not an authorization mechanism.

## Proposed next steps — not applied
- Design a database-side validation that binds profile phone to the authenticated, confirmed Auth phone; test missing, unconfirmed, and mismatched values.
- Inventory all merchant and rider write RPCs and confirm pending or suspended accounts cannot perform role-specific actions.
- Test existing user accounts through normal OTP sign-in, without editing or creating Auth users.
- Keep owner MFA enforcement as a separate review; customer SMS OTP must remain unchanged.

## Regression checklist
- Existing confirmed customer/merchant/rider can sign in and load only their own profile.
- Pending merchant cannot publish/open a shop or update orders.
- Pending rider cannot go online, view eligible jobs, accept jobs, or advance delivery statuses.
- Active and verified users can only act on records they own or are assigned.
- Registration cannot create an admin profile, and mismatched phone values cannot be linked to a profile.
- Existing profiles are not overwritten or duplicated.

## Approval boundary
No database change has been applied. Before any change, show the exact proposed SQL, impact on Dumri and the paused Midnight Meals app sharing this project, verification steps, and rollback plan; obtain explicit approval first.
