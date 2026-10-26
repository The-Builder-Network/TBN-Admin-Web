# TBN Admin

Internal admin dashboard for The Builder Network: review and verify tradesperson profiles, resolve lead-credit requests, manage users, jobs, reviews and lead fees.

Vite + React 18 + TypeScript + Tailwind + shadcn/ui, @tanstack/react-query, react-router-dom. Same colour tokens and font as TBN-Web.

## Setup

```sh
pnpm install
cp .env.example .env   # optional; defaults to http://localhost:3000
pnpm dev               # http://localhost:5174
```

Needs TBN-Server running, with `http://localhost:5174` allowed by CORS. Sign in with an `ADMIN` account; any other role is rejected.

## Env

| Variable       | Default                 | Notes                              |
| -------------- | ----------------------- | ---------------------------------- |
| `VITE_API_URL` | `http://localhost:3000` | API origin, no trailing slash. Baked in at build time. |

## Scripts

- `pnpm dev`: dev server on port 5174 (strict)
- `pnpm build`: type-check (`tsc -b`) and build static files to `dist/`
- `pnpm lint`: ESLint (same config as TBN-Web)
- `pnpm preview`: serve the built `dist/` on port 5174

## Auth

Tokens live in `localStorage`. `src/lib/api.ts` adds the bearer token, refreshes once on a 401 (concurrent 401s share one refresh), and signs out if the refresh fails.

## Deploy

1. Build with the production API: `VITE_API_URL=https://<production-api> pnpm build`.
2. Host `dist/` as a static site at `https://admin.thebuildernetwork.com`, with an SPA fallback that serves `index.html` for unknown paths.
3. On the server, add `https://admin.thebuildernetwork.com` to `ADMIN_URL` so CORS allows the admin origin.
# TBN-Admin-Web
