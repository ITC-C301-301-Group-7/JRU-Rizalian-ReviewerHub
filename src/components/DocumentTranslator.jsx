import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileUp, ScanText, Languages, Copy, Check, Download, LoaderCircle, X, AlertTriangle } from 'lucide-react';
import { extractText, extensionOf, ACCEPTED_EXTENSIONS, MAX_FILE_BYTES } from '../utils/documentText';
import { translateText } from '../utils/translateClient';
import { LANGUAGES, languageByCode } from '../utils/languages';
import { fetchBlob } from '../utils/Authedfile';
import { formatFileSize } from '../utils/teacherApi';

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#002147]';

function ProgressBar({ label, fraction }) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <div role="status" aria-live="polite" className="space-y-1">
      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#002147] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Upload a document -> extract its text (OCR where needed) -> translate it.
export function DocumentTranslator({ token, initialResource, onInitialResourceUsed }) {
  const [file, setFile] = useState(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('tl');
  const [extracted, setExtracted] = useState(null); // { text, method, pages, truncated }
  const [text, setText] = useState(''); // editable, so OCR mistakes can be fixed before translating
  const [translation, setTranslation] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState({ label: '', fraction: 0 });
  const [error, setError] = useState('');
  const [loadingSource, setLoadingSource] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);

  const busy = extracting || translating;

  const resetResults = () => {
    setExtracted(null);
    setText('');
    setTranslation('');
    setError('');
  };

  const chooseFile = useCallback((chosen) => {
    setError('');
    if (!chosen) return;

    const ext = extensionOf(chosen.name);
    if (ext === 'doc' || ext === 'ppt') {
      setError(`Old .${ext} files can’t be read here. Save it as .${ext}x or PDF in Word/PowerPoint and upload that instead.`);
      return;
    }
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError('Unsupported file type. Use a PDF, Word (.docx), PowerPoint (.pptx), or image (PNG, JPG, WEBP).');
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setError('File is too large. The maximum size is 20 MB.');
      return;
    }

    setFile(chosen);
    setExtracted(null);
    setText('');
    setTranslation('');
  }, []);

  // Opened from a community resource ("Translate" button): fetch that file.
  useEffect(() => {
    if (!initialResource) return undefined;

    const controller = new AbortController();
    setLoadingSource(initialResource.title);
    resetResults();

    fetchBlob(initialResource.downloadUrl, token, controller.signal)
      .then((blob) => {
        const name = initialResource.filename || `${initialResource.title}.pdf`;
        chooseFile(new File([blob], name, { type: initialResource.mimeType || blob.type }));
      })
      .catch((err) => err.name !== 'AbortError' && setError(err.message))
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSource('');
        onInitialResourceUsed?.();
      });

    return () => controller.abort();
    // Only re-run when a different resource is passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResource, token]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runExtract = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;

    resetResults();
    setExtracting(true);
    setProgress({ label: 'Starting', fraction: 0 });

    try {
      const result = await extractText(file, {
        ocrLang: languageByCode(sourceLang).ocr,
        signal: controller.signal,
        onProgress: setProgress,
      });
      setExtracted(result);
      setText(result.text);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Could not read this document.');
    } finally {
      setExtracting(false);
    }
  };

  const runTranslate = async () => {
    if (!text.trim()) return;
    if (sourceLang === targetLang) {
      setError('Choose a different target language.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setError('');
    setTranslation('');
    setTranslating(true);
    setProgress({ label: 'Translating', fraction: 0 });

    try {
      const result = await translateText(text, {
        source: sourceLang,
        target: targetLang,
        token,
        signal: controller.signal,
        onProgress: ({ done, total }) => setProgress({ label: `Translating part ${Math.min(done + 1, total)} of ${total}`, fraction: done / total }),
      });
      setTranslation(result);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  const cancel = () => abortRef.current?.abort();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed. Select the text and copy it manually.');
    }
  };

  const downloadTxt = () => {
    const base = (file?.name || 'document').replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(new Blob([translation], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}.${targetLang}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
          <Languages className="h-5 w-5 text-blue-950" /> Document translation
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Upload a PDF, Word, PowerPoint, or image. Text is read from the file (with OCR for scans and photos), then translated into your language.
        </p>
        <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Privacy:</strong> reading the file happens on your device, but the text is sent through our server to an
            outside translation service (MyMemory or LibreTranslate) to be translated. Don’t translate documents that contain
            personal data, grades, IDs or other private information.
          </span>
        </p>
      </div>

      {/* Step 1 */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase text-slate-700">1. Choose a document</h3>

        {loadingSource && (
          <p className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading “{loadingSource}”...</p>
        )}

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-950 hover:bg-blue-50/40">
          <FileUp className="h-6 w-6 text-blue-950" />
          <span className="text-xs font-bold text-slate-800">{file ? file.name : 'Click to upload a document'}</span>
          <span className="text-[11px] text-slate-500">
            {file ? formatFileSize(file.size) : 'PDF, DOCX, PPTX, PNG, JPG or WEBP — up to 20 MB'}
          </span>
          <input
            type="file"
            accept={ACCEPTED_EXTENSIONS.map((x) => `.${x}`).join(',')}
            disabled={busy}
            onChange={(e) => {
              chooseFile(e.target.files?.[0]);
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-bold text-slate-700">Language of the document
            <select className={`${selectClass} mt-1`} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} disabled={busy}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-bold text-slate-700">Translate into
            <select className={`${selectClass} mt-1`} value={targetLang} onChange={(e) => setTargetLang(e.target.value)} disabled={busy}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={runExtract} disabled={!file || busy} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#002147] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {extracting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
            {extracting ? 'Reading...' : 'Extract text'}
          </button>
          {busy && (
            <button type="button" onClick={cancel} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>

        {busy && <ProgressBar label={progress.label} fraction={progress.fraction} />}
        {extracting && <p className="text-[11px] text-slate-400">Scanned pages and photos use OCR, which downloads a language file the first time and can take a minute.</p>}
      </section>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Step 2 */}
      {extracted && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase text-slate-700">2. Extracted text</h3>
            <span className="text-[11px] text-slate-500">
              Read with: <strong>{extracted.method}</strong>
              {extracted.pages ? ` · ${extracted.pages} page${extracted.pages > 1 ? 's' : ''}` : ''} · {text.length.toLocaleString()} characters
            </span>
          </div>

          {extracted.truncated && (
            <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">Only the first 40 pages were read.</p>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            aria-label="Extracted text"
            disabled={translating}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed text-slate-900 outline-none focus:border-[#002147]"
          />
          <p className="text-[11px] text-slate-400">You can fix any mistakes (OCR isn’t perfect) before translating.</p>

          <button type="button" onClick={runTranslate} disabled={busy || !text.trim()} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-[#002147] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
            {translating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
            {translating ? 'Translating...' : `Translate to ${languageByCode(targetLang).label}`}
          </button>
        </section>
      )}

      {/* Step 3 */}
      {translation && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase text-slate-700">3. Translation — {languageByCode(targetLang).label}</h3>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={downloadTxt} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#002147] px-3 py-1.5 text-xs font-bold text-white">
                <Download className="h-3.5 w-3.5" /> Save .txt
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-900">{translation}</div>
          <p className="text-[11px] text-slate-400">Machine translation can contain errors. Double-check important content.</p>
        </section>
      )}
    </div>
  );
}

export default DocumentTranslator;