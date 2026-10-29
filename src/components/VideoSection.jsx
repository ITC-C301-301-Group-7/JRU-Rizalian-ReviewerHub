import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, LoaderCircle, Play, Plus, Trash2, Video, X } from 'lucide-react';
import { apiRequest } from '../utils/teacherApi';

const PAGE_SIZE = 6; // videos loaded per request

const COLLEGES = [
  'College of Business Administration',
  'College of Computer Studies',
  'College of Nursing & Health Sciences',
  'College of Engineering & Tech',
];

const EMPTY_FORM = {
  title: '',
  courseCode: '',
  college: COLLEGES[0],
  url: '',
  description: '',
};

const PROVIDER_LABEL = { youtube: 'YouTube', vimeo: 'Vimeo' };

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '');

// "Video Reviewers" section of the Peer Reviewers Feed. Students share YouTube / Vimeo links;
// the player opens right inside the card. `search` and `college` come from the feed's filters.
export function VideoSection({ token, search = '', college = 'All', refreshKey }) {
  const [state, setState] = useState({ items: [], loading: true, error: '', page: 1, lastPage: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestRef = useRef(0); // lets a newer request replace an older one

  const load = useCallback(async ({ page = 1, append = false, signal } = {}) => {
    const requestId = ++requestRef.current;

    if (append) setLoadingMore(true);
    else setState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (college !== 'All') params.set('college', college);

      const data = await apiRequest(`/videos?${params}`, token, { signal });
      if (requestId !== requestRef.current) return;

      const incoming = Array.isArray(data.data) ? data.data : [];

      setState((prev) => {
        const base = append ? prev.items : [];
        const seen = new Set(base.map((video) => video.id));

        return {
          items: [...base, ...incoming.filter((video) => !seen.has(video.id))],
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

  // Reload page 1 when the feed's filters change (waits 300 ms while the user is typing).
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load({ signal: controller.signal }), 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, refreshKey]);

  const updateForm = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const closeForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.courseCode.trim() || !form.url.trim()) {
      setFormError('Please fill in the title, course code, and video link.');
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest('/videos', token, {
        method: 'POST',
        body: {
          title: form.title.trim(),
          course_code: form.courseCode.trim(),
          college: form.college,
          description: form.description.trim(),
          url: form.url.trim(),
        },
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      setNotice('Video shared with the community.');
      setTimeout(() => setNotice(''), 5000);
      await load();
    } catch (err) {
      setFormError(err.message || 'Could not share the video. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (video) => {
    if (!window.confirm(`Remove "${video.title}"? This cannot be undone.`)) return;

    setBusyId(video.id);
    setActionError('');

    try {
      await apiRequest(`/videos/${video.id}`, token, { method: 'DELETE' });
      setState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== video.id), total: Math.max(0, prev.total - 1) }));
      if (playingId === video.id) setPlayingId(null);
    } catch (err) {
      setActionError(err.message || 'Could not remove the video.');
    } finally {
      setBusyId(null);
    }
  };

  const { items, loading, error, page, lastPage, total } = state;
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none';

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="video-section-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 id="video-section-title" className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Video size={16} className="text-red-600" />
            Video Reviewers
            {!loading && !error && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{total}</span>}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Watch review videos shared by other students, or share a YouTube or Vimeo link of your own.</p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          aria-expanded={showForm}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#002147] px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-blue-900"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Share a Video'}
        </button>
      </div>

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="video-url" className="mb-1 block text-[11px] font-bold text-slate-600">YouTube or Vimeo link</label>
              <input id="video-url" type="url" value={form.url} onChange={updateForm('url')} placeholder="https://www.youtube.com/watch?v=..." maxLength={500} className={inputClass} />
            </div>
            <div>
              <label htmlFor="video-title" className="mb-1 block text-[11px] font-bold text-slate-600">Title</label>
              <input id="video-title" type="text" value={form.title} onChange={updateForm('title')} placeholder="e.g. Binary Trees in 10 minutes" maxLength={255} className={inputClass} />
            </div>
            <div>
              <label htmlFor="video-course" className="mb-1 block text-[11px] font-bold text-slate-600">Course code</label>
              <input id="video-course" type="text" value={form.courseCode} onChange={updateForm('courseCode')} placeholder="e.g. CS 201" maxLength={50} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="video-college" className="mb-1 block text-[11px] font-bold text-slate-600">College</label>
              <select id="video-college" value={form.college} onChange={updateForm('college')} className={inputClass}>
                {COLLEGES.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="video-description" className="mb-1 block text-[11px] font-bold text-slate-600">Description (optional)</label>
              <textarea id="video-description" rows={2} value={form.description} onChange={updateForm('description')} placeholder="What topics does this video cover?" maxLength={2000} className={inputClass} />
            </div>
          </div>

          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{formError}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="cursor-pointer rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#002147] px-3.5 py-2 text-xs font-bold text-amber-300 disabled:opacity-60">
              {submitting && <LoaderCircle size={14} className="animate-spin" />}
              {submitting ? 'Sharing...' : 'Share Video'}
            </button>
          </div>
        </form>
      )}

      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}

      {loading && (
        <p className="flex items-center justify-center gap-2 p-6 text-xs text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading videos...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => load()} className="cursor-pointer font-bold underline">Retry</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
          {search.trim() || college !== 'All' ? 'No videos match your search.' : 'No videos have been shared yet. Be the first to share one!'}
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((video) => (
            <article key={video.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {playingId === video.id ? (
                <iframe
                  title={video.title}
                  src={`${video.embedUrl}${video.embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="aspect-video w-full border-0 bg-black"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlayingId(video.id)}
                  aria-label={`Play ${video.title}`}
                  className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-gradient-to-br from-[#002147] to-slate-700"
                >
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-white/30"><Video size={40} /></span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-[#002147] shadow-lg"><Play size={20} className="ml-0.5 fill-current" /></span>
                  </span>
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">{PROVIDER_LABEL[video.provider] || 'Video'}</span>
                </button>
              )}

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="min-w-0">
                  <span className="rounded bg-[#002147] px-2 py-0.5 text-[10px] text-white">{video.courseCode}</span>
                  <h3 className="mt-1 line-clamp-2 text-xs font-bold text-slate-900">{video.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">By {video.author} · {formatDate(video.createdAt)}</p>
                  {video.description && <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{video.description}</p>}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002147] hover:underline">
                    <ExternalLink size={12} />Open on {PROVIDER_LABEL[video.provider] || 'site'}
                  </a>
                  {video.canDelete && (
                    <button
                      type="button"
                      onClick={() => remove(video)}
                      disabled={busyId === video.id}
                      aria-label={`Remove ${video.title}`}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                      {busyId === video.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
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
            {loadingMore && <LoaderCircle size={14} className="animate-spin" />}
            Show more videos
          </button>
        </div>
      )}
    </section>
  );
}

export default VideoSection;