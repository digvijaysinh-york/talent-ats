# Talent ATS — architecture & system design

## Purpose of this document

This file is the **architecture record** for the Talent Intelligence & Ranking monorepo. It exists so engineers, reviewers, and operators can:

- Understand **what the system does** today (PoC) and **how components interact**.
- Trace **data flow** from browser upload through parsing, scoring, and response.
- Plan **production scaling** (storage, queues, workers, multi-tenancy) without reverse-engineering the codebase.
- Reason about **known failure modes** and mitigations.

For day-to-day module maps, see folder **README.md** files under `server/src` and `client/src`. For local setup, see **[README.md](./README.md)**.

---

## 1. System design (current PoC)

### 1.1 Context

| Aspect | PoC choice |
|--------|------------|
| Deployment | Single Node process + static SPA (or Vite dev proxy) |
| State | **No database**; uploads held in memory for the request only |
| Scoring | **OpenAI** chat completions (text or multimodal vision per résumé) |
| Concurrency | **`Promise.all`** over résumés for parse and score phases |

### 1.2 Component diagram

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
                                             OpenAI (per résumé)
```

### 1.3 Repository layout

| Path | Role |
|------|------|
| `server/` | Express app, pipeline, OpenAI scoring, file parsing & rasterization |
| `client/` | Vite + React + Ant Design UI |
| `package.json` (root) | npm workspaces: `client`, `server` |
| `design.md` (this file) | Architecture and system design |

### 1.4 Libraries and tooling (by purpose)

Dependencies are declared in root **`package.json`** (workspaces) and in **`client/package.json`** / **`server/package.json`**. Purposes below map each major library to how this repo uses it.

| Package | Where | Purpose in Talent ATS |
|---------|--------|------------------------|
| **concurrently** | Root (dev) | Runs `server` and `client` dev scripts in parallel (`npm run dev`). |
| **vite** | Client (dev/build) | Dev server with HMR, production bundling for the SPA. |
| **@vitejs/plugin-react** | Client (dev) | React + JSX compilation and Fast Refresh for Vite. |
| **react** / **react-dom** | Client | UI runtime: pages, state, and rendering. |
| **react-router-dom** | Client | Client-side routing (`/`, `/candidates/:id`). |
| **antd** | Client | Component library (layout, forms, upload, table, feedback). |
| **express** | Server | HTTP app, JSON/body handling, route registration (`/api/v1/rank`, `/health`). |
| **cors** | Server | Allow browser requests from the Vite dev origin (and configured origins). |
| **dotenv** | Server | Load environment variables (e.g. `OPENAI_API_KEY`, `OPENAI_MODEL`) from `.env`. |
| **multer** | Server | Parse `multipart/form-data` for résumé and JD file uploads (memory storage). |
| **mammoth** | Server | Extract text from **DOCX** résumés and JD files. |
| **pdf-parse** | Server | Extract text from **PDF** résumés and JD files (primary text path). |
| **pdfjs-dist** | Server | PDF page rendering used with canvas to **rasterize** low-text PDFs for vision. |
| **@napi-rs/canvas** | Server | Draw PDF page to a bitmap / PNG for the vision / multimodal scoring path. |
| **openai** | Server | Official SDK for **chat completions** (text JSON and image `image_url` messages). |

---

## 2. Data flow

### 2.1 End-to-end (happy path)

1. **Client** builds `FormData`: repeatable `resumes`, optional `jobDescription` file, optional `jobDescriptionText`, optional HR experience fields.
2. **HTTP** `POST /api/v1/rank` hits Express; **Multer** parses multipart fields into memory buffers (`rankRoutes.js`).
3. **Job description** is resolved to plain text (parse PDF/DOCX/TXT; **reject** image-only JD with `400` / `JD_IMAGE_NOT_SUPPORTED`).
4. For each résumé, **parse** runs in parallel (`parseService.js`):
   - PDF → text via `pdf-parse`; if text is very short, **rasterize page 1** to PNG for vision.
   - DOCX → `mammoth`; TXT → UTF-8.
   - JPEG/PNG/WebP → no text extraction; mark for **vision** scoring.
5. **Score** runs in parallel per parsed row (`scoreService.js`): one OpenAI call each (text JSON user message, or multimodal with `image_url` data URL).
6. **Dedupe** merges rows with the same normalized email or phone (`dedupeService.js`).
7. **Rank** sorts by `matchScore`, applies optional strict years-of-experience filter, assigns `rank` (`rankService.js`).
8. **Response** JSON: `version`, `jobDescription` meta, `candidates[]`, `meta` (counts, timing, temperature, band, flags).

### 2.2 Client-side persistence (non-authoritative)

- After a successful rank, the client may store the payload in **`sessionStorage`** so `/candidates/:id` can reload without a server session. This is **not** part of the server contract and is lost when the tab/session storage is cleared.

### 2.3 Request sequence (text diagram)

```
  Browser                Express /rank              Parse (parallel)     OpenAI          Dedupe + Rank
      |                        |                          |                |                  |
      |  POST multipart          |                          |                |                  |
      |------------------------>|                          |                |                  |
      |                        |  resolve JD text         |                |                  |
      |                        |  (internal)              |                |                  |
      |                        |                          |                |                  |
      |                        |  parseDocument (x N)     |                |                  |
      |                        |------------------------->|                |                  |
      |                        |<-------------------------|                |                  |
      |                        |  text / vision per file  |                |                  |
      |                        |                          |                |                  |
      |                        |  scoreCandidate (x N)      |                |                  |
      |                        |----------------------------------------->|                  |
      |                        |<-----------------------------------------|                  |
      |                        |  JSON score per file     |                |                  |
      |                        |                          |                |                  |
      |                        |  dedupe + rankTop        |                |                  |
      |                        |----------------------------------------------------------->|
      |                        |<-----------------------------------------------------------|
      |                        |  ordered candidates      |                |                  |
      |                        |                          |                |                  |
      |  JSON response         |                          |                |                  |
      |<------------------------|                          |                |                  |
      |                        |                          |                |                  |

Notes:
- Rows marked "(x N)" run in parallel for each résumé (Promise.all), not strictly one-after-another.
- Dedupe + Rank run once after all scores return.
```

---

## 3. Ranking pipeline (server) — reference

Ordered stages (do not reorder without updating `pipelineService.js`):

1. **Ingest** — Multer stores uploads in memory; files normalized via `ingestService`.
2. **Parse** — PDF (`pdf-parse`), DOCX (`mammoth`), TXT; JPEG/PNG/WebP as vision inputs; MIME from `utils/mime.js`. Low-text PDFs → first-page PNG (`utils/pdfRasterize.js`).
3. **Score** — One OpenAI completion per résumé: text-only or multimodal; temperature from HR band (`utils/temperatureMap.js`).
4. **Dedupe** — Same normalized email or phone (`dedupeService` + `utils/contactNormalize.js`).
5. **Rank** — Sort, optional YoE filter, assign `rank` (`rankService.js`).

**Response shape** (version `1.1`): `jobDescription`, `candidates[]`, `meta`.

---

## 4. API summary

- **`POST /api/v1/rank`** — `resumes` (repeatable), optional `jobDescription`, `jobDescriptionText`, `experienceMin`, `experienceMax`, `strictExperienceFilter`.
- **Résumé types**: PDF, DOCX, TXT, JPEG, PNG, WebP (vision where needed). **JD** must not be image-only (`400` / `JD_IMAGE_NOT_SUPPORTED`).
- **`GET /health`** — Liveness.
- **Limits**: `server/src/config/limits.js` (max résumés, Multer file count/size).

---

## 5. OpenAI integration

- **Env**: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4o-mini` — must be **vision-capable** for image/raster paths).
- **Modalities**: Text JSON vs `text` + `image_url` (base64 data URL) for images / rasterized PDF page.
- **Output**: Structured JSON; fields validated/clamped in code.
- **Temperature**: Derived from HR experience band width (`temperatureMap.js`).

---

## 6. Client application

- **Routes**: `/` (upload + results), `/candidates/:id` (detail; `sessionStorage` fallback).
- **Dev proxy**: Vite → API (`client/vite.config.js`).
- **Design system**: `client/src/theme/*`, `global.css`, `uploadTiles.css`.

---

## 7. Scaling toward production

The PoC is intentionally **synchronous** and **memory-bound**. A production-shaped system would separate **upload acceptance**, **durable storage**, **async work**, and **result retrieval**.

### 7.1 Object storage (e.g. Amazon S3, GCS, MinIO)

- **Upload path**: API returns a **presigned PUT URL** (or short-lived upload token); client sends files **directly to S3**, not through the app server buffer.
- **Artifacts**: Store raw résumés, optional JD file, and generated intermediates (e.g. rasterized PNG) under a key prefix: `tenants/{tenantId}/jobs/{jobId}/...`.
- **Benefits**: Removes multi‑hundred‑MB payloads from API memory; enables replay and audit; supports virus scanning pipelines.

### 7.2 Database

- **Metadata**: `Job` (tenant, status, JD text hash, filters, created_at), `CandidateFile` (s3_key, mime, parse_status), `Score` (model, token usage, structured JSON), `RankedRun` (ordered ids, version).
- **Idempotency**: Client-supplied `Idempotency-Key` or server-generated `job_id` to avoid double-submitting the same batch.

### 7.3 Queuing and distributed workers

- **Pattern**: API enqueues a **“rank job”** message (SQS, RabbitMQ, Redis **BullMQ**, Cloud Tasks) containing `job_id` and storage pointers — **not** full file bytes.
- **Workers**: Stateless consumers that:
  1. Load files from S3.
  2. Run parse → score (with **bounded concurrency** per worker, e.g. p-limit 5).
  3. Write scores to DB and update job status.
- **Fan-out**: One message per résumé vs one message per job — trade-off between queue overhead and partial progress. Per-job messages simplify dedupe/ranking in one place; per-file messages improve **partial retries** after OpenAI failures.
- **Rate limits**: Centralize OpenAI **RPM/TPM** handling with token bucket or provider-specific backoff; **never** unbounded `Promise.all` across hundreds of files in one process.

### 7.4 API and client

- **`POST /jobs`** → `202 Accepted` + `job_id`; **`GET /jobs/:id`** → status + result when complete (or Server-Sent Events / WebSocket for progress).
- **AuthN/Z**: OAuth2/OIDC or API keys; **tenant isolation** on every query and S3 prefix.
- **Frontend**: Static hosting (S3+CloudFront, Vercel, Netlify); call public API origin; no secrets in the browser.

### 7.5 Observability and operations

- **Structured logs** with `job_id`, `file_id`, latency, OpenAI `request_id`.
- **Metrics**: queue depth, worker utilization, OpenAI error rate, p95 job duration.
- **Secrets**: KMS / Secrets Manager / Doppler — not `.env` on disk in production.

### 7.6 Conceptual production topology (text diagram)

```
                         +------------------+
                         |   Client (SPA)   |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         | API / BFF        |
                         | (auth, presign,  |
                         |  job create)     |
                         +--+--+-------+---+
                            |  |       |
              presign /    |  |       |  read/write job metadata
              upload refs   |  |       |
                            v  v       v
                    +-----------+  +-----------+  +-----------+
                    |  Object   |  |  Queue    |  | Database  |
                    |  storage  |  | (SQS etc.)|  |           |
                    |  (S3)     |  +-----+-----+  +-----------+
                    +-----+-----+        |
                          ^              |
                          |              v
                          |        +-----------+
                          |        |  Workers  |
                          +--------+  (parse,  |
                                   |   score)  |
                                   +-----+-----+
                                         |
                                         v
                                   +-----------+
                                   |  OpenAI   |
                                   +-----------+

Flow summary:
  SPA  --->  API  --->  S3          (upload or register artifacts)
  API  --->  Queue   --->  Workers  (async jobs)
  Workers  --->  S3     (read files)
  Workers  --->  DB     (write scores / status)
  Workers  --->  OpenAI (completions)
  API  --->  DB        (poll / fetch job status for client)
```

---

## 8. Known failure modes

| Failure | Where it surfaces | Impact | Mitigation (PoC vs production) |
|--------|-------------------|--------|--------------------------------|
| **OpenAI 429 / 5xx** | `scoreService` / pipeline | One or all scores fail or degrade | PoC: per-file error row. Prod: retries with exponential backoff, queue **DLQ**, circuit breaker, multi-key pool if allowed. |
| **Missing / invalid API key** | `503` `MISSING_OPENAI_KEY` | No scoring | Configure secrets; health check should not leak key presence. |
| **Model not vision-capable** | OpenAI API error on multimodal | Image / raster PDF scores fail | Set `OPENAI_MODEL` to a vision model; validate at startup. |
| **Parse error (single file)** | Pipeline catches; row gets `parseError`, score 0 | That candidate only | Keep behavior; Prod: store error code + retry parse after fix. |
| **Unsupported MIME** | `400` `UNSUPPORTED_TYPE` | Request rejected for that upload path | Client `accept` aligned with server; Prod: explicit allowlist. |
| **Image-only job description** | `400` `JD_IMAGE_NOT_SUPPORTED` | JD rejected | User must paste text or use text-based JD file. |
| **Multer limits** (size / count) | `413` / Multer error | Upload rejected | Raise limits carefully; Prod: presigned uploads to S3 with size caps. |
| **Memory pressure** | Large batch + buffers in RAM | OOM or slow GC | PoC: cap `MAX_RESUMES_PER_REQUEST`. Prod: streaming to S3, workers with memory limits. |
| **PDF rasterization failure** | `pdfRasterize` returns null | Low-text PDF falls back to text-only path with explanatory string; score may be low | Install `@napi-rs/canvas` on supported platform; Prod: optional dedicated render service. |
| **Dedupe false positive** | Same phone/email key for different people | Wrong merge | Tune keys (e.g. require email **and** name match); make dedupe configurable per tenant. |
| **Dedupe false negative** | Typos / formatting in contacts | Duplicate rows | Fuzzy matching or HR merge UI in product layer. |
| **Client `sessionStorage` cleared** | Detail page empty | No server-side loss | Prod: persist ranked results in DB; link shares `job_id`. |
| **Prompt injection** | JD or résumé contains instructions | Skewed scores | Frame content as data; system prompt hardening; optional moderation API. |
| **PII in logs** | `console.error` / access logs | Compliance risk | Redact filenames/content in production logging. |

---

## 9. Local development

```bash
npm install
# server: OPENAI_API_KEY in server/.env
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:3001`

---

## 10. Related documentation

- **[README.md](./README.md)** — Monorepo quick start.
- **[docs/prompt-history.md](./docs/prompt-history.md)** — AI-assisted development prompt export (traceability).
- **`.cursor/rules/*.mdc`** — Editor/AI context for this repo.
- **Per-folder `README.md`** under `server/src` and `client/src` — module maps.
