import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, Star, LoaderCircle, MessageSquare } from 'lucide-react';
import { apiRequest, formatDate } from '../utils/teacherApi';

// The signed-in user's saved reviewers.
export function BookmarksView({ token, onOpenResource, refreshKey }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (page = 1, signal) => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');

      try {
        const data = await apiRequest(`/bookmarks?page=${page}&per_page=12`, token, { signal });
        setItems((prev) => (page === 1 ? data.data : [...prev, ...data.data.filter((n) => !prev.some((p) => p.id === n.id))]));
        setMeta({ page: data.current_page ?? page, lastPage: data.last_page ?? 1, total: data.total ?? data.data.length });
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(1, controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await apiRequest(`/resources/${item.id}/bookmark`, token, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Bookmark className="h-5 w-5 text-amber-500" />
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Saved reviewers</h2>
        {!loading && <span className="text-xs text-slate-500">({meta.total})</span>}
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {loading && <p className="flex items-center justify-center gap-2 p-8 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading...</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          Nothing saved yet. Tap the bookmark icon on any reviewer in the community to keep it here.
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-black text-amber-300">{item.courseCode}</span>
              <h3 className="mt-1 text-sm font-extrabold text-slate-900">{item.title}</h3>
              <p className="text-[11px] text-slate-500">By {item.author} · {formatDate(item.createdAt)}</p>
            </div>
            <button type="button" onClick={() => remove(item)} disabled={busyId === item.id} title="Remove from saved" aria-label="Remove from saved" className="cursor-pointer p-1.5 text-amber-500 hover:text-slate-400 disabled:opacity-50">
              <Bookmark className="h-5 w-5 fill-current" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {item.ratingCount > 0 ? `${item.ratingAverage} (${item.ratingCount})` : 'No ratings'}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {item.commentCount}</span>
            </span>
            <button type="button" onClick={() => onOpenResource(item.id)} className="cursor-pointer rounded-lg bg-blue-950 px-3 py-1.5 font-bold text-amber-300">
              Open
            </button>
          </div>
        </div>
      ))}

      {meta.page < meta.lastPage && (
        <div className="text-center">
          <button type="button" onClick={() => load(meta.page + 1)} disabled={loadingMore} className="cursor-pointer rounded-xl border border-blue-950 px-4 py-2 text-xs font-bold text-blue-950 hover:bg-blue-50 disabled:opacity-60">
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksView;