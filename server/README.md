# Server (`@talent-ats/server`)

Express **ESM** API for the talent ranking pipeline.

## Scripts

- `npm run dev` — `node --watch src/index.js`
- `npm start` — `node src/index.js`

## Environment

Create `server/.env` (see `.env.example` if present):

- `OPENAI_API_KEY` — required for scoring
- `OPENAI_MODEL` — optional override (default `gpt-4o-mini`). Use a **vision-capable** model; image résumés and rasterized PDF pages are sent as `image_url` payloads.
- `PORT` — optional (default `3001`)

## Native dependencies

Low-text PDFs are rasterized with **`pdfjs-dist`** and **`@napi-rs/canvas`** (prebuilt binaries for common platforms). If install fails on your OS, JPEG/PNG résumés may still work; scanned-PDF fallback may be unavailable until the canvas package installs cleanly.

## Source map

| Directory | Purpose |
|-----------|---------|
| `src/index.js` | App bootstrap, CORS, JSON limit, `/health`, error handler |
| `src/config/` | Request limits shared with Multer |
| `src/routes/` | HTTP routers (multipart `/rank`) |
| `src/services/` | Pipeline orchestration, parse, score, rank, dedupe |
| `src/utils/` | MIME, PDF text & rasterize, vision MIMEs, contact keys, temperature mapping |

See each subdirectory’s **README.md** for details.
