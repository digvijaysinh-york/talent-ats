/**
 * Maps Multer file objects to the minimal shape used by `parseService` (buffer + MIME + name).
 * @param {Express.Multer.File[]} files
 * @returns {{ buffer: Buffer; mimetype: string; originalname: string }[]}
 */
export function normalizeResumeFiles(files) {
  return files.map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalname: f.originalname,
  }));
}
