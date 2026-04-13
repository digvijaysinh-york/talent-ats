/**
 * @typedef {import('./scoreService.js').ScoredCandidateRow} ScoredCandidateRow
 */

/**
 * Sorts by `matchScore` descending, assigns `rank` (1-based), and returns at most `topN` rows.
 * Optional `experienceFilter` removes candidates whose `yearsOfExperience` is known and outside
 * `[min, max]`; rows with `yearsOfExperience` 0 or missing are kept (treated as unknown).
 *
 * @param {ScoredCandidateRow[]} candidates
 * @param {number} [topN] — max rows (`Infinity` / default = all)
 * @param {{ min?: number | null; max?: number | null }} [experienceFilter]
 * @returns {ScoredCandidateRow[]}
 */
export function rankTop(candidates, topN = Number.POSITIVE_INFINITY, experienceFilter) {
  let list = [...candidates];

  if (
    experienceFilter &&
    (experienceFilter.min != null || experienceFilter.max != null)
  ) {
    let fMin = experienceFilter.min;
    let fMax = experienceFilter.max;
    if (fMin != null && fMax != null && fMax < fMin) {
      const t = fMin;
      fMin = fMax;
      fMax = t;
    }
    list = list.filter((c) => {
      const y = c.yearsOfExperience;
      if (y == null || y === 0) return true;
      if (fMin != null && y < fMin) return false;
      if (fMax != null && y > fMax) return false;
      return true;
    });
  }

  const sorted = list.sort((a, b) => b.matchScore - a.matchScore);
  const cap = Number.isFinite(topN) && topN >= 0 ? topN : sorted.length;
  return sorted.slice(0, cap).map((c, i) => ({
    ...c,
    rank: i + 1,
  }));
}
