# The Pulse

A production-grade news publishing platform. Next.js 15 App Router, tRPC v11, Prisma + PostgreSQL, Auth.js, Tailwind v4, and shadcn/ui — with a full newsroom dashboard, role-based access control, Postgres full-text search, revision history, and scheduled publishing.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions, ISR) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| API | tRPC v11 + Zod (staff/admin), direct Prisma in RSCs (public reads) |
| Database | PostgreSQL 16 + Prisma, generated `tsvector` full-text search |
| Auth | Auth.js v5 (credentials + JWT), role on the token |
| UI | Tailwind CSS v4, shadcn/ui, Tiptap editor, recharts, sonner |
| Fonts | Archivo (display) + Source Serif 4 (article body) |

## Quick start (local dev)

```bash
# 1. Environment
cp .env.example .env
# Generate a real secret:
openssl rand -base64 32   # paste into AUTH_SECRET

# 2. Database
docker compose up -d db

# 3. Install & migrate
npm install
npm run db:generate
npx prisma migrate dev --name init      # creates schema
# Apply the full-text search migration (generated column + GIN index):
npx prisma db execute --file prisma/migrations/0001_fulltext_search/migration.sql

# 4. Seed sample content
npm run db:seed

# 5. Run
npm run dev
```

Open http://localhost:3000 — the front page is live. The newsroom is at http://localhost:3000/admin.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@thepulse.news` | `ChangeMe123!` |
| Editor | `editor@thepulse.news` | `ChangeMe123!` |
| Journalist | `reporter@thepulse.news` | `ChangeMe123!` |

Change these before any deployment.

## Roles & permissions

Hierarchy: `READER < JOURNALIST < EDITOR < ADMIN`, enforced in three layers — middleware (routes), tRPC `roleProcedure` (API), and UI guards.

| Capability | Journalist | Editor | Admin |
|---|---|---|---|
| Create/edit/delete **own** articles | ✅ | ✅ | ✅ |
| Edit/delete **any** article | — | ✅ | ✅ |
| Publish / unpublish / schedule | — | ✅ | ✅ |
| Featured / breaking / trending flags | — | ✅ | ✅ |
| Restore revisions | — | ✅ | ✅ |
| Analytics overview | — | ✅ | ✅ |
| Media: register / delete | ✅ / — | ✅ / ✅ | ✅ / ✅ |
| Users, categories, newsletter admin | — | — | ✅ |

## Architecture notes

```
src/
├── app/                  # Routes only — thin pages
│   ├── (public)/         # Homepage, article, category, search (RSC + ISR)
│   ├── admin/            # Newsroom dashboard (tRPC client components)
│   ├── api/trpc/         # tRPC handler
│   ├── api/cron/         # Scheduled-release endpoint
│   └── sign-in/
├── features/             # Feature modules: schemas, queries, actions, components
│   ├── articles/
│   ├── newsletter/
│   └── search/
├── server/               # Prisma client, Auth.js config, tRPC routers
├── components/           # ui/ (shadcn), layout/, editor/, home/
├── trpc/                 # Client + RSC callers
└── lib/                  # rbac, seo, utils
```

- **Public reads** skip tRPC entirely: RSCs call Prisma through `unstable_cache` (homepage, 60s) and per-route ISR (`article` 300s, `category` 120s). Mutations call `revalidateTag("articles")` so published changes appear quickly.
- **Full-text search** uses a generated `tsvector` column (title weighted A, excerpt B, body C) with a GIN index. Ranked ids come from a raw `websearch_to_tsquery` query, then hydrate through the typed client preserving relevance order.
- **Revisions**: every article update snapshots the previous title/excerpt/body inside the same transaction. Editors can restore any of the last 30.
- **Scheduling**: editors set status `SCHEDULED` + a future `publishedAt`. A cron hits `GET /api/cron/release-scheduled` to flip them live (set `CRON_SECRET` and send `Authorization: Bearer <secret>`). On Vercel, add to `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/release-scheduled", "schedule": "*/5 * * * *" }] }
```

## Deployment

### Vercel
1. Push to GitHub, import the repo in Vercel.
2. Add env vars: `DATABASE_URL` (e.g. Neon/Supabase), `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, optionally `CRON_SECRET`.
3. Run migrations against the production DB: `npx prisma migrate deploy` then apply `prisma/migrations/0001_fulltext_search/migration.sql` once.
4. Add the cron entry above.

### Docker (self-hosted)
```bash
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up -d --build
# First run only — apply schema + search migration + seed:
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db execute --file prisma/migrations/0001_fulltext_search/migration.sql
```

## Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema without migration (prototyping) |
| `npm run db:migrate` | Create + apply a dev migration |
| `npm run db:seed` | Seed categories, tags, users, sample articles |
| `npm run db:studio` | Prisma Studio |

## Notes

- This codebase was written without being able to run `npm install`/`next build` in its authoring environment, so treat the first local build as a smoke test — any issues should be shallow (import paths, minor type nudges).
- Additional shadcn components can be added with `npx shadcn@latest add <component>`.
- Article body HTML is rendered with `dangerouslySetInnerHTML` and is treated as trusted **staff** input. If you ever accept reader-submitted HTML, sanitize it first (e.g. `sanitize-html`).
