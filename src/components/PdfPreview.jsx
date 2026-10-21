import { useEffect, useState } from 'react';
import { X, Download, FileText, LoaderCircle } from 'lucide-react';
import { fetchBlob, saveBlob } from '../utils/Authedfile';

export default function PdfPreview({ resource, token, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const previewUrl = resource?.previewUrl;
  const downloadUrl = resource?.downloadUrl;

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

  // Load the protected PDF with the Bearer token and show it via a blob URL.
  useEffect(() => {
    if (!previewUrl) return undefined;

    const controller = new AbortController();
    let createdUrl = null;

    setLoading(true);
    setError('');
    setBlobUrl(null);

    fetchBlob(previewUrl, token, controller.signal)
      .then((blob) => {
        createdUrl = URL.createObjectURL(blob);
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

  const handleDownload = async () => {
    setDownloading(true);
    setError('');

    try {
      const blob = await fetchBlob(downloadUrl, token);
      saveBlob(blob, resource.filename || 'reviewer.pdf');
    } catch (err) {
      setError(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (!resource) return null;

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
            {downloadUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-[#002147] hover:bg-amber-300 disabled:opacity-60"
              >
                {downloading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
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

        {/* Actual PDF document */}
        <div className="min-h-0 flex-1 bg-slate-200">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              title={`PDF preview: ${resource.title || 'Document'}`}
              className="h-full w-full border-0"
            />
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