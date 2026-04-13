/**
 * Upload and pipeline caps. Changing `MAX_RESUMES_PER_REQUEST` requires matching
 * `client/src/lib/limits.js` for UI behavior.
 *
 * Large batches are processed with bounded concurrency (see `PARSE_CONCURRENCY`,
 * `SCORE_CONCURRENCY`) to avoid overwhelming OpenAI and local CPU. In-memory
 * multipart buffers still mean very large runs need sufficient RAM or a future
 * async job + object-storage design.
 */

function envPositiveInt(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Max resume files per rank request (multer field `resumes`). */
export const MAX_RESUMES_PER_REQUEST = 50_000;

/** Total uploaded files cap: resumes + optional JD + spare fields. */
export const MAX_UPLOAD_FILES_TOTAL = MAX_RESUMES_PER_REQUEST + 4;

/**
 * Max parallel parse operations (PDF/DOCX/vision prep). Env: `PARSE_CONCURRENCY`.
 */
export const PARSE_CONCURRENCY = envPositiveInt('PARSE_CONCURRENCY', 8);

/**
 * Max parallel OpenAI scoring calls per request. Env: `SCORE_CONCURRENCY`.
 */
export const SCORE_CONCURRENCY = envPositiveInt('SCORE_CONCURRENCY', 5);
