/**
 * Document parsing: chooses parser from MIME/extension, returns normalized plain text for scoring.
 */
import mammoth from 'mammoth';
import { resolveKind } from '../utils/mime.js';
import { extractPdfText } from '../utils/pdfParse.js';

/**
 * @param {Buffer} buffer — raw file bytes
 * @param {string} mimetype — client-reported MIME
 * @param {string} originalname — original filename (extension fallback)
 * @returns {Promise<{ text: string; kind: string }>}
 * @throws {Error & { status?: number; code?: string }} on unsupported type
 */
export async function parseDocument(buffer, mimetype, originalname) {
  const kind = resolveKind(mimetype, originalname);
  if (!kind) {
    throw Object.assign(new Error('Unsupported file type (use PDF, DOCX, or TXT)'), {
      status: 400,
      code: 'UNSUPPORTED_TYPE',
    });
  }

  if (kind === 'pdf') {
    const text = await extractPdfText(buffer);
    return { text: normalizeText(text), kind };
  }

  if (kind === 'txt') {
    const text = buffer.toString('utf8');
    return { text: normalizeText(text), kind };
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = result.value || '';
  return { text: normalizeText(text), kind };
}

/**
 * Collapses whitespace and strips null bytes for safer downstream JSON / model input.
 * @param {string} s
 */
function normalizeText(s) {
  return s.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
}
