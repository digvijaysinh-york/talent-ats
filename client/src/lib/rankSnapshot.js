/** SessionStorage helpers for persisting the last `/rank` JSON between list and detail views. */
const STORAGE_KEY = 'talent:lastRank';

/**
 * Persists the full API payload so `/candidates/:id` can reload after refresh.
 * @param {unknown} payload
 */
export function saveLastRankPayload(payload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

/** @returns {any | null} parsed payload or null */
export function loadLastRankPayload() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Looks up a candidate in the last saved rank response by stable server `id`.
 * @param {string} id
 * @returns {any | null}
 */
export function findCandidateById(id) {
  const data = loadLastRankPayload();
  const list = data?.candidates;
  if (!Array.isArray(list)) return null;
  return list.find((c) => c.id === id) ?? null;
}
