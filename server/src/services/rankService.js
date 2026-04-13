/**
 * @typedef {{ fileName: string; matchScore: number; summary: string; strengths: string[]; gaps: string[]; parseError?: string }} ScoredCandidate
 */

/** @param {ScoredCandidate[]} candidates @param {number} topN */
export function rankTop(candidates, topN = 10) {
  const sorted = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
  return sorted.slice(0, topN).map((c, i) => ({
    rank: i + 1,
    fileName: c.fileName,
    matchScore: c.matchScore,
    summary: c.summary,
    strengths: c.strengths,
    gaps: c.gaps,
    parseError: c.parseError,
  }));
}
