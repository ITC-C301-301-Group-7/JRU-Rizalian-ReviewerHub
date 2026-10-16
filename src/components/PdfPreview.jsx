
import { useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

export default function PdfPreview({ resource, onClose }) {
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

  if (!resource) return null;

  const previewUrl = resource.previewUrl;
  const downloadUrl = resource.downloadUrl;

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
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-[#002147] hover:bg-amber-300"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
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
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={`PDF preview: ${resource.title || 'Document'}`}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <FileText className="mb-3 h-12 w-12 text-slate-400" />
              <h3 className="font-bold text-slate-800">
                PDF preview unavailable
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                This resource does not have a preview URL. Check the Laravel
                API and the file path for this document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
