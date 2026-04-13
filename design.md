# Talent ATS — system design

This document describes architecture, data flow, configuration, and UI design for the **Talent Intelligence & Ranking** monorepo (Express API + Vite/React client).

## 1. High-level architecture

```
┌─────────────┐     multipart/form-data      ┌──────────────────┐
│   Browser   │ ──────────────────────────► │  Express :3001   │
│  (Vite :5173)│ ◄── JSON rank response      │  /api/v1/rank    │
└─────────────┘     proxy /api, /health     └────────┬─────────┘
                                                      │
                                             ingest → parse → score
                                             → dedupe → rank
                                                      │
                                                      ▼
                                             OpenAI (per resume)
```

- **No database**: all state is in-memory for the lifetime of a request (and client-side `sessionStorage` for detail-page deep links).
- **Concurrency**: parsing and scoring use `Promise.all` over resumes; failures on one file do not abort the batch.

## 2. Repository layout

| Path | Role |
|------|------|
| `server/` | Express app, pipeline, OpenAI scoring, file parsing |
| `client/` | Vite + React + Ant Design UI |
| `package.json` (root) | npm workspaces: `client`, `server` |
| `design.md` (this file) | Architecture and design reference |

See **folder-level `README.md`** under `server/src/*` and `client/src/*` for module-specific notes.

## 3. Ranking pipeline (server)

Ordered stages (do not reorder without updating `pipelineService.js`):

1. **Ingest** — Multer stores uploads in memory; files normalized via `ingestService`.
2. **Parse** — PDF (`pdf-parse`), DOCX (`mammoth`), TXT; JPEG/PNG/WebP as vision inputs; MIME from `utils/mime.js`. PDFs with very little extracted text are rasterized to a first-page PNG (`utils/pdfRasterize.js`) so scanned/screenshot PDFs can still be scored with vision.
3. **Score** — One OpenAI chat completion per résumé (`scoreService`): text-only or multimodal (image) when needed; temperature from HR experience band (`utils/temperatureMap.js`).
4. **Dedupe** — Collapse rows sharing the same normalized email or phone (`dedupeService` + `utils/contactNormalize.js`).
5. **Rank** — Sort by `matchScore` descending; optional strict years-of-experience filter; assign `rank` (`rankService`).

**Response shape** (version `1.1`): `jobDescription`, `candidates[]`, `meta` (counts, duration, temperature, band, filter flags).

## 4. API

- **`POST /api/v1/rank`** — Fields: `resumes` (repeatable), optional `jobDescription`, `jobDescriptionText`, `experienceMin`, `experienceMax`, `strictExperienceFilter`.
- **Résumé files**: PDF, DOCX, TXT (as applicable), JPEG, PNG, WebP. Image uploads are scored via **vision**. **Job description** uploads must not be image-only (API returns `400` / `JD_IMAGE_NOT_SUPPORTED`); use text, PDF, DOCX, or TXT for the JD.
- **`GET /health`** — Liveness JSON.

Limits: `server/src/config/limits.js` (`MAX_RESUMES_PER_REQUEST`, total file cap for Multer).

## 5. OpenAI integration

- **Env**: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4o-mini`).
- **Modalities**: Plain-text JSON user messages when the résumé has sufficient extracted text; **multimodal** (`text` + `image_url` data URL) for image résumés and for PDFs rasterized to a first-page PNG when text extraction is too short.
- **Output**: JSON object with contact fields, `yearsOfExperience`, `matchScore`, narrative fields; validated/clamped in code.
- **Temperature**: Narrow HR experience bands → lower temperature; wider bands → higher (see `temperatureMap.js`).

## 6. Client application

- **Routing**: `/` home (upload + results), `/candidates/:id` detail (hydrates from navigation state or `sessionStorage`).
- **Proxy**: Vite proxies `/api` and `/health` to the API in development (`client/vite.config.js`).
- **Design system**: Central tokens in `client/src/theme/designTokens.js`, mapped into Ant Design via `antdTheme.js`, layout helpers in `appShell.js`. Global baseline: `client/src/styles/global.css`; upload tile layout: `uploadTiles.css`.

## 7. Extension points (future)

- Persist ranked runs and blobs in object storage + DB.
- Queue workers for scoring to respect provider rate limits.
- Authn/z for multi-tenant HR use.
- Webhooks or export (CSV) from the same `candidates` JSON.

## 8. Local development

```bash
npm install
# server: OPENAI_API_KEY in server/.env
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:3001`

## 9. Related docs

- **[README.md](./README.md)** — Monorepo quick start and links.
- `.cursor/rules/*.mdc` — AI/editor context for this repo.
- Per-folder `README.md` under `server/src` and `client/src` for file-level maps.
