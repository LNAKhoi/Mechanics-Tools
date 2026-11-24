# Demo hosting: Render (API) and Neon (database) behind Vercel (for Codex)

**Goal:** the existing Vercel deployment of `main` serves the storefront, while `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` go to an API on Render's free plan that uses a Neon Postgres database. This is a temporary customer demo; the long-term host is a VPS (Phase 9, on another branch). Keep the changes minimal and config-only, and **don't change application code**.

You are working in a git worktree of `main` (`C:\Users\lnakh\Desktop\Mechanics-Tools-main`). Edit only the files listed below.

## 1. Create `render.yaml` at the repo root (Render Blueprint)
- one `web` service named `lee-tools-api`, `runtime: node`, `plan: free`, `region: singapore`, `rootDir: server`
- `buildCommand`: `npm ci --include=dev && npm run build` (dev dependencies are needed because the build uses the `prisma` CLI and `typescript`, and `NODE_ENV=production` would otherwise skip them)
- `startCommand`: `npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/index.js`
  - the seed is safe to repeat: roles are upserted, and categories and products are created only if missing
- `healthCheckPath: /api/categories`
- `envVars`:
  - `NODE_VERSION=22`, `NODE_ENV=production`
  - `DATABASE_URL` with `sync: false` (the owner pastes the Neon connection string in Render's dashboard)
  - `SITE_URL` with `sync: false` (the Vercel URL)
- a comment at the top explaining that this is a temporary demo setup and that uploads on the free plan disappear on restart

## 2. Update `vercel.json`
Put rewrites **before** the existing SPA catch-all, each pointing to `https://lee-tools-api.onrender.com`:
- `/api/:path*` → `https://lee-tools-api.onrender.com/api/:path*`
- `/uploads/:path*` → `.../uploads/:path*`
- `/sitemap.xml` and `/robots.txt` → the same paths on Render

Keep `{ "source": "/(.*)", "destination": "/index.html" }` last. Use valid Vercel rewrite syntax.

## 3. Add a short "Demo on Vercel + Render + Neon" section to `README.md`
1. Create a Neon project in region Singapore, and copy the **direct** (non-pooled) connection string.
2. In Render: New → Blueprint → this repo, then paste `DATABASE_URL` and set `SITE_URL` to the Vercel URL.
3. If Render assigns a different URL than `lee-tools-api.onrender.com`, update `vercel.json`.
4. To create the first admin, from a local terminal with `DATABASE_URL` set to the Neon string, run `npm --prefix server run create-admin`.
5. Limitations: the free plan sleeps after idle (about 50 s for the first request), and uploads aren't persistent.

## Verify
- `npm run build` (root) passes.
- `vercel.json` is valid JSON.
- `render.yaml` is valid YAML. Check it with node if a YAML parser is available; otherwise check it carefully by hand.

## Rules
- Don't run any BMAD workflow, and don't stop to ask.
- Don't commit, push, reset or switch branches; Claude commits.
- Put no secrets in any file.
- Finish by summarizing the files you changed.
