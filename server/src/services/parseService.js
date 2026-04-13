import mammoth from 'mammoth';
import { resolveKind } from '../utils/mime.js';
import { extractPdfText } from '../utils/pdfParse.js';

/**
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} originalname
 * @returns {Promise<{ text: string; kind: string }>}
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

/** @param {string} s */
function normalizeText(s) {
  return s.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
}
