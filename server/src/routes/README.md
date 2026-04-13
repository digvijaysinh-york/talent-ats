# Routes (`server/src/routes`)

Express routers. **Keep handlers thin**: parse `req`/`res`, call services, forward errors with `next(err)`.

| File | Endpoints |
|------|-----------|
| `rankRoutes.js` | `POST /rank` — multipart `resumes`, optional `jobDescription`, body fields for JD text and HR experience filters |

Multer configuration (memory storage, file size, field `maxCount`) lives in this module and imports limits from `config/limits.js`.
