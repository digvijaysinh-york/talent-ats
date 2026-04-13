/**
 * PDF text extraction via CommonJS `pdf-parse` from an ESM module (`createRequire`).
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * @param {Buffer} buffer
 * @returns {Promise<string>} trimmed page text concatenation
 */
export async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  return typeof data.text === 'string' ? data.text.trim() : '';
}
