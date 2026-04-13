/**
 * Contact normalization for deduplication keys: stable email/phone strings and `candidateDedupeKey`.
 */

/**
 * Normalize email for deduplication (lowercase, trim).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeEmailKey(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || !s.includes('@')) return null;
  return s;
}

/**
 * Normalize phone to digits only for deduplication (min length 8).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizePhoneKey(raw) {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits;
}

/**
 * Stable dedupe key: same person across duplicate uploads.
 * @param {string | null | undefined} email
 * @param {string | null | undefined} phone
 * @param {string} fileName
 */
export function candidateDedupeKey(email, phone, fileName) {
  const e = normalizeEmailKey(email);
  const p = normalizePhoneKey(phone);
  if (e) return `email:${e}`;
  if (p) return `phone:${p}`;
  return `file:${String(fileName || 'unknown')}`;
}
