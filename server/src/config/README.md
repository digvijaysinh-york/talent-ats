# Config (`server/src/config`)

Shared **constants** consumed by Multer and the pipeline so upload caps stay consistent.

| File | Exports |
|------|---------|
| `limits.js` | `MAX_RESUMES_PER_REQUEST`, `MAX_UPLOAD_FILES_TOTAL` |

Adjust `MAX_RESUMES_PER_REQUEST` when raising/lowering how many files a single `/rank` call may accept. Keep **`client/src/lib/limits.js`** in sync for UI hints and client-side trimming.
