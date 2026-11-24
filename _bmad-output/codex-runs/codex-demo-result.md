Completed the temporary demo hosting configuration.

Changed:

- [render.yaml](C:\Users\lnakh\Desktop\Mechanics-Tools-main\render.yaml) — Render free Node service, Neon environment variables, migrations/seed startup, health check, and ephemeral-upload warning.
- [vercel.json](C:\Users\lnakh\Desktop\Mechanics-Tools-main\vercel.json) — API, uploads, sitemap, and robots rewrites precede the SPA fallback.
- [README.md](C:\Users\lnakh\Desktop\Mechanics-Tools-main\README.md) — added “Demo on Vercel + Render + Neon” setup instructions and limitations.

Verification passed:

- `vercel.json` parses as valid JSON.
- `render.yaml` was manually checked; no YAML parser is installed.
- `npm run build` passed successfully.