import { useEffect, useRef, useState } from 'react';
import { X, Download, FileText, LoaderCircle, Lock } from 'lucide-react';
import { fetchBlob, saveBlob } from '../utils/Authedfile';
import { apiRequest } from '../utils/teacherApi';
import TierBadge from './TierBadge';

// Draws only the first `maxPages` pages of a PDF (what the user's tier allows).
// Note: this limit is applied in the browser. See README "Tiers" for the hard-limit option.
function LimitedPdfPages({ blob, maxPages, access }) {
  const hostRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', total: 0, shown: 0 });

  useEffect(() => {
    let cancelled = false;
    let pdf = null;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;

        const shown = Math.min(pdf.numPages, maxPages);
        const host = hostRef.current;
        if (cancelled || !host) {
          pdf.destroy?.();
          return;
        }
        host.replaceChildren();

        for (let i = 1; i <= shown; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.className = 'mx-auto mb-3 h-auto max-w-full bg-white shadow';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Page ${i}`);
          host.appendChild(canvas);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          page.cleanup();
        }

        if (!cancelled) setState({ loading: false, error: '', total: pdf.numPages, shown });
      } catch {
        if (!cancelled) {
          setState({ loading: false, error: 'This PDF could not be drawn. Try downloading it instead.', total: 0, shown: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
      pdf?.destroy?.();
    };
  }, [blob, maxPages]);

  const hidden = state.total - state.shown;
  const next = access?.tier?.next;

  return (
    <div className="relative h-full overflow-auto p-3">
      {state.loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}

      {state.error && (
        <p role="alert" className="p-6 text-center text-sm text-slate-600">{state.error}</p>
      )}

      <div ref={hostRef} />

      {hidden > 0 && (
        <div className="mx-auto mb-3 flex max-w-xl items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You are previewing {state.shown} of {state.total} pages.
            {next
              ? ` Earn ${access.tier.pointsToNext} more points to reach ${next.name} and preview more.`
              : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PdfPreview({ resource, token, onClose }) {
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // What this user's tier allows for this reviewer (GET /api/resources/{id}/access).
  const [access, setAccess] = useState(null);
  const [accessReady, setAccessReady] = useState(false);

  const previewUrl = resource?.previewUrl;
  const downloadUrl = resource?.downloadUrl;
  const resourceId = resource?.id;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Ask the server what the tier allows. If this fails the preview still opens in full and the
  // server still decides whether a download is allowed.
  useEffect(() => {
    if (!resourceId || !token) {
      setAccess(null);
      setAccessReady(true);
      return undefined;
    }

    const controller = new AbortController();
    setAccessReady(false);

    apiRequest(`/resources/${resourceId}/access`, token, { signal: controller.signal })
      .then((data) => setAccess(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setAccess(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAccessReady(true);
      });

    return () => controller.abort();
  }, [resourceId, token]);

  // Load the protected PDF with the Bearer token and show it via a blob URL.
  useEffect(() => {
    if (!previewUrl) return undefined;

    const controller = new AbortController();
    let createdUrl = null;

    setLoading(true);
    setError('');
    setBlobUrl(null);
    setBlob(null);

    fetchBlob(previewUrl, token, controller.signal)
      .then((fetched) => {
        createdUrl = URL.createObjectURL(fetched);
        setBlob(fetched);
        setBlobUrl(createdUrl);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load the preview.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [previewUrl, token]);

  const canDownload = access ? access.canDownload : true;
  const previewLimit = access?.previewPages ?? null;
  const showLimitedPdf = previewLimit !== null && blob?.type === 'application/pdf';

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');

    try {
      const fetched = await fetchBlob(downloadUrl, token);
      saveBlob(fetched, resource.filename || 'reviewer.pdf');
    } catch (err) {
      setDownloadError(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (!resource) return null;

  const notice = downloadError || (!canDownload ? access?.reason : '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#002147] px-4 py-3 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-6 w-6 shrink-0 text-amber-400" />

            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold sm:text-base">
                {resource.title || 'PDF Preview'}
              </h2>
              <p className="truncate text-xs text-slate-300">
                {resource.filename || 'PDF document'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {access?.tier && <TierBadge tier={access.tier.key} size="sm" className="hidden sm:inline-flex" />}

            {downloadUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || !canDownload}
                title={!canDownload ? access?.reason || 'Downloads are locked for your tier.' : 'Download'}
                className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-[#002147] hover:bg-amber-300 disabled:opacity-60"
              >
                {downloading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : canDownload ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg p-2 text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {notice && (
          <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6">
            {notice}
          </p>
        )}

        {/* Actual PDF document */}
        <div className="min-h-0 flex-1 bg-slate-200">
          {loading || !accessReady ? (
            <div className="flex h-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : blobUrl ? (
            showLimitedPdf ? (
              <LimitedPdfPages blob={blob} maxPages={previewLimit} access={access} />
            ) : (
              <iframe
                src={blobUrl}
                title={`PDF preview: ${resource.title || 'Document'}`}
                className="h-full w-full border-0"
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <FileText className="mb-3 h-12 w-12 text-slate-400" />
              <h3 className="font-bold text-slate-800">
                PDF preview unavailable
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500" role="alert">
                {error ||
                  (previewUrl
                    ? 'The preview could not be loaded.'
                    : 'This resource does not have a preview URL.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
