# LOGD

LOGD is a photo-first food diary for iOS, Android, and web. This is the initial application foundation, not a released product.

## Technology

- Expo SDK 57, Expo Router, React Native, TypeScript
- Neon PostgreSQL, Drizzle ORM and Drizzle Kit
- A private Neon Object Storage bucket named meal-photos

## Getting started

Requirements: Node.js 22.13+ and npm.

1. Clone this repository.
2. Run npm install at the repository root.
3. Run npm run web for the browser, or npm run ios / npm run android on a configured mobile development environment.
4. Run npm run typecheck to validate the TypeScript code.

Create a free Expo account at https://expo.dev/signup for EAS cloud builds and publishing. No Drizzle account is needed.

## Database schema

The initial Drizzle schema lives in packages/db/src/schema.ts and models foods, remixes, meals, meal items, nutrition snapshots and food reports.

To prepare migrations:
1. Copy packages/db/.env.example to packages/db/.env.
2. Replace the placeholder DATABASE_URL with the Neon connection string using your own secure environment.
3. Run npm run db:generate to generate SQL migrations.
4. Review the generated SQL before running npm run db:migrate against a development branch.

No migration is automatically applied to the Neon production branch.

## Upcoming milestones

- Secure app/API authentication with Better Auth and Expo integration
- Food search, full nutrition profiles, user-owned foods, remixes and reports
- Private meal-photo uploads, AI recognition and portion correction
- Daily nutrition diary, offline support and cross-device synchronization

Do not commit database passwords, tokens, API keys, local environment files or user photos. This repository is public.
