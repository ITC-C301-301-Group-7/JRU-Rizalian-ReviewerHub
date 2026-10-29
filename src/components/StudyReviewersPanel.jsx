import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, Download, ExternalLink, LoaderCircle, MessageSquare, Search, Star, X } from 'lucide-react';
import { apiRequest, formatFileSize } from '../utils/teacherApi';
import { fetchBlob, saveBlob } from '../utils/Authedfile';

// "Study Reviewers & Files" tab: the student's saved reviewers and the latest shared ones,
// loaded from the API. Download saves the real file; Open shows the full details.
// rank / metric are used by the Top Reviewers panel; compact stacks the buttons for narrow columns.
export function ReviewerRow({ item, token, onOpen, rank, metric, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      saveBlob(await fetchBlob(item.downloadUrl, token), item.filename || 'reviewer');
    } catch (err) {
      setError(err.message || 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className={`flex justify-between gap-3 ${compact ? 'flex-col' : 'items-center'}`}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {rank ? (
            <span
              aria-label={`Rank ${rank}`}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                rank === 1 ? 'bg-amber-400 text-[#002147]' : rank === 2 ? 'bg-slate-300 text-slate-800' : rank === 3 ? 'bg-orange-300 text-orange-950' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {rank}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <span className="rounded bg-[#002147] px-2 py-0.5 text-[10px] text-white">{item.courseCode}</span>
            <h3 className="mt-1 truncate text-xs font-bold">{item.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
              By {item.author}
              {metric ? (
                <span className="font-bold text-[#002147]">{metric}</span>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-500" />
                    {item.ratingCount > 0 ? `${item.ratingAverage} (${item.ratingCount})` : 'No ratings'}
                  </span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} />{item.commentCount}</span>
                  {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
                </>
              )}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${compact ? 'pl-10' : 'shrink-0'}`}>
          <button type="button" onClick={() => onOpen(item.id)} className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#002147] px-3 py-2 text-xs font-bold text-[#002147] hover:bg-blue-50">
            <ExternalLink size={14} />Open
          </button>
          <button type="button" onClick={download} disabled={busy} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#002147] px-3 py-2 text-xs font-bold text-amber-300 disabled:opacity-60">
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}Download
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function Section({ title, icon, items, empty, token, onOpen, loading, error }) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-700">{icon}{title}</h3>
      {loading && <p className="flex items-center gap-2 p-3 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading...</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">{empty}</p>}
      {items.map((item) => <ReviewerRow key={item.id} item={item} token={token} onOpen={onOpen} />)}
    </div>
  );
}

export function StudyReviewersPanel({ token, onOpenResource, onBrowse, refreshKey }) {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState({ items: [], loading: true, error: '' });
  const [latest, setLatest] = useState({ items: [], loading: true, error: '' });

  const load = useCallback(async (path, setter, signal) => {
    setter({ items: [], loading: true, error: '' });
    try {
      const data = await apiRequest(path, token, { signal });
      setter({ items: Array.isArray(data.data) ? data.data : [], loading: false, error: '' });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setter({ items: [], loading: false, error: err.message });
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    load('/bookmarks?per_page=6', setSaved, controller.signal);
    load('/resources?per_page=6', setLatest, controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const matches = useCallback((r) => {
    const q = query.trim().toLowerCase();
    return !q || `${r.title} ${r.courseCode} ${r.author}`.toLowerCase().includes(q);
  }, [query]);

  const savedShown = useMemo(() => saved.items.filter(matches), [saved.items, matches]);
  const latestShown = useMemo(() => latest.items.filter(matches), [latest.items, matches]);

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-black">Saved Study Materials &amp; Shared Reviewers</h2>
          <p className="mt-1 text-xs text-slate-500">Open or download real reviewers from the community.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search materials..." className="rounded-xl border bg-slate-50 py-2 pl-8 pr-8 text-xs" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-2"><X size={14} /></button>}
        </div>
      </div>

      <Section title="Saved by you" icon={<Bookmark size={14} className="text-amber-500" />} items={savedShown} loading={saved.loading} error={saved.error} token={token} onOpen={onOpenResource}
        empty={query ? `No saved reviewers match “${query}”.` : 'Nothing saved yet. Tap the bookmark icon on any reviewer in the community.'} />

      <Section title="Latest shared reviewers" icon={null} items={latestShown} loading={latest.loading} error={latest.error} token={token} onOpen={onOpenResource}
        empty={query ? `No shared reviewers match “${query}”.` : 'No reviewers have been shared yet.'} />

      {query && <p className="text-[11px] text-slate-500">Search covers the items shown here. Use the community page to search all reviewers.</p>}

      <button type="button" onClick={onBrowse} className="cursor-pointer rounded-xl border border-blue-950 px-4 py-2 text-xs font-bold text-blue-950 hover:bg-blue-50">
        Browse all reviewers in the Community
      </button>
    </section>
  );
}

export default StudyReviewersPanel;