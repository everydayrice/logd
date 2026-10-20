# LOGD API

Cloudflare Worker deployed from the `apps/api` directory.

- `GET /`: public service descriptor
- `GET /health`: public health endpoint
- All other paths currently return a JSON 404 response.

Run `npm run dev -w @logd/api` from the monorepo root for local development.

## Infrastructure

The Cloudflare Worker is `logd` in the RICE account. Its GitHub build is connected to `everydayrice/logd` on `main` and uses `apps/api` as the root directory. Configure runtime database connections and signing secrets using Cloudflare Worker secrets, never committed files.

No database tables, user authentication, AI processing or photo-upload route is implemented yet.
