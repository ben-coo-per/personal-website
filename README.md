# app/ — Frontend

SvelteKit + TailwindCSS 4 frontend for bencooper.xyz. Deployed to Vercel.

Content is fetched from the Kirby CMS backend (`kirby-server/`) via `src/lib/utils/kirby.ts`.

## Dev

```bash
npm install
npm run dev     # → http://localhost:5173
```

## Env vars

Copy `.env.example` if present, or set these:

| Variable | Purpose |
|---|---|
| `KIRBY_API_URL` | Base URL of the Kirby backend |
| `KIRBY_API_AUTH` | Basic auth token for Kirby API |
| `PASSCODES` | Comma-separated restricted content codes |

## Build & deploy

```bash
npm run build    # production build
npm run preview  # preview production build locally
```

Vercel deploys automatically on push to `main`. Set root directory to `app` in Vercel project settings.
