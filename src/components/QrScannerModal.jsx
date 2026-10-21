import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, ImageUp, Link2 } from 'lucide-react';
import { parseResourceId } from '../utils/resourceLinks';

const SCAN_INTERVAL_MS = 150;
const MAX_FRAME_WIDTH = 640;

// Scans a QR code with the camera (or from a picture / pasted link) and returns the resource id.
export default function QrScannerModal({ onClose, onResource }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handledRef = useRef(false);
  const lastRejectedRef = useRef('');
  const [cameraError, setCameraError] = useState('');
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState('');
  const [ready, setReady] = useState(false);

  // Shared by camera frames, uploaded pictures and pasted links.
  const handleText = (text) => {
    if (handledRef.current) return;

    const id = parseResourceId(text);
    if (id) {
      handledRef.current = true;
      onResource(id);
    } else if (text !== lastRejectedRef.current) {
      lastRejectedRef.current = text;
      setNotice('That QR code is not a ReviewerHub resource.');
    }
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    let timer = null;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) handleText(code.data);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('The camera needs a secure page (https:// or localhost). You can still upload a picture of the QR code below.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setReady(true);
        timer = setInterval(scanFrame, SCAN_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser, or upload a picture of the QR code below.'
            : 'Could not start the camera. Upload a picture of the QR code below instead.'
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // handleText only uses refs and stable props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanPicture = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });

      if (code?.data) handleText(code.data);
      else setNotice('No QR code was found in that picture. Try a sharper, closer photo.');
    } catch {
      setNotice('That file could not be read as a picture.');
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    if (!parseResourceId(manual)) setNotice('That is not a ReviewerHub resource link.');
    else handleText(manual.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Scan QR code">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Camera className="h-4 w-4 text-blue-950" /> Scan a resource QR code
          </h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!cameraError ? (
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border-4 border-amber-400 bg-slate-900">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {!ready && <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-300">Starting camera...</p>}
            {ready && <div className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-red-500" />}
          </div>
        ) : (
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{cameraError}</p>
        )}
        <canvas ref={canvasRef} className="hidden" />

        <p className="text-center text-xs text-slate-500">Point the camera at a ReviewerHub QR code.</p>

        {notice && <p role="alert" className="rounded-lg bg-red-50 p-2 text-center text-[11px] font-semibold text-red-700">{notice}</p>}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-950 py-2.5 text-xs font-bold text-blue-950 hover:bg-blue-50">
          <ImageUp className="h-4 w-4" /> Upload a picture of the QR code
          <input type="file" accept="image/*" onChange={scanPicture} className="hidden" />
        </label>

        <form onSubmit={submitManual} className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="…or paste a shared link"
            aria-label="Paste a shared resource link"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-950"
          />
          <button type="submit" className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-amber-300">
            <Link2 className="h-3.5 w-3.5" /> Open
          </button>
        </form>
      </div>
    </div>
  );
}