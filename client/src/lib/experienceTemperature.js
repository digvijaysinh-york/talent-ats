/**
 * Mirrors server `temperatureFromExperienceBand` for on-screen preview before submit.
 * @param {unknown} minYears
 * @param {unknown} maxYears
 * @returns {{ temperature: number; bandMin: number | null; bandMax: number | null; spanYears: number }}
 */
export function previewScoringTemperature(minYears, maxYears) {
  const lo =
    minYears == null || minYears === '' || !Number.isFinite(Number(minYears))
      ? null
      : Number(minYears);
  const hi =
    maxYears == null || maxYears === '' || !Number.isFinite(Number(maxYears))
      ? null
      : Number(maxYears);

  if (lo == null && hi == null) {
    return { temperature: 0.22, bandMin: null, bandMax: null, spanYears: 15 };
  }

  let bandMin = lo ?? 0;
  let bandMax = hi ?? bandMin;
  if (bandMax < bandMin) {
    const t = bandMin;
    bandMin = bandMax;
    bandMax = t;
  }

  const spanYears = Math.max(0, bandMax - bandMin);
  const normalized = Math.min(spanYears / 15, 1);
  const temperature = Number((0.1 + normalized * 0.45).toFixed(3));

  return { temperature, bandMin, bandMax, spanYears };
}
