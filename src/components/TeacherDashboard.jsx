import React, {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import {
  LayoutDashboard, FolderCog, UploadCloud, Inbox, Users, LogOut, Search, Eye, Download,
  Pencil, EyeOff, RotateCcw, Trash2, X, LoaderCircle, FileText, ChevronLeft, ChevronRight,
  BookOpen, ShieldCheck, TrendingUp, UserPlus, AlertTriangle, QrCode, Star, MessageSquare,
  Bookmark, CheckCircle2, RefreshCw, ArrowRight,
} from 'lucide-react';
import PdfPreview from './PdfPreview';
import { fetchBlob, saveBlob } from '../utils/Authedfile';
import { teacherRequest, uploadWithProgress, formatFileSize, formatDate } from '../utils/teacherApi';
import { JRU_DEPARTMENTS } from '../types';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // matches the backend limit (20 MB)
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'];
const TAB_STORAGE_KEY = 'rh.teacher.tab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'manage', label: 'Manage Reviewers', icon: FolderCog },
  { id: 'upload', label: 'Upload Resource', icon: UploadCloud },
  { id: 'submissions', label: 'Student Submissions', icon: Inbox },
  { id: 'community', label: 'Community', icon: Users },
];

// 16px on phones (stops iOS from zooming into the field), compact on larger screens.
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/15 sm:text-sm';
const iconBtn =
  'rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#002147] disabled:opacity-40 cursor-pointer';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a2f5c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002147] disabled:opacity-60 cursor-pointer';
const ghostBtn =
  'rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200 cursor-pointer';
const dangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer';

/* ---------- API + toast context ---------- */

const DashboardContext = createContext(null);
const useDashboard = () => useContext(DashboardContext);

function DashboardProvider({ token, onSignOut, children }) {
  const [toasts, setToasts] = useState([]);
  const signOutRef = useRef(onSignOut);

  useEffect(() => {
    signOutRef.current = onSignOut;
  }, [onSignOut]);

  const notify = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list, { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4500);
  }, []);

  // Every faculty request goes through here so an expired session signs the user out
  // instead of leaving each panel showing its own "session expired" banner.
  const request = useCallback(
    (path, options) =>
      teacherRequest(path, token, options).catch((err) => {
        if (err.status === 401) signOutRef.current?.();
        throw err;
      }),
    [token]
  );

  const value = useMemo(() => ({ token, request, notify, signOut: () => signOutRef.current?.() }), [token, request, notify]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold shadow-lg animate-slideUp ${
              t.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {t.tone === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </DashboardContext.Provider>
  );
}

/* ---------- small shared pieces ---------- */

function StatCard({ icon: Icon, label, value, hint, tone = 'text-[#002147]', onClick }) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value ?? '—'}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const base = 'flex h-full flex-col items-start justify-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm';

  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} cursor-pointer transition hover:border-[#002147]/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#002147]`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}

function StatusBadge({ status }) {
  const hidden = status === 'hidden';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black uppercase ${
        hidden ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
      }`}
    >
      {hidden ? <EyeOff className="h-3 w-3" aria-hidden="true" /> : <Eye className="h-3 w-3" aria-hidden="true" />}
      {hidden ? 'Hidden' : 'Visible'}
    </span>
  );
}

function Engagement({ row }) {
  const rated = row.ratingCount > 0;
  return (
    <p className="flex flex-nowrap items-center gap-x-3 whitespace-nowrap text-xs text-slate-700">
      <span className="inline-flex items-center gap-1" title={rated ? `${row.ratingAvg} average from ${row.ratingCount} ratings` : 'No ratings yet'}>
        <Star className={`h-3.5 w-3.5 ${rated ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} aria-hidden="true" />
        <span className="font-bold">{rated ? row.ratingAvg : '—'}</span>
        {rated && <span className="text-slate-500">({row.ratingCount})</span>}
        <span className="sr-only">{rated ? ' rating' : 'No ratings yet'}</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Comments">
        <MessageSquare className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        {row.commentCount}
        <span className="sr-only"> comments</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Bookmarks">
        <Bookmark className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        {row.bookmarkCount}
        <span className="sr-only"> bookmarks</span>
      </span>
    </p>
  );
}

function Pager({ page, lastPage, total, onPage }) {
  if (!total) return null;
  return (
    <div className="flex items-center justify-between pt-1 text-sm text-slate-700">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${iconBtn} disabled:cursor-not-allowed`} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold" aria-live="polite">
          Page {page} of {lastPage}
        </span>
        <button type="button" disabled={page >= lastPage} onClick={() => onPage(page + 1)} className={`${iconBtn} disabled:cursor-not-allowed`} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Accessible dialog: labelled, Escape closes, Tab stays inside, focus returns to the opener.
function Modal({ title, onClose, children }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const focusable = () =>
      [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);

    (panel.querySelector('[data-autofocus]') || focusable()[0])?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') return onCloseRef.current();
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl animate-slideUp">
        <div className="mb-3 flex items-center justify-between">
          <h3 id={titleId} className="text-base font-black text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 cursor-pointer" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold text-red-800 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer">
          <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-xs font-bold text-slate-800 ${className}`}>
      {label}
      {children}
    </label>
  );
}

/* ---------- Overview data (loaded once in the shell, shared by Overview + Community) ---------- */

function useOverview(dataVersion) {
  const { request } = useDashboard();
  const [state, setState] = useState({ data: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request('/teacher/overview', { signal: controller.signal })
      .then((data) => setState({ data, error: '' }))
      .catch((err) => {
        // Keep showing the last good numbers if a background refresh fails.
        if (err.name !== 'AbortError') setState((s) => ({ ...s, error: err.message }));
      });
    return () => controller.abort();
  }, [request, dataVersion, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

/* ---------- Overview ---------- */

function ActivityChart({ activity }) {
  const max = Math.max(1, ...activity.map((d) => d.uploads));
  const total = activity.reduce((sum, d) => sum + d.uploads, 0);
  const summary = activity.map((d) => `${d.label}: ${d.uploads}`).join(', ');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-slate-900">Uploads — last 7 days</h3>
        <span className="text-xs font-semibold text-slate-600">{total} total</span>
      </div>
      <div className="mt-4 flex gap-2" role="img" aria-label={`Uploads per day. ${summary}`}>
        <div className="flex h-32 flex-col justify-between pb-6 text-right text-xs text-slate-500" aria-hidden="true">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 border-b border-t border-dashed border-slate-200" aria-hidden="true" />
          <div className="relative flex gap-2 sm:gap-3">
            {activity.map((day, i) => {
              const isToday = i === activity.length - 1;
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center">
                  <div className="flex h-32 w-full flex-col items-center justify-end">
                    {day.uploads > 0 && <span className="mb-0.5 text-xs font-bold text-slate-700">{day.uploads}</span>}
                    <div
                      className={`w-full max-w-10 rounded-t-md ${isToday ? 'bg-amber-500' : 'bg-[#002147]'} ${day.uploads === 0 ? 'opacity-20' : ''}`}
                      style={{ height: day.uploads === 0 ? '3px' : `${Math.max(6, (day.uploads / max) * 100)}%`, maxHeight: '100%' }}
                    />
                  </div>
                  <span className={`mt-1 text-xs ${isToday ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{isToday ? 'Today' : day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CollegeBreakdown({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-black text-slate-900">Visible reviewers by college</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No reviewers with a college yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.college} className="text-xs">
              <div className="flex justify-between gap-2 text-slate-800">
                <span className="truncate">{r.college}</span>
                <span className="font-bold">{r.total}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#002147]" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OverviewPanel({ overview, onGo, onOpenResource }) {
  const { data, error, retry } = overview;

  if (!data) {
    return error ? (
      <ErrorBanner message={error} onRetry={retry} />
    ) : (
      <div className="space-y-5" aria-busy="true" aria-label="Loading overview">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <SkeletonBlock key={i} className="h-24" />)}
        </div>
        <SkeletonBlock className="h-52" />
      </div>
    );
  }

  const { stats, activity, topContributors, recent, byCollege = [], lowRated = [] } = data;

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} onRetry={retry} />

      {/* Cards that point at a list are clickable and open it pre-filtered. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Total reviewers" value={stats.totalReviewers} hint={`${stats.visibleReviewers ?? 0} visible`} onClick={() => onGo('manage')} />
        <StatCard icon={Inbox} label="Student submissions" value={stats.studentSubmissions} onClick={() => onGo('submissions')} />
        <StatCard icon={TrendingUp} label="New this week" value={stats.newThisWeek} tone="text-emerald-600" onClick={() => onGo('manage', { period: 'week' })} />
        <StatCard icon={EyeOff} label="Hidden" value={stats.hiddenReviewers} tone="text-rose-600" onClick={() => onGo('manage', { status: 'hidden' })} />
        <StatCard icon={Star} label="Avg. rating" value={stats.avgRating ?? '—'} hint={`${stats.totalRatings ?? 0} ratings`} tone="text-amber-500" />
        <StatCard icon={MessageSquare} label="Comments" value={stats.totalComments} />
        <StatCard icon={Bookmark} label="Bookmarks" value={stats.totalBookmarks} />
        <StatCard icon={UploadCloud} label="My uploads" value={stats.myUploads} onClick={() => onGo('manage', { author: 'mine' })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ActivityChart activity={activity} />

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-black text-slate-900">Top contributors</h3>
          {topContributors.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No student uploads yet.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {topContributors.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="mr-2 font-black text-amber-700">{i + 1}</span>
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-800">{c.uploads}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" /> Needs attention
          </h3>
          <p className="text-xs text-slate-600">Visible reviewers students rate 2.5★ or lower (2+ ratings).</p>
          {lowRated.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Nothing is flagged right now.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {lowRated.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <button type="button" onClick={() => onOpenResource?.(r.id)} className="block max-w-full truncate text-left font-bold text-slate-900 underline-offset-2 hover:underline cursor-pointer">
                      {r.title}
                    </button>
                    <span className="text-xs text-slate-600">{r.courseCode} · {r.author}</span>
                  </span>
                  <Engagement row={r} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <CollegeBreakdown rows={byCollege} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Recent uploads</h3>
          <button type="button" onClick={() => onGo('submissions')} className="inline-flex items-center gap-1 text-sm font-bold text-[#002147] underline-offset-2 hover:underline cursor-pointer">
            Review submissions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {recent.length === 0 && <li className="py-3 text-sm text-slate-600">Nothing uploaded yet.</li>}
          {recent.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="min-w-0 truncate">
                <button type="button" onClick={() => onOpenResource?.(r.id)} className="font-bold text-slate-900 underline-offset-2 hover:underline cursor-pointer">
                  {r.title}
                </button>
                <span className="text-slate-600"> · {r.courseCode} · {r.author}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <Engagement row={r} />
                <StatusBadge status={r.status} />
                <span className="text-xs text-slate-600">{formatDate(r.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Manage Reviewers + Student Submissions (same table, different defaults) ---------- */

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most bookmarked' },
  { value: 'title', label: 'Title A–Z' },
];

function ResourceManager({ mode, currentUserId, refreshKey, preset, onMutated, onOpenResource }) {
  const { token, request, notify } = useDashboard();
  const isSubmissions = mode === 'submissions';

  const [author, setAuthor] = useState(preset?.author ?? (isSubmissions ? 'student' : 'all'));
  const [status, setStatus] = useState(preset?.status ?? 'all');
  const [college, setCollege] = useState('all');
  const [period, setPeriod] = useState(preset?.period ?? 'all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyIds, setBusyIds] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [reloadTick, setReloadTick] = useState(0);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [hiding, setHiding] = useState(null); // array of rows being hidden
  const [deleting, setDeleting] = useState(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (signal) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), per_page: '10', author, status, period, sort });
        if (college !== 'all') params.set('college', college);
        if (search.trim()) params.set('search', search.trim());
        const data = await request(`/teacher/resources?${params}`, { signal });
        if (requestId !== requestRef.current) return;
        setRows(data.data || []);
        setMeta({ lastPage: data.last_page ?? 1, total: data.total ?? 0 });
        setSelected(new Set());
        // The last row of the last page was removed: step back instead of showing an empty page.
        if ((data.data || []).length === 0 && page > 1) setPage(page - 1);
      } catch (err) {
        if (err.name !== 'AbortError' && requestId === requestRef.current) setError(err.message);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [request, page, author, status, college, period, sort, search]
  );

  // Debounce typing in the search box; reloads when filters, page, or refreshKey change.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, refreshKey, reloadTick]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const filtersActive =
    search.trim() !== '' || college !== 'all' || period !== 'all' || status !== 'all' || (!isSubmissions && author !== 'all') || sort !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setCollege('all');
    setPeriod('all');
    setStatus('all');
    setSort('newest');
    if (!isSubmissions) setAuthor('all');
    setPage(1);
  };

  const markBusy = (ids, on) =>
    setBusyIds((list) => (on ? [...list, ...ids] : list.filter((id) => !ids.includes(id))));

  const applyStatus = async (targets, nextStatus, note) => {
    const ids = targets.map((r) => r.id);
    markBusy(ids, true);
    try {
      if (ids.length === 1) {
        await request(`/teacher/resources/${ids[0]}/status`, { method: 'PATCH', body: { status: nextStatus, note } });
      } else {
        await request('/teacher/resources/bulk-status', { method: 'PATCH', body: { ids, status: nextStatus, note } });
      }
      const verb = nextStatus === 'hidden' ? 'hidden from' : 'restored to';
      notify(ids.length === 1 ? `“${targets[0].title}” ${verb} the community.` : `${ids.length} reviewers ${verb} the community.`);
      setHiding(null);
      setSelected(new Set());
      onMutated();
      setReloadTick((n) => n + 1); // refetch so the list, filters and counts stay accurate
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      markBusy(ids, false);
    }
  };

  const remove = async (row) => {
    markBusy([row.id], true);
    try {
      await request(`/resources/${row.id}`, { method: 'DELETE' });
      notify(`“${row.title}” was deleted.`);
      setDeleting(null);
      onMutated();
      setReloadTick((n) => n + 1);
    } catch (err) {
      notify(err.message, 'error');
      setDeleting(null);
    } finally {
      markBusy([row.id], false);
    }
  };

  const download = async (row) => {
    markBusy([row.id], true);
    try {
      saveBlob(await fetchBlob(row.downloadUrl, token), row.filename || 'reviewer');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      markBusy([row.id], false);
    }
  };

  const toggleRow = (id) =>
    setSelected((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const selectedVisible = selectedRows.filter((r) => r.status !== 'hidden');
  const selectedHidden = selectedRows.filter((r) => r.status === 'hidden');
  const firstLoad = loading && rows.length === 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 sm:top-2.5" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => changeFilter(setSearch)(e.target.value)}
            placeholder="Search title, course code, or author"
            className={`${inputClass} pl-9`}
            aria-label="Search reviewers"
          />
        </div>
        <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${isSubmissions ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
          {!isSubmissions && (
            <select value={author} onChange={(e) => changeFilter(setAuthor)(e.target.value)} className={inputClass} aria-label="Filter by author">
              <option value="all">All reviewers</option>
              <option value="student">Student uploads</option>
              <option value="mine">My uploads</option>
            </select>
          )}
          <select value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)} className={inputClass} aria-label="Filter by visibility">
            <option value="all">Any status</option>
            <option value="approved">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <select value={college} onChange={(e) => changeFilter(setCollege)(e.target.value)} className={inputClass} aria-label="Filter by college">
            <option value="all">Any college</option>
            {JRU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={period} onChange={(e) => changeFilter(setPeriod)(e.target.value)} className={inputClass} aria-label="Filter by upload date">
            <option value="all">Any time</option>
            <option value="week">Last 7 days</option>
          </select>
          <select value={sort} onChange={(e) => changeFilter(setSort)(e.target.value)} className={inputClass} aria-label="Sort reviewers">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={() => setReloadTick((n) => n + 1)} />

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#002147]/20 bg-[#002147]/5 p-2.5 text-sm" role="region" aria-label="Bulk actions">
          <span className="font-bold text-[#002147]">{selected.size} selected</span>
          {selectedVisible.length > 0 && (
            <button type="button" className={`${iconBtn} inline-flex items-center gap-1.5 text-xs font-bold`} onClick={() => setHiding(selectedVisible)}>
              <EyeOff className="h-4 w-4" aria-hidden="true" /> Hide {selectedVisible.length}
            </button>
          )}
          {selectedHidden.length > 0 && (
            <button type="button" className={`${iconBtn} inline-flex items-center gap-1.5 text-xs font-bold`} onClick={() => applyStatus(selectedHidden, 'approved')}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restore {selectedHidden.length}
            </button>
          )}
          <button type="button" className="ml-auto text-xs font-bold text-slate-700 underline cursor-pointer" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}

      <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${loading && !firstLoad ? 'opacity-60' : ''}`} aria-busy={loading}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <caption className="sr-only">{isSubmissions ? 'Student submissions' : 'Reviewers'}</caption>
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={rows.length === 0} aria-label="Select all rows on this page" className="h-4 w-4 cursor-pointer accent-[#002147]" />
              </th>
              <th scope="col" className="px-3 py-2.5">Reviewer</th>
              <th scope="col" className="px-3 py-2.5">{isSubmissions ? 'Submitted by' : 'Author'}</th>
              <th scope="col" className="px-3 py-2.5">Engagement</th>
              <th scope="col" className="px-3 py-2.5">Uploaded</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
              <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {firstLoad &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={i}><td colSpan={7} className="px-3 py-3"><SkeletonBlock className="h-8" /></td></tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-600">
                  <p>{isSubmissions ? 'No student submissions match your filters.' : 'No reviewers match your filters.'}</p>
                  {filtersActive && (
                    <button type="button" onClick={clearFilters} className="mt-2 text-sm font-bold text-[#002147] underline cursor-pointer">Clear filters</button>
                  )}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const busy = busyIds.includes(row.id);
              return (
                <tr key={row.id} className={`${row.status === 'hidden' ? 'bg-rose-50/50' : ''} ${selected.has(row.id) ? 'bg-[#002147]/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.title}`} className="h-4 w-4 cursor-pointer accent-[#002147]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#002147]" aria-hidden="true" />
                      <div className="min-w-0">
                        <button type="button" onClick={() => setPreview(row)} className="block max-w-xs truncate text-left font-bold text-slate-900 underline-offset-2 hover:underline cursor-pointer" title="Preview">
                          {row.title}
                        </button>
                        <p className="text-xs text-slate-600">
                          {row.courseCode}{row.college ? ` · ${row.college}` : ''} · {formatFileSize(row.fileSize)}
                        </p>
                        {row.status === 'hidden' && row.moderationNote && (
                          <p className="mt-0.5 text-xs italic text-rose-700">Reason: {row.moderationNote}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="whitespace-nowrap font-semibold text-slate-800">
                      {row.author}
                      {row.userId === currentUserId && <span className="ml-1 text-xs font-black text-amber-700">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-600">{row.authorRole === 'teacher' ? 'Faculty' : row.authorId || 'Student'}</p>
                  </td>
                  <td className="px-3 py-2.5"><Engagement row={row} /></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {busy ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" aria-label="Working" />
                      ) : (
                        <>
                          {onOpenResource && (
                            <button type="button" className={iconBtn} title="QR code, ratings and comments" aria-label={`QR code, ratings and comments for ${row.title}`} onClick={() => onOpenResource(row.id)}><QrCode className="h-4 w-4" /></button>
                          )}
                          <button type="button" className={iconBtn} title="Preview" aria-label={`Preview ${row.title}`} onClick={() => setPreview(row)}><Eye className="h-4 w-4" /></button>
                          <button type="button" className={iconBtn} title="Download" aria-label={`Download ${row.title}`} onClick={() => download(row)}><Download className="h-4 w-4" /></button>
                          <button type="button" className={iconBtn} title="Edit details" aria-label={`Edit details of ${row.title}`} onClick={() => setEditing(row)}><Pencil className="h-4 w-4" /></button>
                          {row.status === 'hidden' ? (
                            <button type="button" className={iconBtn} title="Show in community" aria-label={`Show ${row.title} in community`} onClick={() => applyStatus([row], 'approved')}><RotateCcw className="h-4 w-4" /></button>
                          ) : (
                            <button type="button" className={iconBtn} title="Hide from community" aria-label={`Hide ${row.title} from community`} onClick={() => setHiding([row])}><EyeOff className="h-4 w-4" /></button>
                          )}
                          <button type="button" className={`${iconBtn} text-rose-600`} title="Delete" aria-label={`Delete ${row.title}`} onClick={() => setDeleting(row)}><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pager page={page} lastPage={meta.lastPage} total={meta.total} onPage={setPage} />

      {preview && <PdfPreview resource={preview} token={token} onClose={() => setPreview(null)} />}

      {editing && (
        <EditModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditing(null);
            notify('Reviewer details saved.');
          }}
        />
      )}

      {hiding && (
        <HideModal
          rows={hiding}
          busy={hiding.some((r) => busyIds.includes(r.id))}
          onClose={() => setHiding(null)}
          onConfirm={(note) => applyStatus(hiding, 'hidden', note)}
        />
      )}

      {deleting && (
        <Modal title="Delete reviewer?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-700">
            “{deleting.title}” and its file will be permanently removed, along with its ratings, comments and bookmarks. This can’t be undone.
          </p>
          <p className="mt-2 text-xs text-slate-600">Tip: use Hide instead if you may want to restore it later.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" data-autofocus onClick={() => setDeleting(null)} className={ghostBtn}>Cancel</button>
            <button type="button" disabled={busyIds.includes(deleting.id)} onClick={() => remove(deleting)} className={dangerBtn}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> {busyIds.includes(deleting.id) ? 'Deleting...' : 'Delete permanently'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditModal({ row, onClose, onSaved }) {
  const { request } = useDashboard();
  const [form, setForm] = useState({
    title: row.title,
    course_code: row.courseCode,
    college: row.college || '',
    description: row.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await request(`/teacher/resources/${row.id}`, { method: 'PATCH', body: form });
      onSaved(data.resource);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal title="Edit reviewer details" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title">
          <input data-autofocus className={`${inputClass} mt-1`} value={form.title} onChange={set('title')} maxLength={255} required />
        </Field>
        <Field label="Course code">
          <input className={`${inputClass} mt-1`} value={form.course_code} onChange={set('course_code')} maxLength={50} required />
        </Field>
        <Field label="College">
          <select className={`${inputClass} mt-1`} value={form.college} onChange={set('college')}>
            <option value="">— None —</option>
            {JRU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            {form.college && !JRU_DEPARTMENTS.includes(form.college) && <option value={form.college}>{form.college}</option>}
          </select>
        </Field>
        <Field label="Description">
          <textarea className={`${inputClass} mt-1`} rows={3} maxLength={5000} value={form.description} onChange={set('description')} />
        </Field>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryBtn}>{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function HideModal({ rows, busy, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const many = rows.length > 1;
  return (
    <Modal title={many ? `Hide ${rows.length} reviewers` : 'Hide from community'} onClose={onClose}>
      <p className="text-sm text-slate-700">
        {many ? `These ${rows.length} reviewers` : `“${rows[0].title}”`} will no longer appear in the Reviewer Community. You can restore {many ? 'them' : 'it'} any time.
      </p>
      <Field label="Reason (optional)" className="mt-3">
        <textarea data-autofocus className={`${inputClass} mt-1`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Contains unauthorized exam material" />
      </Field>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
        <button type="button" disabled={busy} onClick={() => onConfirm(note.trim() || undefined)} className={dangerBtn}>
          {busy ? 'Hiding...' : many ? `Hide ${rows.length} reviewers` : 'Hide reviewer'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Upload ---------- */

function validateFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`;
  if (file.size > MAX_UPLOAD_BYTES) return 'File is too large. The maximum size is 20 MB.';
  if (file.size === 0) return 'That file is empty.';
  return '';
}

function UploadPanel({ onUploaded, onGo }) {
  const { token, signOut } = useDashboard();
  const emptyForm = () => ({ title: '', course_code: '', college: JRU_DEPARTMENTS[0], description: '', file: null });
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);
  const fileInput = useRef(null);
  const uploadRef = useRef(null);

  // Leaving the tab mid-upload cancels it instead of leaving it running unseen.
  useEffect(() => () => uploadRef.current?.abort(), []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const acceptFile = (file) => {
    if (!file) return;
    const problem = validateFile(file);
    if (problem) {
      // Clear any earlier pick too, so a rejected file can never silently submit the old one.
      setForm((f) => ({ ...f, file: null }));
      if (fileInput.current) fileInput.current.value = '';
      setError(problem);
      return;
    }
    setError('');
    setPublished(false);
    setForm((f) => ({
      ...f,
      file,
      // Pre-fill the title from the file name when it is still empty.
      title: f.title || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(),
    }));
  };

  const removeFile = () => {
    setForm((f) => ({ ...f, file: null }));
    if (fileInput.current) fileInput.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPublished(false);

    if (!form.title.trim() || !form.course_code.trim()) return setError('Please fill in the title and course code.');
    if (!form.file) return setError('Please attach a file.');

    const body = new FormData();
    body.append('title', form.title.trim());
    body.append('course_code', form.course_code.trim().toUpperCase());
    body.append('college', form.college);
    if (form.description.trim()) body.append('description', form.description.trim());
    body.append('file', form.file);

    setUploading(true);
    setProgress(0);
    const upload = uploadWithProgress('/resources', token, body, setProgress);
    uploadRef.current = upload;

    try {
      await upload.promise;
      setForm(emptyForm());
      if (fileInput.current) fileInput.current.value = '';
      setPublished(true);
      onUploaded();
    } catch (err) {
      if (err.name === 'AbortError') setError('Upload cancelled.');
      else if (err.status === 401) signOut();
      else setError(err.message);
    } finally {
      uploadRef.current = null;
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-base font-black text-slate-900">Upload a learning resource</h3>
        <p className="text-sm text-slate-600">Published reviewers appear in the Reviewer Community right away.</p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-6 text-center focus-within:ring-2 focus-within:ring-[#002147]/30 ${
          dragging ? 'border-[#002147] bg-[#002147]/5' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <UploadCloud className="h-7 w-7 text-[#002147]" aria-hidden="true" />
        {form.file ? (
          <span className="text-sm font-bold text-slate-900">{form.file.name} <span className="font-normal text-slate-600">· {formatFileSize(form.file.size)}</span></span>
        ) : (
          <span className="text-sm font-bold text-slate-900">Drop a file here, or click to browse</span>
        )}
        <span className="text-xs text-slate-600">PDF, Word, PowerPoint, or image · max 20 MB</span>
        <input
          ref={fileInput}
          type="file"
          accept={ALLOWED_EXTENSIONS.map((x) => `.${x}`).join(',')}
          onChange={(e) => acceptFile(e.target.files?.[0])}
          className="sr-only"
          aria-label="Choose a file to upload"
        />
      </label>
      {form.file && !uploading && (
        <button type="button" onClick={removeFile} className="-mt-2 text-xs font-bold text-slate-700 underline cursor-pointer">Remove file</button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <input className={`${inputClass} mt-1`} value={form.title} onChange={set('title')} maxLength={255} placeholder="e.g. Data Structures Midterm Reviewer" />
        </Field>
        <Field label="Course code">
          <input className={`${inputClass} mt-1 uppercase`} value={form.course_code} onChange={set('course_code')} maxLength={50} placeholder="e.g. IT 201" />
        </Field>
        <Field label="College">
          <select className={`${inputClass} mt-1`} value={form.college} onChange={set('college')}>
            {JRU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Description (optional)" className="sm:col-span-2">
          <textarea className={`${inputClass} mt-1`} rows={3} maxLength={5000} value={form.description} onChange={set('description')} />
        </Field>
      </div>

      <ErrorBanner message={error} />
      {published && (
        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Published to the community.</span>
          <button type="button" onClick={() => onGo('manage')} className="underline cursor-pointer">View in Manage Reviewers</button>
        </p>
      )}

      {uploading && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Upload progress">
            <div className="h-full bg-[#002147] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-600">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={uploading} className={primaryBtn}>
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
          {uploading ? 'Uploading...' : 'Publish resource'}
        </button>
        {uploading && <button type="button" onClick={() => uploadRef.current?.abort()} className={ghostBtn}>Cancel</button>}
      </div>
    </form>
  );
}

/* ---------- Community monitoring ---------- */

function CommunityPanel({ overview }) {
  const { request } = useDashboard();
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const stats = overview.data?.stats;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), per_page: '10', role });
        if (search.trim()) params.set('search', search.trim());
        const data = await request(`/teacher/community?${params}`, { signal: controller.signal });
        setRows(data.data || []);
        setMeta({ lastPage: data.last_page ?? 1, total: data.total ?? 0 });
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, role, search, page, attempt]);

  const firstLoad = loading && rows.length === 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={stats?.students} />
        <StatCard icon={ShieldCheck} label="Faculty" value={stats?.teachers} />
        <StatCard icon={UserPlus} label="New members (7d)" value={stats?.newMembersThisWeek} tone="text-emerald-600" />
        <StatCard icon={EyeOff} label="Hidden reviewers" value={stats?.hiddenReviewers} tone="text-rose-600" />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-black text-slate-900">Community members</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 sm:top-2.5" aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, or ID" className={`${inputClass} pl-9`} aria-label="Search members" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className={`${inputClass} sm:w-40`} aria-label="Filter by role">
            <option value="all">Everyone</option>
            <option value="student">Students</option>
            <option value="teacher">Faculty</option>
          </select>
        </div>

        <ErrorBanner message={error} onRetry={() => setAttempt((n) => n + 1)} />

        <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${loading && !firstLoad ? 'opacity-60' : ''}`} aria-busy={loading}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Community members</caption>
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-3 py-2.5">Member</th>
                <th scope="col" className="px-3 py-2.5">ID</th>
                <th scope="col" className="px-3 py-2.5">College / Year</th>
                <th scope="col" className="px-3 py-2.5">Uploads</th>
                <th scope="col" className="px-3 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {firstLoad && Array.from({ length: 4 }, (_, i) => <tr key={i}><td colSpan={5} className="px-3 py-3"><SkeletonBlock className="h-8" /></td></tr>)}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-600">No members found.</td></tr>}
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-900">
                      {u.name}
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-black uppercase ${u.role === 'teacher' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role === 'teacher' ? 'Faculty' : 'Student'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">{u.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{u.schoolId || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-700">{[u.department, u.yearLevel].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{u.uploads}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{formatDate(u.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pager page={page} lastPage={meta.lastPage} total={meta.total} onPage={setPage} />
      </div>
    </div>
  );
}

/* ---------- Dashboard shell ---------- */

const readSavedTab = () => {
  try {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    return TABS.some((t) => t.id === saved) ? saved : 'overview';
  } catch {
    return 'overview';
  }
};

function DashboardShell({ teacher, onSignOut, onOpenResource }) {
  const [tab, setTab] = useState(readSavedTab);
  const [preset, setPreset] = useState(null); // filters handed over by a clickable stat card
  const [uploadVersion, setUploadVersion] = useState(0); // bumps when a new reviewer is published
  const [dataVersion, setDataVersion] = useState(0); // bumps whenever overview numbers may be stale
  const overview = useOverview(dataVersion);
  const tabRefs = useRef({});

  const goTo = useCallback((id, nextPreset = null) => {
    setPreset(nextPreset);
    setTab(id);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, id);
    } catch {
      /* storage unavailable: the tab just won't be remembered */
    }
  }, []);

  const onKeyDown = (e) => {
    const index = TABS.findIndex((t) => t.id === tab);
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    goTo(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const markStale = useCallback(() => setDataVersion((v) => v + 1), []);

  return (
    <div className="w-full space-y-4">
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#002147] to-[#092B54] p-5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black sm:text-2xl">{teacher?.name || 'Faculty'}</h1>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black uppercase text-[#002147]">Faculty Account</span>
          </div>
          <p className="mt-1 text-sm text-slate-200">
            {[teacher?.facultyId, teacher?.department].filter(Boolean).join(' · ') || 'Faculty dashboard'}
          </p>
        </div>
        <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white cursor-pointer sm:self-auto">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </section>

      <div role="tablist" aria-label="Teacher dashboard sections" onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            ref={(el) => { tabRefs.current[id] = el; }}
            id={`teacher-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls="teacher-tabpanel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => goTo(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-[#002147] ${
              tab === id ? 'bg-[#002147] text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div id="teacher-tabpanel" role="tabpanel" aria-labelledby={`teacher-tab-${tab}`} className="animate-fadeIn" key={`${tab}-${preset ? JSON.stringify(preset) : ''}`}>
        {tab === 'overview' && <OverviewPanel overview={overview} onGo={goTo} onOpenResource={onOpenResource} />}
        {tab === 'manage' && (
          <ResourceManager mode="manage" currentUserId={teacher?.id} refreshKey={uploadVersion} preset={preset} onMutated={markStale} onOpenResource={onOpenResource} />
        )}
        {tab === 'upload' && (
          <UploadPanel
            onGo={goTo}
            onUploaded={() => {
              setUploadVersion((k) => k + 1);
              markStale();
            }}
          />
        )}
        {tab === 'submissions' && (
          <ResourceManager mode="submissions" currentUserId={teacher?.id} refreshKey={uploadVersion} preset={preset} onMutated={markStale} onOpenResource={onOpenResource} />
        )}
        {tab === 'community' && <CommunityPanel overview={overview} />}
      </div>
    </div>
  );
}

export function TeacherDashboard({ teacher, onSignOut, onOpenResource }) {
  return (
    <DashboardProvider token={teacher?.token} onSignOut={onSignOut}>
      <DashboardShell teacher={teacher} onSignOut={onSignOut} onOpenResource={onOpenResource} />
    </DashboardProvider>
  );
}