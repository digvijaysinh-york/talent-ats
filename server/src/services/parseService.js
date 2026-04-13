/**
 * Document parsing: PDF/DOCX/TXT → plain text; JPEG/PNG/WebP → vision payload; low-text PDFs →
 * first-page PNG for vision when rasterization succeeds (scanned / screenshot PDFs).
 */
import mammoth from 'mammoth';
import { resolveKind } from '../utils/mime.js';
import { extractPdfText } from '../utils/pdfParse.js';
import { rasterizePdfFirstPageToPng } from '../utils/pdfRasterize.js';
import { resolveVisionImageMime } from '../utils/visionMime.js';

/** If extracted PDF text is shorter than this, try rasterizing page 1 for vision scoring. */
const MIN_PDF_TEXT_CHARS = 50;

/**
 * @typedef {{ text: string; kind: string; vision?: { buffer: Buffer; mime: string } }} ParsedDocument
 */

/**
 * @param {Buffer} buffer — raw file bytes
 * @param {string} mimetype — client-reported MIME
 * @param {string} originalname — original filename (extension fallback)
 * @returns {Promise<ParsedDocument>}
 * @throws {Error & { status?: number; code?: string }} on unsupported type
 */
export async function parseDocument(buffer, mimetype, originalname) {
  const kind = resolveKind(mimetype, originalname);
  if (!kind) {
    throw Object.assign(
      new Error('Unsupported file type (use PDF, DOCX, TXT, JPEG, PNG, or WebP)'),
      { status: 400, code: 'UNSUPPORTED_TYPE' }
    );
  }

  if (kind === 'image') {
    const mime = resolveVisionImageMime(mimetype, originalname);
    if (!mime) {
      throw Object.assign(new Error('Unsupported image type (use JPEG, PNG, or WebP)'), {
        status: 400,
        code: 'UNSUPPORTED_TYPE',
      });
    }
    return { text: '', kind: 'image', vision: { buffer, mime } };
  }

  if (kind === 'pdf') {
    const rawText = await extractPdfText(buffer);
    const text = normalizeText(rawText);
    if (text.length >= MIN_PDF_TEXT_CHARS) {
      return { text, kind: 'pdf' };
    }
    const png = await rasterizePdfFirstPageToPng(buffer);
    if (png) {
      return {
        text,
        kind: 'pdf',
        vision: { buffer: png, mime: 'image/png' },
      };
    }
    return {
      text:
        text ||
        'No readable text in this PDF (likely a scan or screenshot). Rasterization failed; upload JPEG/PNG or fix PDF.',
      kind: 'pdf',
    };
  }

  if (kind === 'txt') {
    const text = normalizeText(buffer.toString('utf8'));
    return { text, kind: 'txt' };
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeText(result.value || '');
  return { text, kind: 'docx' };
}

/**
 * Collapses whitespace and strips null bytes for safer downstream JSON / model input.
 * @param {string} s
 */
function normalizeText(s) {
  return s.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
}
