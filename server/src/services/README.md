# Services (`server/src/services`)

Core **business logic** for the ranking engine. Prefer adding behavior here rather than in routes.

| File | Responsibility |
|------|----------------|
| `pipelineService.js` | Orchestrates ingest → parse → score → dedupe → rank; builds API response + `meta` |
| `ingestService.js` | Normalizes Multer file objects for the pipeline |
| `parseService.js` | PDF / DOCX / TXT → plain text |
| `scoreService.js` | OpenAI JSON scoring + structured candidate fields |
| `dedupeService.js` | Merge duplicate people (email/phone) |
| `rankService.js` | Sort, optional experience filter, assign `rank` |

**Dependency direction**: `pipelineService` imports the others; avoid circular imports between services.
