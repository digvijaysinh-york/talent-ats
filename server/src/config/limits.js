/**
 * Upload and pipeline caps. Changing `MAX_RESUMES_PER_REQUEST` requires matching
 * `client/src/lib/limits.js` for UI behavior.
 */

/** Max resume files per rank request (multer field `resumes`). */
export const MAX_RESUMES_PER_REQUEST = 500;

/** Total uploaded files cap: resumes + optional JD. */
export const MAX_UPLOAD_FILES_TOTAL = MAX_RESUMES_PER_REQUEST + 2;
