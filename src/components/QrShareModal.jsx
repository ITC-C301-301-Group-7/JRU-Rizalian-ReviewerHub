import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { buildResourceLink } from '../utils/resourceLinks';

// Draws a printable card: header, QR code, title and course code.
async function buildPoster(resource, qrDataUrl) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = qrDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 480, 640);

  ctx.fillStyle = '#002147';
  ctx.fillRect(0, 0, 480, 70);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JRU ReviewerHub', 240, 44);

  ctx.drawImage(img, 60, 95, 360, 360);

  // Title, wrapped to at most 2 lines.
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  const words = (resource.title || '').split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 420 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > 2) lines.length = 2;
  if (lines.length === 2 && words.join(' ').length > lines.join(' ').length) lines[1] = `${lines[1].replace(/\s*\S*$/, '')}…`;
  lines.forEach((l, i) => ctx.fillText(l, 240, 495 + i * 28));

  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText(resource.courseCode || '', 240, 570);
  ctx.font = '13px sans-serif';
  ctx.fillText('Scan to open this reviewer', 240, 605);

  return canvas.toDataURL('image/png');
}

export default function QrShareModal({ resource, onClose }) {
  const link = buildResourceLink(resource.id);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(link, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#002147', light: '#ffffff' },
    })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setError('Could not generate the QR code.'));

    return () => {
      cancelled = true;
    };
  }, [link]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = async () => {
    try {
      const poster = await buildPoster(resource, qr);
      const a = document.createElement('a');
      const slug = (resource.courseCode || 'reviewer').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.href = poster;
      a.download = `reviewerhub-${slug}-${resource.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError('Could not create the image. Right-click the QR code to save it instead.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', link);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Share with QR code">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <QrCode className="h-4 w-4 text-blue-950" /> Share with QR code
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <p className="text-sm font-extrabold text-slate-900">{resource.title}</p>
          <p className="text-[11px] font-semibold text-slate-500">{resource.courseCode}</p>
        </div>

        <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-2xl border-4 border-amber-400 bg-white">
          {qr ? <img src={qr} alt={`QR code for ${resource.title}`} className="h-full w-full rounded-xl" /> : <span className="text-xs text-slate-400">{error || 'Generating...'}</span>}
        </div>

        <p className="break-all rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">{link}</p>
        {error && qr && <p role="alert" className="text-[11px] text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={download} disabled={!qr} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-950 py-2.5 text-xs font-bold text-amber-300 disabled:opacity-50">
            <Download className="h-4 w-4" /> Save image
          </button>
          <button type="button" onClick={copy} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-950 py-2.5 text-xs font-bold text-blue-950 hover:bg-blue-50">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}