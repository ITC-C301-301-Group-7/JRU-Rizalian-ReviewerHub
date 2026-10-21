import React, { useCallback, useEffect, useState } from 'react';
import {
  X, Star, Bookmark, QrCode, Eye, Download, Languages, MessageSquare, Trash2, LoaderCircle, Send,
} from 'lucide-react';
import PdfPreview from './PdfPreview';
import QrShareModal from './QrShareModal';
import { apiRequest, formatDate, formatFileSize } from '../utils/teacherApi';
import { fetchBlob, saveBlob } from '../utils/Authedfile';

// Everything about one resource: details, rating, bookmark, QR share, comments.
// Opened from the community feed, the Saved list, the QR scanner, and shared links.
export default function ResourceDetailModal({ resourceId, token, currentUser, onClose, onChanged, onTranslate }) {
  const [resource, setResource] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentMeta, setCommentMeta] = useState({ page: 1, lastPage: 1 });
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const isOwner = resource && currentUser?.id === resource.userId;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !showPreview && !showQr && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showPreview, showQr]);

  const loadComments = useCallback(
    async (page = 1, signal) => {
      setCommentsLoading(true);
      try {
        const data = await apiRequest(`/resources/${resourceId}/comments?page=${page}`, token, { signal });
        setComments((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
        setCommentMeta({ page: data.current_page ?? page, lastPage: data.last_page ?? 1 });
      } catch (err) {
        if (err.name !== 'AbortError') setActionError(err.message);
      } finally {
        if (!signal?.aborted) setCommentsLoading(false);
      }
    },
    [resourceId, token]
  );

  useEffect(() => {
    const controller = new AbortController();
    setResource(null);
    setLoadError('');

    apiRequest(`/resources/${resourceId}`, token, { signal: controller.signal })
      .then((data) => {
        setResource(data.resource);
        loadComments(1, controller.signal);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoadError(err.message);
      });

    return () => controller.abort();
  }, [resourceId, token, loadComments]);

  const run = async (fn) => {
    setActionError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleBookmark = () =>
    run(async () => {
      const next = !resource.bookmarked;
      await apiRequest(`/resources/${resource.id}/bookmark`, token, { method: next ? 'PUT' : 'DELETE' });
      setResource((r) => ({ ...r, bookmarked: next }));
      onChanged?.();
    });

  const rate = (stars) =>
    run(async () => {
      const data = await apiRequest(`/resources/${resource.id}/rating`, token, { method: 'PUT', body: { rating: stars } });
      setResource((r) => ({ ...r, ...data }));
      onChanged?.();
    });

  const download = () =>
    run(async () => {
      saveBlob(await fetchBlob(resource.downloadUrl, token), resource.filename || 'reviewer');
    });

  const postComment = async (e) => {
    e.preventDefault();
    const body = newComment.trim();
    if (!body) return;

    setPosting(true);
    setActionError('');
    try {
      const data = await apiRequest(`/resources/${resource.id}/comments`, token, { method: 'POST', body: { body } });
      setComments((prev) => [data.comment, ...prev]);
      setResource((r) => ({ ...r, commentCount: data.commentCount }));
      setNewComment('');
      onChanged?.();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = (comment) =>
    run(async () => {
      if (!window.confirm('Delete this comment?')) return;
      const data = await apiRequest(`/comments/${comment.id}`, token, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setResource((r) => ({ ...r, commentCount: data.commentCount }));
      onChanged?.();
    });

  const shownStars = resource?.myRating || Math.round(resource?.ratingAverage || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Reviewer details">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between bg-[#002147] p-4 text-white">
          <h3 className="text-sm font-black">Reviewer details</h3>
          <button type="button" onClick={onClose} className="cursor-pointer text-white/80 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 text-xs">
          {loadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{loadError}</p>
          )}
          {!resource && !loadError && (
            <p className="flex items-center gap-2 p-6 text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading...</p>
          )}

          {resource && (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-black text-amber-300">{resource.courseCode}</span>
                  {resource.college && <span className="text-[10px] font-bold text-slate-500">{resource.college}</span>}
                </div>
                <h2 className="mt-1 text-base font-extrabold text-slate-900">{resource.title}</h2>
                {resource.description && <p className="mt-1 text-slate-600">{resource.description}</p>}
                <p className="mt-2 text-[11px] text-slate-500">
                  By <strong>{resource.author}</strong> · {formatDate(resource.createdAt)} · {resource.filename} · {formatFileSize(resource.fileSize)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                <span className="font-bold text-slate-600">Rate usefulness:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={busy || isOwner}
                      onClick={() => rate(star)}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Star className={`h-5 w-5 ${star <= shownStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  {resource.ratingCount > 0 ? `${resource.ratingAverage} average · ${resource.ratingCount} rating${resource.ratingCount > 1 ? 's' : ''}` : 'No ratings yet'}
                </span>
                {isOwner && <span className="text-[11px] italic text-slate-400">You can’t rate your own upload.</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toggleBookmark} disabled={busy} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 font-bold disabled:opacity-60 ${resource.bookmarked ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  <Bookmark className={`h-4 w-4 ${resource.bookmarked ? 'fill-amber-400' : ''}`} /> {resource.bookmarked ? 'Saved' : 'Save for later'}
                </button>
                <button type="button" onClick={() => setShowQr(true)} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50">
                  <QrCode className="h-4 w-4" /> QR code
                </button>
                <button type="button" onClick={() => setShowPreview(true)} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button type="button" onClick={download} disabled={busy} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-950 px-3 py-2 font-bold text-amber-300 disabled:opacity-60">
                  <Download className="h-4 w-4" /> Download
                </button>
                {onTranslate && (
                  <button type="button" onClick={() => onTranslate(resource)} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50">
                    <Languages className="h-4 w-4" /> Translate
                  </button>
                )}
              </div>

              {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-700">{actionError}</p>}

              <section className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <MessageSquare className="h-4 w-4 text-blue-950" /> Comments ({resource.commentCount})
                </h4>

                <form onSubmit={postComment} className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={1000}
                    rows={2}
                    placeholder="Share feedback, a correction, or a thank-you…"
                    aria-label="Write a comment"
                    className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-950"
                  />
                  <button type="submit" disabled={posting || !newComment.trim()} className="flex cursor-pointer items-center gap-1 self-end rounded-lg bg-blue-950 px-3 py-2 font-bold text-amber-300 disabled:opacity-50">
                    {posting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
                  </button>
                </form>

                <ul className="space-y-2">
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800">
                          {c.author}
                          {c.authorRole === 'teacher' && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">Faculty</span>}
                          <span className="ml-2 font-normal text-slate-400">{formatDate(c.createdAt)}</span>
                        </p>
                        {c.canDelete && (
                          <button type="button" onClick={() => deleteComment(c)} disabled={busy} title="Delete comment" aria-label="Delete comment" className="cursor-pointer text-slate-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{c.body}</p>
                    </li>
                  ))}
                  {!commentsLoading && comments.length === 0 && <li className="text-slate-500">No comments yet. Be the first to share feedback.</li>}
                </ul>

                {commentsLoading && <p className="flex items-center gap-2 text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading comments...</p>}
                {!commentsLoading && commentMeta.page < commentMeta.lastPage && (
                  <button type="button" onClick={() => loadComments(commentMeta.page + 1)} className="cursor-pointer font-bold text-blue-950 underline">
                    Load more comments
                  </button>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {showPreview && resource && <PdfPreview resource={resource} token={token} onClose={() => setShowPreview(false)} />}
      {showQr && resource && <QrShareModal resource={resource} onClose={() => setShowQr(false)} />}
    </div>
  );
}