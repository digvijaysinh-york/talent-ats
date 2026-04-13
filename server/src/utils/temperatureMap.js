/**
 * Maps HR “years of experience” band width to OpenAI `temperature` metadata for the pipeline.
 * Narrow band → lower temperature (more deterministic scoring); wide band → higher temperature.
 *
 * @param {number | undefined} minYears
 * @param {number | undefined} maxYears
 * @returns {{ temperature: number; bandMin: number | null; bandMax: number | null; spanYears: number }}
 */
export function temperatureFromExperienceBand(minYears, maxYears) {
  const lo = minYears == null || !Number.isFinite(Number(minYears)) ? null : Number(minYears);
  const hi = maxYears == null || !Number.isFinite(Number(maxYears)) ? null : Number(maxYears);

  if (lo == null && hi == null) {
    return {
      temperature: 0.22,
      bandMin: null,
      bandMax: null,
      spanYears: 15,
    };
  }

  let bandMin = lo ?? 0;
  let bandMax = hi ?? bandMin;
  if (bandMax < bandMin) [bandMin, bandMax] = [bandMax, bandMin];

  const spanYears = Math.max(0, bandMax - bandMin);
  const normalized = Math.min(spanYears / 15, 1);
  const temperature = Number((0.1 + normalized * 0.45).toFixed(3));

  return {
    temperature,
    bandMin,
    bandMax,
    spanYears,
  };
}
