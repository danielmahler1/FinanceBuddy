# AGENTS Guide for f25-cisc474-brown

This file orients agents to the repository’s purpose, structure, env requirements, and conventions. Its scope applies to the entire repo.

## Purpose
- Monorepo starter for a full‑stack TypeScript project used in CISC 474.
- Includes a NestJS API with Auth0 JWT auth and a Postgres database via Prisma, plus a React web app built with TanStack Start/Router/Query and Vite.

## Tech Stack
- Monorepo: Turborepo, npm workspaces
- Backend: NestJS 11, Prisma, PostgreSQL, Auth0 (JWT via JWKS)
- Frontend: React 19, TanStack Start/Router/Query, Vite, Tailwind CSS
- Tooling: ESLint, Prettier, Jest config package, Docker (Postgres), Render (API deploy), Wrangler (Cloudflare) for web

## Repository Layout
- `apps/api`: NestJS REST API
  - `src/main.ts`: bootstraps app, CORS based on `FRONTEND_URL`
  - Domain modules: `user`, `account`, `transaction`, `recurring-charge`, `income`, `goal`
  - Auth: `src/auth` with `jwt.strategy.ts` using Auth0 JWKS
- `apps/web-start`: React app with TanStack Start
  - Routes: `src/routes` (`index.tsx` landing, `dashboard.tsx`, `__root.tsx` shell)
  - Router/provider: `src/router.tsx`, API hooks `src/integrations/api.ts`
- `packages/database`: Prisma schema/client/seed
  - Schema: `packages/database/prisma/schema.prisma`
  - Seed: `packages/database/src/seed.ts`
- `packages/ui`: Minimal shared UI components (Button, Card, Code)
- `packages/{eslint-config, typescript-config, jest-config}`: shared config packages
- `packages/api`: placeholder for shared DTOs/types consumed by `apps/api`
- Root configs: `turbo.json`, `package.json`, `docker-compose.yml`, `render.yaml`

## Node & Tooling
- Recommended Node: 20+ (README mentions 22.12.x; Render pins 20). Use NVM where relevant.
- Package manager: npm (workspaces used); run commands at repo root unless noted.

## Environment Variables
Place a `.env` at repo root for the API/Prisma, and a `.env.local` under `apps/web-start` for Vite.

Backend/API (.env at repo root):
- `DATABASE_URL` — pooled Postgres connection (Prisma)
- `DIRECT_URL` — direct Postgres connection
- `AUTH0_ISSUER_URL` — e.g. `https://YOUR_TENANT.us.auth0.com/`
- `AUTH0_AUDIENCE` — your API Audience identifier (matches Auth0 API)
- `FRONTEND_URL` — allowed CORS origin, e.g. `http://localhost:3001`

Frontend/Web (apps/web-start/.env.local):
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_AUTH0_CALLBACK_URL` — e.g. `http://localhost:3001`
- `VITE_BACKEND_URL` — e.g. `http://localhost:3000`

## Local Development
1) Install deps: `npm install`
2) Database setup:
   - Ensure Postgres available (local or Docker). Docker: `docker compose up -d postgres`
   - Apply schema: `npx prisma db push`
   - Seed data: `npx prisma db seed`
3) Dev servers: `npm run dev`
   - API at port `3000` (respects `PORT`/`HOST`)
   - Web at port `3001` (Vite)

## Running via Turbo Scripts
- `npm run dev` — starts dev for workspaces (`apps/*`)
- `npm run build|lint|test|check-types` — runs across packages/apps
- DB helpers: `db:push`, `db:seed`, `db:migrate:*` proxied by Turbo

## API Notes
- Auth: `AuthGuard('jwt')` protects domain controllers; JWT validated via Auth0 JWKS (`apps/api/src/auth/jwt.strategy.ts`). If a token maps to a new user, a User+Authentication row is created.
- CORS: `FRONTEND_URL` and `http://localhost:3000` allowed by default; adjust if frontend uses 3001.
- Prisma service exported from `@repo/database`; see `apps/api/src/prisma.service.ts` and module in `apps/api/src/prisma/prisma.module.ts`.

## Database Notes
- Models: User, Authentication, Account, Goal, Transaction, RecurringCharge, Income.
- Prisma client output: `packages/database/generated/client` (imported by `packages/database/src/client.ts`).
- Seed script creates demo users, accounts, transactions, recurring charges, incomes, and goals.

## Frontend Notes
- Router: TanStack Start with `createFileRoute` and `createRootRouteWithContext`.
- Auth0 Provider configured in `src/router.tsx`; routes use `useAuth0()` for session state.
- API access: `src/integrations/api.ts` wraps fetch with silent token acquisition and retry/redirect behavior; base URL from `VITE_BACKEND_URL`.

## Deployment
- API (Render): `render.yaml` defines build/start; set `DATABASE_URL` and `DIRECT_URL` in Render dashboard.
- Web: Cloudflare Workers via Wrangler config; alternatively deploy to any Vite/TanStack Start compatible platform.

## Conventions
- TypeScript strictness where practical.
- Lint/format before PRs: `npm run lint` and `npm run format`.
- Keep changes scoped; favor adding types/DTOs in `packages/api` if sharing between API and web.
- Avoid adding secrets to the repo. Use `.env` files locally and platform secrets in CI/deploy.

## Troubleshooting
- 401s from API: confirm Auth0 vars on both sides and `VITE_AUTH0_AUDIENCE` matches backend `AUTH0_AUDIENCE`.
- CORS errors: ensure `FRONTEND_URL` matches the web origin and the port used.
- Prisma client missing: run `npx prisma generate` (implicit in push/seed) or `npm run build` at root.
- Node version mismatches: prefer Node 20+.

## Scope & Precedence
- Per AGENTS spec, this file applies to the entire repo. If a nested AGENTS.md appears later, that nested file takes precedence for its subtree.

