// Pulls readable text out of uploaded documents, entirely in the browser.
//
//   PDF   -> the text layer; pages with no text (scans) are OCR'd automatically
//   Word  -> .docx paragraphs        PowerPoint -> .pptx slide text
//   Image -> OCR (Tesseract)
//
// The heavy libraries are loaded on demand so the rest of the app stays light.

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_PAGES = 40;
export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'pptx', 'png', 'jpg', 'jpeg', 'webp'];

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const MIN_TEXT_PER_PAGE = 20; // a PDF page with less text than this is treated as a scan

export const extensionOf = (name = '') => name.split('.').pop().toLowerCase();

const abortIfNeeded = (signal) => {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
};

const tidy = (text) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/* ---------------- OCR ---------------- */

async function createOcr(ocrLang, onProgress) {
  const { createWorker } = await import('tesseract.js');
  let current = { base: 0, span: 1, label: 'Reading text from image' };

  // The worker downloads the language pack the first time (needs internet).
  const worker = await createWorker(ocrLang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({ label: current.label, fraction: current.base + m.progress * current.span });
      }
    },
  });

  return {
    // base/span place this recognition inside the overall 0..1 progress bar.
    async recognize(source, base, span, label) {
      current = { base, span, label };
      const { data } = await worker.recognize(source);
      return data.text || '';
    },
    terminate: () => worker.terminate(),
  };
}

async function imageToCanvas(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}

/* ---------------- Word / PowerPoint (zip + XML) ---------------- */

async function openZip(file) {
  const { default: JSZip } = await import('jszip');
  try {
    return await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error('This file could not be opened. It may be damaged or password-protected.');
  }
}

const parseXml = (xml) => new DOMParser().parseFromString(xml, 'application/xml');

// <p> elements -> one line each, joining their <t> text runs.
function paragraphsOf(doc, paragraphTag, textTag) {
  const lines = [];

  for (const p of Array.from(doc.getElementsByTagNameNS('*', paragraphTag))) {
    let line = '';
    for (const node of Array.from(p.getElementsByTagNameNS('*', '*'))) {
      if (node.localName === textTag) line += node.textContent;
      else if (node.localName === 'tab' && node.parentNode?.localName === 'r') line += '\t'; // skip <w:tabs> definitions in paragraph settings
      else if (node.localName === 'br') line += '\n';
    }
    if (line.trim()) lines.push(line);
  }

  return lines;
}

async function extractDocx(file) {
  const zip = await openZip(file);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('This does not look like a valid .docx file.');

  const lines = paragraphsOf(parseXml(await entry.async('string')), 'p', 't');
  return { text: tidy(lines.join('\n')), method: 'document text', pages: null };
}

async function extractPptx(file) {
  const zip = await openZip(file);

  const slides = Object.keys(zip.files)
    .map((name) => ({ name, match: name.match(/^ppt\/slides\/slide(\d+)\.xml$/) }))
    .filter((x) => x.match)
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]));

  if (slides.length === 0) throw new Error('This does not look like a valid .pptx file.');

  const parts = [];
  for (const { name, match } of slides) {
    const lines = paragraphsOf(parseXml(await zip.file(name).async('string')), 'p', 't');
    if (lines.length) parts.push(`--- Slide ${Number(match[1])} ---\n${lines.join('\n')}`);
  }

  return { text: tidy(parts.join('\n\n')), method: 'slide text', pages: slides.length };
}

/* ---------------- PDF ---------------- */

async function extractPdf(file, { ocrLang, onProgress, signal }) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    throw new Error(
      err?.name === 'PasswordException'
        ? 'This PDF is password-protected.'
        : 'This PDF could not be opened. It may be damaged.'
    );
  }

  const numPages = pdf.numPages;
  const total = Math.min(numPages, MAX_PDF_PAGES);
  const pages = [];
  let ocr = null;
  let usedOcr = 0;

  try {
    for (let i = 1; i <= total; i++) {
      abortIfNeeded(signal);
      const base = (i - 1) / total;
      onProgress?.({ label: `Reading page ${i} of ${total}`, fraction: base });

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      let text = '';
      let lastY = null;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform?.[5];
        if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2 && !text.endsWith('\n')) text += '\n';
        text += item.str;
        if (item.hasEOL) text += '\n';
        lastY = y;
      }

      // Scanned page: no usable text layer, so draw it and run OCR.
      if (text.trim().length < MIN_TEXT_PER_PAGE) {
        ocr ||= await createOcr(ocrLang, onProgress);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        abortIfNeeded(signal);
        text = await ocr.recognize(canvas, base, 1 / total, `Running OCR on page ${i} of ${total}`);
        usedOcr++;
      }

      pages.push(text.trim());
      page.cleanup();
    }
  } finally {
    await ocr?.terminate();
    pdf.destroy?.();
  }

  const method = usedOcr === 0 ? 'PDF text' : usedOcr === total ? 'OCR' : 'PDF text + OCR';

  return {
    text: tidy(pages.filter(Boolean).join('\n\n')),
    method,
    pages: numPages,
    truncated: numPages > total,
  };
}

/* ---------------- Images ---------------- */

async function extractImage(file, { ocrLang, onProgress }) {
  onProgress?.({ label: 'Preparing image', fraction: 0 });
  const canvas = await imageToCanvas(file);
  const ocr = await createOcr(ocrLang, onProgress);

  try {
    const text = await ocr.recognize(canvas, 0, 1, 'Running OCR');
    return { text: tidy(text), method: 'OCR', pages: 1 };
  } finally {
    await ocr.terminate();
  }
}

/* ---------------- Entry point ---------------- */

// options: { ocrLang: 'eng', onProgress({label, fraction}), signal }
export async function extractText(file, options = {}) {
  const ext = extensionOf(file.name);

  if (ext === 'doc' || ext === 'ppt') {
    throw new Error(
      `Old .${ext} files cannot be read in the browser. Open it in Word/PowerPoint and save it as .${ext}x or PDF, then upload that.`
    );
  }
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    throw new Error('Unsupported file type. Use a PDF, Word (.docx), PowerPoint (.pptx), or image file.');
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('File is too large. The maximum size is 20 MB.');

  const opts = { ocrLang: 'eng', ...options };
  options.onProgress?.({ label: 'Starting', fraction: 0 });

  let result;
  if (ext === 'pdf') result = await extractPdf(file, opts);
  else if (ext === 'docx') result = await extractDocx(file);
  else if (ext === 'pptx') result = await extractPptx(file);
  else if (IMAGE_EXTENSIONS.includes(ext)) result = await extractImage(file, opts);

  options.onProgress?.({ label: 'Done', fraction: 1 });

  if (!result.text) {
    throw new Error(
      ext === 'docx' || ext === 'pptx'
        ? 'No text was found. Text inside pictures is not read for Word/PowerPoint files — export the file as a PDF and try again.'
        : 'No readable text was found. Try a clearer, higher-resolution scan, or pick the correct document language.'
    );
  }

  return result;
}