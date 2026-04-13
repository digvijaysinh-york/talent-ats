import express from 'express';
import multer from 'multer';
import { runRankingPipeline } from '../services/pipelineService.js';

export const rankRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 12 },
});

const uploadFields = upload.fields([
  { name: 'resumes', maxCount: 10 },
  { name: 'jobDescription', maxCount: 1 },
]);

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
      });

      res.json(result);
    })().catch(next);
  });
});
