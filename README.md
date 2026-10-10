# Godsotv

Godsotv is a Next.js + TypeScript online TV platform foundation with PostgreSQL/Prisma data models, GitHub OAuth-based admin allowlisting, a Cloudflare Stream live-input API, and a health endpoint.

## Configure

1. Create a PostgreSQL database.
2. Set environment variables from `.env.example` in local `.env` or your hosting provider:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate with `npx auth secret`)
   - `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`
   - `GODSOTV_ADMIN_EMAILS`: comma-separated email addresses permitted to use the admin studio.
   - `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_STREAM_API_TOKEN` (token requires Stream Write).
3. In GitHub Developer Settings, create an OAuth app with callback URL `https://YOUR-DOMAIN/api/auth/callback/github` (for local use `http://localhost:3000/api/auth/callback/github`).
4. Run `npm install`, `npx prisma db push`, `npm run dev`.
5. Health check: `/api/health`.

## Security notes

- Only GitHub OAuth identities whose verified email is in `GODSOTV_ADMIN_EMAILS` are permitted to sign in via the Auth.js callback.
- Keep all Cloudflare tokens and ingest keys server-side/private.
- The live-input API requires an authenticated allowlisted session, stores the created input in PostgreSQL and writes an audit log.
- Before production launch, add CSRF/rate limiting, stronger role management, validated webhooks, tests, upload workflow, content CRUD, and verify all provider response fields against the Cloudflare account's API response.
- Do not make an ingest key public. Rotate it immediately if exposed.
- The live input endpoint returns the stream key once to the authorized operator. Protect the browser session and never paste it into GitHub, logs, or a public page.

## Render deployment

Build: `npm install && npx prisma generate && npm run build`

Start: `npm run start`

Health check path: `/api/health`

Create a Render PostgreSQL database and add the connection string as `DATABASE_URL`. Add all auth and Cloudflare variables under the web service Environment tab. Do not commit actual secrets.
