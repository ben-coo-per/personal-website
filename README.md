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

## PDF export

`/export` (unlisted — reachable by typing "export" in the ⌘K palette, `noindex` and disallowed in `robots.txt`) turns project pages into a portfolio book. It's rendered entirely in the browser with `pdfkit` (`src/lib/export/`): real embedded type (Mondwest, Rubik, JetBrains Mono from `static/fonts/pdf/`), clickable links, a PDF outline, cover + contents, and a page-set per project. Images are pulled through `/api/export/asset/…` (R2 has no CORS) and re-encoded as JPEG. Output modes: one bound book, one PDF per project (zip), or a single project. Restricted projects only export once unlocked.

## Build & deploy

```bash
npm run build    # production build
npm run preview  # preview production build locally
```

Vercel deploys automatically on push to `main`. Set root directory to `app` in Vercel project settings.
