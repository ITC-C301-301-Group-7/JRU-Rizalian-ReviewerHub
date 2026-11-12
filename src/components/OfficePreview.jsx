import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

// Shows a .docx or .pptx file inside the page, with its layout and pictures, without any
// server-side conversion. The libraries load only when an Office file is opened.
//   blob      the original file as a Blob
//   filename  used to tell Word from PowerPoint
//   onError   called if the file cannot be drawn (the parent can fall back to a text preview)
export default function OfficePreview({ blob, filename = '', onError }) {
  const hostRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const ext = filename.split('.').pop().toLowerCase();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !blob) return undefined;

    let cancelled = false;
    host.innerHTML = '';
    setLoading(true);

    (async () => {
      try {
        if (ext === 'docx') {
          const { renderAsync } = await import('docx-preview');
          if (cancelled) return;
          await renderAsync(blob, host, undefined, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            breakPages: true,
          });
        } else if (ext === 'pptx') {
          const { init } = await import('pptx-preview');
          if (cancelled) return;
          const width = Math.max(320, Math.min(host.clientWidth - 32, 1000));
          const previewer = init(host, { width, height: Math.round((width * 9) / 16) });
          await previewer.preview(await blob.arrayBuffer());
        } else {
          throw new Error('Unsupported file type.');
        }
      } catch (err) {
        if (!cancelled) onError?.(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      host.innerHTML = '';
    };
  }, [blob, ext, onError]);

  return (
    <div className="relative h-full w-full overflow-auto bg-slate-200">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}
      <div ref={hostRef} className="mx-auto flex min-h-full w-full flex-col items-center gap-4 p-4" />
    </div>
  );
}