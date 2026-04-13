/**
 * OpenAI-based fit scoring: one chat completion per résumé, JSON response with contact fields,
 * years of experience, match score, and narrative strengths/gaps. Temperature can be tuned from HR
 * experience band metadata passed from the pipeline.
 */
import OpenAI from 'openai';

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/** @type {OpenAI | null} */
let _client = null;

/** Lazy singleton; returns `null` when `OPENAI_API_KEY` is missing (caller should surface 503). */
function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

/**
 * Optimized prompt: extract structured facts first, then score against JD with explicit criteria.
 */
const SYSTEM_PROMPT = `You are a recruiting analyst. You receive one job description and one resume as plain text inside a JSON envelope.

Do this in order (internally — do not narrate steps):
1) Extract from the RESUME only: full name, email, phone, current/most recent job title, and total years of professional experience (integer). If a field is missing or ambiguous, use "" for strings or 0 for years and do not invent contact details.
2) Evaluate fit to the JOB DESCRIPTION using: required skills overlap, seniority vs role level, relevant domains, and recency. Penalize clear mismatches; reward evidence from the resume (not assumptions).

Respond with one JSON object only, no markdown, keys:
- fullName: string
- email: string (empty if not found)
- phone: string (empty if not found)
- currentTitle: string (empty if not found)
- yearsOfExperience: integer 0–50 (best estimate from employment history; 0 if unknown)
- matchScore: integer 0–100
- summary: one paragraph, max 100 words, evidence-based
- strengths: array of 2–5 short strings tied to JD requirements
- gaps: array of 0–4 short strings (missing skills, seniority, or domain vs JD)

Rules: No hallucinated contact info. If resume text is empty or unusable, set matchScore 0, explain in summary, and leave contact fields empty.`;

/**
 * @typedef {{
 *   id: string;
 *   fileName: string;
 *   matchScore: number;
 *   summary: string;
 *   strengths: string[];
 *   gaps: string[];
 *   fullName: string;
 *   email: string;
 *   phone: string;
 *   currentTitle: string;
 *   yearsOfExperience: number;
 *   parseError?: string;
 *   resumeExcerpt?: string;
 *   sourceFiles?: string[];
 *   dedupeKey?: string;
 * }} ScoredCandidateRow
 */

/**
 * Calls the chat completions API with structured JSON output and clamps numeric fields.
 * @param {string} resumeText — normalized plain text from parsing
 * @param {string} jobDescriptionText — full JD text
 * @param {{ fileName: string; id: string }} meta — stable `id` from pipeline for response correlation
 * @param {{ temperature?: number; experienceBand?: { min: number | null; max: number | null } }} [options]
 * @returns {Promise<Omit<ScoredCandidateRow, 'parseError' | 'resumeExcerpt' | 'sourceFiles' | 'dedupeKey'>>}
 */
export async function scoreCandidate(resumeText, jobDescriptionText, meta, options = {}) {
  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('OPENAI_API_KEY is not set'), {
      status: 503,
      code: 'MISSING_OPENAI_KEY',
    });
  }

  const temperature =
    typeof options.temperature === 'number' && Number.isFinite(options.temperature)
      ? Math.min(1, Math.max(0, options.temperature))
      : 0.22;

  const band = options.experienceBand;
  const bandHint =
    band && (band.min != null || band.max != null)
      ? `HR target experience band (years, inclusive; soft guidance for scoring emphasis, not a hard rule): min=${band.min ?? 'none'}, max=${band.max ?? 'none'}.`
      : 'No specific experience band from HR; score against the JD as written.';

  const userContent = JSON.stringify({
    instruction: bandHint,
    fileName: meta.fileName,
    jobDescription: truncate(jobDescriptionText, 12000),
    resume: truncate(resumeText, 12000),
  });

  const completion = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty OpenAI response');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse scoring JSON from model');
  }

  const matchScore = clampInt(parsed.matchScore, 0, 100);
  const yearsOfExperience = clampInt(parsed.yearsOfExperience, 0, 50);

  return {
    id: meta.id,
    fileName: meta.fileName,
    matchScore,
    summary: String(parsed.summary || '').trim(),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map((s) => String(s))
      : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((s) => String(s)) : [],
    fullName: String(parsed.fullName || '').trim(),
    email: String(parsed.email || '').trim(),
    phone: String(parsed.phone || '').trim(),
    currentTitle: String(parsed.currentTitle || '').trim(),
    yearsOfExperience,
  };
}

/**
 * Truncates long inputs to protect token limits; appends a marker when trimmed.
 * @param {string} text
 * @param {number} max
 */
function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated]`;
}

/**
 * Coerces model output to a finite integer within `[lo, hi]`; non-numeric → `0`.
 * @param {unknown} n
 * @param {number} lo
 * @param {number} hi
 */
function clampInt(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(lo, Math.min(hi, Math.round(x)));
}
