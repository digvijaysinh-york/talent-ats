/**
 * Ranking HTTP routes. Multer parses multipart uploads into memory buffers; the handler forwards
 * fields to `runRankingPipeline` and returns JSON (never streams files back).
 */
import express from 'express';
import multer from 'multer';
import { MAX_RESUMES_PER_REQUEST, MAX_UPLOAD_FILES_TOTAL } from '../config/limits.js';
import { runRankingPipeline } from '../services/pipelineService.js';

export const rankRouter = express.Router();

/** In-memory uploads with per-file size and total file count caps from `config/limits`. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: MAX_UPLOAD_FILES_TOTAL },
});

const uploadFields = upload.fields([
  { name: 'resumes', maxCount: MAX_RESUMES_PER_REQUEST },
  { name: 'jobDescription', maxCount: 1 },
]);

/** Multipart rank endpoint: `resumes` (repeatable), optional `jobDescription`, text/body HR filters. */
rankRouter.post('/rank', (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return next(err);
    (async () => {
      const files = req.files;
      /** @type {Express.Multer.File[] | undefined} */
      const resumes = files && 'resumes' in files ? files.resumes : undefined;
      /** @type {Express.Multer.File[] | undefined} */
      const jdArr = files && 'jobDescription' in files ? files.jobDescription : undefined;
      const jobDescriptionFile = jdArr?.[0];
      const jobDescriptionText =
        typeof req.body?.jobDescriptionText === 'string'
          ? req.body.jobDescriptionText
          : '';

      const result = await runRankingPipeline({
        resumes: resumes || [],
        jobDescriptionText,
        jobDescriptionFile,
        experienceMin: req.body?.experienceMin,
        experienceMax: req.body?.experienceMax,
        strictExperienceFilter: req.body?.strictExperienceFilter,
      });

      res.json(result);
    })().catch(next);
  });
});
