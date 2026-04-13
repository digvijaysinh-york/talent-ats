import { normalizeResumeFiles } from './ingestService.js';
import { parseDocument } from './parseService.js';
import { rankTop } from './rankService.js';
import { scoreCandidate } from './scoreService.js';

/**
 * @typedef {{ buffer: Buffer; mimetype: string; originalname: string }} UploadedFile
 */

/**
 * Full pipeline: ingest → parse (parallel) → score (parallel) → rank.
 * @param {{ resumes: Express.Multer.File[]; jobDescriptionText?: string; jobDescriptionFile?: Express.Multer.File | undefined }} input
 */
export async function runRankingPipeline(input) {
  const started = Date.now();
  const { resumes, jobDescriptionText, jobDescriptionFile } = input;

  if (!resumes?.length) {
    throw Object.assign(new Error('At least one resume is required'), {
      status: 400,
      code: 'NO_RESUMES',
    });
  }

  let jdText = (jobDescriptionText || '').trim();
  let jdSource = 'text';

  if (jobDescriptionFile?.buffer) {
    const parsed = await parseDocument(
      jobDescriptionFile.buffer,
      jobDescriptionFile.mimetype,
      jobDescriptionFile.originalname
    );
    jdText = parsed.text;
    jdSource = 'file';
  }

  if (!jdText) {
    throw Object.assign(new Error('Job description is required (text or file)'), {
      status: 400,
      code: 'NO_JOB_DESCRIPTION',
    });
  }

  const resumeInputs = normalizeResumeFiles(resumes);

  const parsedResumes = await Promise.all(
    resumeInputs.map(async (file) => {
      try {
        const { text, kind } = await parseDocument(
          file.buffer,
          file.mimetype,
          file.originalname
        );
        return {
          fileName: file.originalname,
          text,
          kind,
          parseError: undefined,
        };
      } catch (e) {
        return {
          fileName: file.originalname,
          text: '',
          kind: 'error',
          parseError: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  const scored = await Promise.all(
    parsedResumes.map(async (pr) => {
      if (pr.parseError) {
        return {
          fileName: pr.fileName,
          matchScore: 0,
          summary: `Parse failed: ${pr.parseError}`,
          strengths: [],
          gaps: [],
          parseError: pr.parseError,
        };
      }
      try {
        const score = await scoreCandidate(pr.text, jdText, {
          fileName: pr.fileName,
        });
        return { fileName: pr.fileName, ...score, parseError: undefined };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          fileName: pr.fileName,
          matchScore: 0,
          summary: `Scoring failed: ${msg}`,
          strengths: [],
          gaps: [],
          parseError: msg,
        };
      }
    })
  );

  const top = rankTop(scored, 10);

  return {
    version: '1.0',
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
    },
  };
}
