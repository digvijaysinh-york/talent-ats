# Utils (`server/src/utils`)

**Stateless helpers** used by services. No Express `req`/`res`, no long-lived OpenAI clients.

| File | Responsibility |
|------|----------------|
| `concurrency.js` | `mapWithConcurrency` — ordered async map with a max in-flight limit (parse/score pools) |
| `mime.js` | Extension + MIME → document kind (`pdf` / `docx` / `txt` / `image`) |
| `pdfParse.js` | Buffer → PDF text (CommonJS `pdf-parse` via `createRequire`) |
| `pdfRasterize.js` | Low-text PDF → first page as PNG (`pdfjs-dist` + `@napi-rs/canvas`) for vision scoring |
| `visionMime.js` | JPEG/PNG/WebP MIME normalization for OpenAI `image_url` |
| `contactNormalize.js` | Email/phone normalization + stable dedupe key |
| `temperatureMap.js` | HR experience band width → OpenAI `temperature` metadata |

Adding a new format (e.g. RTF) would extend `mime.js` + `parseService.js`.
