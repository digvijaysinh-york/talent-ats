# Server (`@talent-ats/server`)

Express **ESM** API for the talent ranking pipeline.

## Scripts

- `npm run dev` — `node --watch src/index.js`
- `npm start` — `node src/index.js`

## Environment

Create `server/.env` (see `.env.example` if present):

- `OPENAI_API_KEY` — required for scoring
- `OPENAI_MODEL` — optional override
- `PORT` — optional (default `3001`)

## Source map

| Directory | Purpose |
|-----------|---------|
| `src/index.js` | App bootstrap, CORS, JSON limit, `/health`, error handler |
| `src/config/` | Request limits shared with Multer |
| `src/routes/` | HTTP routers (multipart `/rank`) |
| `src/services/` | Pipeline orchestration, parse, score, rank, dedupe |
| `src/utils/` | MIME, PDF text, contact keys, temperature mapping |

See each subdirectory’s **README.md** for details.
