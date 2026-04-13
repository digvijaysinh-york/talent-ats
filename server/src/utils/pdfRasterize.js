/**
 * Rasterize the first page of a PDF to PNG for vision-based scoring when text extraction is empty
 * (e.g. scanned or screenshot PDFs). Uses pdf.js + @napi-rs/canvas (prebuilt native bindings).
 */
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Max width/height in CSS pixels before scaling down (keeps OpenAI image payload reasonable). */
const MAX_DIMENSION = 1600;

/**
 * @param {Buffer} buffer — raw PDF bytes
 * @returns {Promise<Buffer | null>} PNG buffer, or `null` if rasterization fails
 */
export async function rasterizePdfFirstPageToPng(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = getDocument({
      data,
      disableWorker: true,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(
      MAX_DIMENSION / base.width,
      MAX_DIMENSION / base.height,
      2.5
    );
    const viewport = page.getViewport({ scale: Math.max(scale, 0.4) });
    const w = Math.ceil(viewport.width);
    const h = Math.ceil(viewport.height);
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toBuffer('image/png');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[pdfRasterize] first-page PNG failed:', msg);
    return null;
  }
}
