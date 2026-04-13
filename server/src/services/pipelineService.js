/**
 * End-to-end ranking orchestration: validates input, resolves JD text, parses all résumés in
 * parallel, scores with OpenAI in parallel, deduplicates, optionally filters by years of experience,
 * sorts and assigns ranks, and returns the public API payload (strips internal `dedupeKey`).
 */
import { randomUUID } from 'crypto';
import { MAX_RESUMES_PER_REQUEST } from '../config/limits.js';
import { dedupeScoredCandidates } from './dedupeService.js';
import { normalizeResumeFiles } from './ingestService.js';
import { parseDocument } from './parseService.js';
import { rankTop } from './rankService.js';
import { scoreCandidate } from './scoreService.js';
import { temperatureFromExperienceBand } from '../utils/temperatureMap.js';

/**
 * @typedef {{ buffer: Buffer; mimetype: string; originalname: string }} UploadedFile
 */

/**
 * Parses multipart form string/number fields for optional experience bounds.
 * @param {unknown} v
 * @returns {number | null}
 */
function parseOptionalNumber(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Human-readable snippet for API/ UI: text slice and/or note when scoring used vision.
 * @param {{ text: string; kind: string; vision?: { buffer: Buffer; mime: string } }} pr
 */
function buildResumeExcerpt(pr) {
  if (pr.vision) {
    const tag =
      pr.kind === 'pdf'
        ? 'Scored using vision on rasterized PDF page 1 (little or no extractable text).'
        : 'Scored using vision on uploaded image.';
    const t = (pr.text || '').trim();
    if (!t) return tag;
    const head = t.length > 800 ? `${t.slice(0, 800)}…` : t;
    return `${head}\n\n[${tag}]`;
  }
  if (pr.text.length > 1500) return `${pr.text.slice(0, 1500)}…`;
  return pr.text;
}

/**
 * Full pipeline: ingest → parse (parallel) → score (parallel) → dedupe → rank.
 * @param {{
 *   resumes: Express.Multer.File[];
 *   jobDescriptionText?: string;
 *   jobDescriptionFile?: Express.Multer.File | undefined;
 *   experienceMin?: unknown;
 *   experienceMax?: unknown;
 *   strictExperienceFilter?: unknown;
 * }} input
 * @returns {Promise<{ version: string; jobDescription: object; candidates: object[]; meta: object }>}
 */
export async function runRankingPipeline(input) {
  const started = Date.now();
  const {
    resumes,
    jobDescriptionText,
    jobDescriptionFile,
    experienceMin,
    experienceMax,
    strictExperienceFilter,
  } = input;

  if (!resumes?.length) {
    throw Object.assign(new Error('At least one resume is required'), {
      status: 400,
      code: 'NO_RESUMES',
    });
  }

  if (resumes.length > MAX_RESUMES_PER_REQUEST) {
    throw Object.assign(
      new Error(`Too many résumés (maximum ${MAX_RESUMES_PER_REQUEST} per request)`),
      { status: 400, code: 'TOO_MANY_RESUMES' }
    );
  }

  let jdText = (jobDescriptionText || '').trim();
  let jdSource = 'text';

  if (jobDescriptionFile?.buffer) {
    const parsed = await parseDocument(
      jobDescriptionFile.buffer,
      jobDescriptionFile.mimetype,
      jobDescriptionFile.originalname
    );
    if (parsed.kind === 'image') {
      throw Object.assign(
        new Error(
          'Job description cannot be a JPEG/PNG/WebP image. Paste the JD as text or upload PDF, DOCX, or TXT.'
        ),
        { status: 400, code: 'JD_IMAGE_NOT_SUPPORTED' }
      );
    }
    jdText = parsed.text;
    jdSource = 'file';
  }

  if (!jdText) {
    throw Object.assign(new Error('Job description is required (text or file)'), {
      status: 400,
      code: 'NO_JOB_DESCRIPTION',
    });
  }

  const minY = parseOptionalNumber(experienceMin);
  const maxY = parseOptionalNumber(experienceMax);
  const tempMeta = temperatureFromExperienceBand(
    minY ?? undefined,
    maxY ?? undefined
  );

  const applyExperienceFilter =
    String(strictExperienceFilter || '').toLowerCase() === 'true' ||
    String(strictExperienceFilter || '').toLowerCase() === '1';

  const resumeInputs = normalizeResumeFiles(resumes);

  const parsedResumes = await Promise.all(
    resumeInputs.map(async (file) => {
      try {
        const parsed = await parseDocument(
          file.buffer,
          file.mimetype,
          file.originalname
        );
        return {
          fileName: file.originalname,
          text: parsed.text,
          kind: parsed.kind,
          vision: parsed.vision,
          parseError: undefined,
        };
      } catch (e) {
        return {
          fileName: file.originalname,
          text: '',
          kind: 'error',
          vision: undefined,
          parseError: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  const scored = await Promise.all(
    parsedResumes.map(async (pr) => {
      const id = randomUUID();
      if (pr.parseError) {
        return {
          id,
          fileName: pr.fileName,
          matchScore: 0,
          summary: `Parse failed: ${pr.parseError}`,
          strengths: [],
          gaps: [],
          fullName: '',
          email: '',
          phone: '',
          currentTitle: '',
          yearsOfExperience: 0,
          parseError: pr.parseError,
          resumeExcerpt: '',
        };
      }
      try {
        const score = await scoreCandidate(
          { text: pr.text, vision: pr.vision },
          jdText,
          {
            fileName: pr.fileName,
            id,
          },
          {
            temperature: tempMeta.temperature,
            experienceBand: {
              min: tempMeta.bandMin,
              max: tempMeta.bandMax,
            },
          }
        );
        const excerpt = buildResumeExcerpt(pr);
        return {
          ...score,
          parseError: undefined,
          resumeExcerpt: excerpt,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          id,
          fileName: pr.fileName,
          matchScore: 0,
          summary: `Scoring failed: ${msg}`,
          strengths: [],
          gaps: [],
          fullName: '',
          email: '',
          phone: '',
          currentTitle: '',
          yearsOfExperience: 0,
          parseError: msg,
          resumeExcerpt: '',
        };
      }
    })
  );

  const beforeDedupe = scored.length;
  const deduped = dedupeScoredCandidates(scored);

  const filterOpts =
    applyExperienceFilter && (minY != null || maxY != null)
      ? { min: minY, max: maxY }
      : undefined;

  const ranked = rankTop(deduped, deduped.length, filterOpts);
  const top = ranked.map(({ dedupeKey: _dk, ...pub }) => pub);

  return {
    version: '1.1',
    jobDescription: {
      source: jdSource,
      preview: jdText.length > 600 ? `${jdText.slice(0, 600)}…` : jdText,
      charCount: jdText.length,
    },
    candidates: top,
    meta: {
      resumeCount: resumes.length,
      parsedOk: parsedResumes.filter((p) => !p.parseError).length,
      durationMs: Date.now() - started,
      scoringTemperature: tempMeta.temperature,
      experienceBand: {
        min: tempMeta.bandMin,
        max: tempMeta.bandMax,
        spanYears: tempMeta.spanYears,
      },
      strictExperienceFilter: Boolean(filterOpts),
      scoredCount: beforeDedupe,
      uniqueAfterDedupe: deduped.length,
    },
  };
}
