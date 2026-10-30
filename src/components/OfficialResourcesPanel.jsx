import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, LoaderCircle, ShieldCheck } from 'lucide-react';
import { apiRequest, formatDate, formatFileSize } from '../utils/teacherApi';
import { fetchBlob, saveBlob } from '../utils/Authedfile';
import { OFFICIAL_REFERENCES } from '../data/officialReferences';

const PAGE_SIZE = 6;

const matchesCollege = (reference, college) =>
  college === 'All' || !reference.college || reference.college.toLowerCase().includes(college.toLowerCase());

const matchesSearch = (reference, search) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return [reference.title, reference.source, reference.category, reference.description, reference.keywords]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(needle);
};

// "Official Learning Resources" tab of Reviewer Community:
//   1. documents published by JRU faculty (real files from the database: open, preview, download, quiz, translate)
//   2. trusted outside references (CHED, OpenStax, ...) that open the publisher's website
// `search` and `college` come from the feed's search box and college filter.
export function OfficialResourcesPanel({ token, search = '', college = 'All', onOpenResource, refreshKey, isTeacher = false }) {
  const [state, setState] = useState({ items: [], loading: true, error: '', page: 1, lastPage: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const requestRef = useRef(0); // lets a newer request replace an older one

  const load = useCallback(async ({ page = 1, append = false, signal } = {}) => {
    const requestId = ++requestRef.current;

    if (append) setLoadingMore(true);
    else setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const params = new URLSearchParams({ official: '1', page: String(page), per_page: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (college !== 'All') params.set('college', college);

      const data = await apiRequest(`/resources?${params}`, token, { signal });
      if (requestId !== requestRef.current) return;

      const incoming = Array.isArray(data.data) ? data.data : [];

      setState((prev) => {
        const base = append ? prev.items : [];
        const seen = new Set(base.map((item) => item.id));

        return {
          items: [...base, ...incoming.filter((item) => !seen.has(item.id))],
          loading: false,
          error: '',
          page: data.current_page ?? page,
          lastPage: data.last_page ?? 1,
          total: data.total ?? incoming.length,
        };
      });
    } catch (err) {
      if (err.name === 'AbortError' || requestId !== requestRef.current) return;
      setState((prev) => ({ ...prev, items: append ? prev.items : [], loading: false, error: err.message }));
    } finally {
      if (requestId === requestRef.current) setLoadingMore(false);
    }
  }, [token, search, college]);

  // Reload page 1 when the filters change (waits 300 ms while the user is typing) or after an upload.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load({ signal: controller.signal }), 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, refreshKey]);

  const download = async (item) => {
    setDownloadingId(item.id);
    setActionError('');

    try {
      saveBlob(await fetchBlob(item.downloadUrl, token), item.filename || 'document');
    } catch (err) {
      setActionError(err.message || 'Could not download the file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const { items, loading, error, page, lastPage, total } = state;
  const references = OFFICIAL_REFERENCES.filter((ref) => matchesCollege(ref, college) && matchesSearch(ref, search));
  const filtered = search.trim() || college !== 'All';

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="official-faculty-title">
        <div>
          <h3 id="official-faculty-title" className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Published by JRU faculty
            {!loading && !error && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{total}</span>}
          </h3>
          <p className="mt-1 text-xs text-slate-500">Documents uploaded by verified faculty accounts. Open one to preview it, download it, or turn it into a quiz.</p>
        </div>

        {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}

        {loading && (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading official documents...
          </p>
        )}

        {!loading && error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => load()} className="cursor-pointer font-bold underline">Retry</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
            {filtered
              ? 'No faculty documents match your search.'
              : isTeacher
                ? 'No official documents yet. Upload a reviewer and it will appear here for every student.'
                : 'No faculty documents have been published yet. Check back soon.'}
          </p>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                      <span className="truncate">Faculty · {item.author}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">{formatFileSize(item.fileSize)}</span>
                  </div>

                  <div>
                    <span className="rounded bg-[#002147] px-2 py-0.5 text-[10px] text-white">{item.courseCode}</span>
                    <h4 className="mt-1.5 text-sm font-black text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {[item.authorDepartment || item.college, formatDate(item.createdAt)].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {item.description && <p className="line-clamp-2 text-xs text-slate-600">{item.description}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => onOpenResource?.(item.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#002147] px-3 py-1.5 text-xs font-bold text-[#002147] hover:bg-blue-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </button>
                  <button
                    type="button"
                    onClick={() => download(item)}
                    disabled={downloadingId === item.id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#002147] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900 disabled:opacity-60"
                  >
                    {downloadingId === item.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && page < lastPage && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => load({ page: page + 1, append: true })}
              disabled={loadingMore}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#002147] px-4 py-2 text-xs font-bold text-[#002147] hover:bg-blue-50 disabled:opacity-60"
            >
              {loadingMore && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Show more documents
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="official-external-title">
        <div>
          <h3 id="official-external-title" className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ExternalLink className="h-4 w-4 text-blue-700" />
            Trusted external references
          </h3>
          <p className="mt-1 text-xs text-slate-500">Free resources from CHED and open-education publishers. They open the publisher’s own website in a new tab.</p>
        </div>

        {references.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
            No external references match your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {references.map((reference) => (
              <article key={reference.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">{reference.source}</span>
                  <h4 className="text-sm font-black text-slate-900">{reference.title}</h4>
                  <p className="text-xs text-slate-600">{reference.description}</p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{reference.category}</span>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#002147] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900"
                  >
                    <span>Open website</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OfficialResourcesPanel;