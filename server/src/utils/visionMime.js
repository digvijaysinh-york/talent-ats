/**
 * MIME types accepted for OpenAI vision (`image_url` data URLs).
 */

export const VISION_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/**
 * @param {string} mimetype — lowercased or raw
 * @param {string} originalname — filename for extension fallback
 * @returns {string | null} canonical mime for data URL, or null
 */
export function resolveVisionImageMime(mimetype, originalname) {
  const mt = (mimetype || '').split(';')[0].trim().toLowerCase();
  if (VISION_IMAGE_MIMES.has(mt)) {
    if (mt === 'image/jpg') return 'image/jpeg';
    return mt;
  }
  const ext = originalname.includes('.')
    ? originalname.slice(originalname.lastIndexOf('.') + 1).toLowerCase()
    : '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return null;
}
