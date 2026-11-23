# Stack

Decided 2026-11-23. Self-managed; no managed backend service.

| Layer | Choice |
|---|---|
| Frontend | Existing React 18 + Vite + TS + Tailwind in `src/` |
| API | TypeScript on Node 22 + Express, in `server/` |
| Database | PostgreSQL, started locally with `docker-compose.yml` |
| Data access | Prisma (schema, migrations, seed) |
| Admin auth | Hashed passwords, secure HTTP-only cookie session, role checks enforced in the API |
| Images | Local `uploads/` folder served by the API; moves to cloud storage in the hosting phase |

Runs locally only until a dedicated hosting phase.
