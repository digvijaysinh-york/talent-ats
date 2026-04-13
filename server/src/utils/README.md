# Utils (`server/src/utils`)

**Stateless helpers** used by services. No Express `req`/`res`, no long-lived OpenAI clients.

| File | Responsibility |
|------|----------------|
| `mime.js` | Extension + MIME → document kind (`pdf` / `docx` / `txt`) |
| `pdfParse.js` | Buffer → PDF text (CommonJS `pdf-parse` via `createRequire`) |
| `contactNormalize.js` | Email/phone normalization + stable dedupe key |
| `temperatureMap.js` | HR experience band width → OpenAI `temperature` metadata |

Adding a new format (e.g. RTF) would extend `mime.js` + `parseService.js`.
