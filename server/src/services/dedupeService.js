/**
 * Collapses multiple scored rows that refer to the same person (shared email or phone key).
 */
import { candidateDedupeKey } from '../utils/contactNormalize.js';

/**
 * Merges file names from the losing row into `sourceFiles` on the winning row.
 * @param {import('./scoreService.js').ScoredCandidateRow} winner — row kept for score/contact
 * @param {import('./scoreService.js').ScoredCandidateRow} loser — row merged in for provenance only
 * @returns {import('./scoreService.js').ScoredCandidateRow}
 */
function mergeRows(winner, loser) {
  const files = new Set([
    winner.fileName,
    loser.fileName,
    ...(winner.sourceFiles || []),
    ...(loser.sourceFiles || []),
  ]);
  const sourceFiles = [...files].filter(Boolean);
  return {
    ...winner,
    sourceFiles: sourceFiles.length > 1 ? sourceFiles : winner.sourceFiles,
  };
}

/**
 * One row per dedupe key: prefers higher `matchScore`; combines originating filenames.
 * @param {import('./scoreService.js').ScoredCandidateRow[]} rows
 * @returns {import('./scoreService.js').ScoredCandidateRow[]}
 */
export function dedupeScoredCandidates(rows) {
  /** @type {Map<string, import('./scoreService.js').ScoredCandidateRow>} */
  const map = new Map();

  for (const row of rows) {
    const key = candidateDedupeKey(row.email, row.phone, row.fileName);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row, dedupeKey: key });
      continue;
    }

    if (row.matchScore > existing.matchScore) {
      map.set(key, mergeRows({ ...row, dedupeKey: key }, existing));
    } else {
      map.set(key, mergeRows(existing, row));
    }
  }

  return [...map.values()];
}
