import OpenAI from 'openai';

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/** @type {OpenAI | null} */
let _client = null;

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `You are a talent analyst. Given a job description and one resume (plain text), score how well the candidate fits the role.
Respond with a single JSON object only, no markdown, with keys:
- matchScore: number from 0 to 100 (integer)
- summary: one short paragraph (max 120 words)
- strengths: array of 2-5 short strings
- gaps: array of 0-4 short strings (missing skills or experience vs JD)
Be fair, evidence-based, and concise. If resume text is empty or unusable, set matchScore to 0 and explain in summary.`;

/**
 * @param {string} resumeText
 * @param {string} jobDescriptionText
 * @param {{ fileName: string }} meta
 */
export async function scoreCandidate(resumeText, jobDescriptionText, meta) {
  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('OPENAI_API_KEY is not set'), {
      status: 503,
      code: 'MISSING_OPENAI_KEY',
    });
  }

  const userContent = JSON.stringify({
    fileName: meta.fileName,
    jobDescription: truncate(jobDescriptionText, 12000),
    resume: truncate(resumeText, 12000),
  });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
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
  return {
    matchScore,
    summary: String(parsed.summary || '').trim(),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map((s) => String(s))
      : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((s) => String(s)) : [],
  };
}

/** @param {string} text @param {number} max */
function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated]`;
}

/** @param {unknown} n @param {number} lo @param {number} hi */
function clampInt(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(lo, Math.min(hi, Math.round(x)));
}
