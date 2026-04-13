import { resolveVisionImageMime } from './visionMime.js';

/**
 * Lowercase file extension without the dot, or empty string if none.
 * @param {string} name
 */
export function extFromName(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/**
 * Resolves upload to a parser branch: `pdf`, `docx`, `txt`, `image`, or `null` if unsupported.
 * Uses MIME when reliable, otherwise falls back to file extension.
 * @param {string} mimetype
 * @param {string} originalname
 * @returns {'pdf' | 'docx' | 'txt' | 'image' | null}
 */
export function resolveKind(mimetype, originalname) {
  const ext = extFromName(originalname);
  if (resolveVisionImageMime(mimetype, originalname)) return 'image';
  if (mimetype === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return 'docx';
  }
  if (mimetype === 'text/plain' || ext === 'txt') return 'txt';
  return null;
}
