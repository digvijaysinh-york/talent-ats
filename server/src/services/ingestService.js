/**
 * Normalize multer files into a consistent shape for the pipeline.
 * @param {Express.Multer.File[]} files
 */
export function normalizeResumeFiles(files) {
  return files.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalname: f.originalname,
  }));
}
