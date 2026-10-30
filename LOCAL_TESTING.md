# Dumri local test environment (Docker + Supabase CLI)

This branch is a preparation branch only. It does not change the hosted Dumri Supabase project, production data, Auth settings, GitHub main branch, or Netlify deployment.

## Important current limitation

The repository currently has no `supabase/` migration files and no lockfile was found on `main`. The hosted database has an existing schema, but the schema has **not** been exported into version-controlled migrations. Therefore, starting the local stack now creates an isolated, mostly empty local database; it does not copy hosted tables, users, storage objects, policies, RPC functions, or data.

Do not use `supabase db reset --linked`, `supabase db push`, `supabase migration up --linked`, or any command that writes to a hosted project as part of this local test setup. Do not run `supabase link` yet. A read-only schema baseline must be reviewed and approved before importing it into local migrations.

## Requirements on your computer

- Git
- Node.js 20 or later (required by the Supabase CLI when run through npx/npm)
- npm
- Docker Desktop (Windows/macOS/Linux) or another Docker-compatible runtime
- At least 7 GB RAM allocated to Docker for the full local stack
- Internet for the first image download

## Start locally

Run these commands from the repository root on branch `test/local-supabase-docker`:

```bash
git checkout test/local-supabase-docker
node --version
npm --version
docker version
docker info
npm install
npx --yes supabase@latest --version
npx --yes supabase@latest start
npx --yes supabase@latest status
```

The first `start` downloads local service images and may take several minutes. The local Studio is normally at http://127.0.0.1:54323 and the local API at http://127.0.0.1:54321. Use the exact URLs and keys printed by `supabase status`; never copy hosted project keys into local environment files.

## Connect the frontend to local services

1. Copy `.env.local.example` to `.env.local`.
2. Get the local anon/publishable key from `npx --yes supabase@latest status`.
3. Put that local key into `.env.local` (do not commit the file).
4. Start Vite with `npm run dev -- --host 127.0.0.1`.
5. Open http://127.0.0.1:5173.

The current app's Auth screens are phone/SMS OTP oriented. Local Auth delivery and OTP behavior must be verified against the local stack output before treating signup/login as passed. The current hosted Email OTP issue is not fixed by this local environment.

## Safe test sequence

1. Verify Docker and the local Supabase stack are healthy.
2. Verify the frontend points only to `http://127.0.0.1:54321`.
3. Verify local Auth signup/sign-in with throwaway test accounts only.
4. Import a reviewed local schema baseline (not present yet), then run schema/RLS/RPC tests locally.
5. Test each role with separate throwaway accounts: customer, merchant, rider, admin.
6. Test demo ordering and simulated payment only. Do not connect a real payment provider or use real customer identity documents.
7. Record pass/fail evidence before proposing any changes to hosted Dumri.

## Current app scope found on main

- Vite + React + TypeScript; scripts: `npm run dev`, `npm run build`, `npm run preview`.
- Supabase JS client is pinned to 2.57.4 in `package.json`.
- The README describes phone/SMS OTP and a `/demo` order flow held in browser memory; it explicitly says demo orders are not written to Supabase and no real payment is accepted.
- The frontend has `/login`, `/register`, `/verify-phone`, `/dashboard`, `/demo`, and `/demo/payouts` routes.
- The README states the current branch is a starter, not a production-ready system.

## Stop local services

```bash
npx --yes supabase@latest stop
```

This stops the local stack. It does not pause, delete, or modify the hosted Dumri project.

## Never do during this preparation

- Do not run `supabase link` until the user explicitly approves a separate read-only schema extraction step.
- Do not run `db push`, `migration up --linked`, `db reset --linked`, or deploy functions/config to the hosted project.
- Do not put service-role/secret keys, OTPs, passwords, access tokens, ID card images, or bank documents in Git.
- Do not merge this branch into `main` without the user's explicit approval.
