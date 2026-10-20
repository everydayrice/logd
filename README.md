# LOGD

LOGD is a photo-first nutrition tracker for iOS, Android and the web. The first application and backend scaffolds are in place. This is an early build, not a shipped product.

## Stack

- `apps/app`: Expo Router, React Native and TypeScript for iOS, Android and web
- `apps/api`: Hono on Cloudflare Workers for the secure backend
- `packages/db`: Drizzle ORM schema for Neon PostgreSQL
- Private Neon Object Storage bucket: `meal-photos`

## Getting started

Requirements: Node.js 22.13+ and npm.

1. Clone this repository.
2. Run `npm install` from the repository root.
3. Run `npm run web`, `npm run ios` or `npm run android` to start the Expo app.
4. Run `npm run api:dev` for the API, or `npm run api:check` to verify the Worker bundle.
5. Run `npm run typecheck` to validate TypeScript.

A free Expo account is useful for EAS cloud builds and publishing. Drizzle does not require an account.

## Database migrations

The initial Drizzle schema in `packages/db/src/schema.ts` models foods, remixes, meals, nutrition snapshots and food reports.

1. Copy `packages/db/.env.example` to `packages/db/.env`.
2. Provide a Neon **development branch** database URL through the local environment, never in Git.
3. Run `npm run db:generate` to generate and review SQL migrations.
4. Run `npm run db:migrate` only against the intended branch.

The production Neon branch is not automatically migrated from GitHub.

## Cloudflare deployment

Cloudflare Builds is linked to `everydayrice/logd` on `main` and set to deploy the `apps/api` directory as the existing Worker named `logd`. The Worker currently provides public `/` and `/health` endpoints only.

Runtime secrets and private credentials must be configured as Worker secrets, never placed in `wrangler.jsonc`, the Expo bundle, or committed environment files.

## Next milestones

- Implement Better Auth with Expo-compatible sessions, Apple and Google sign-in.
- Connect the Worker to Neon using environment-based credentials.
- Generate and safely apply versioned Drizzle migrations on the development branch.
- Build food search, nutrition calculation and logged meals.
- Add authenticated private meal-photo upload, AI analysis and portion correction.
- Improve native/web diary UIs, offline caching, tests and production security.

Do not commit secrets, database passwords, private user photos or API keys.
