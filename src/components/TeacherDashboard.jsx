import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, FolderCog, UploadCloud, Inbox, Users, LogOut, Search, Eye, Download,
  Pencil, EyeOff, RotateCcw, Trash2, X, LoaderCircle, FileText, ChevronLeft, ChevronRight,
  BookOpen, ShieldCheck, TrendingUp, UserPlus, AlertTriangle, QrCode,
} from 'lucide-react';
import PdfPreview from './PdfPreview';
import { fetchBlob, saveBlob } from '../utils/Authedfile';
import { teacherRequest, formatFileSize, formatDate } from '../utils/teacherApi';
import { JRU_DEPARTMENTS } from '../types';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // matches the backend limit (20 MB)
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'manage', label: 'Manage Reviewers', icon: FolderCog },
  { id: 'upload', label: 'Upload Resource', icon: UploadCloud },
  { id: 'submissions', label: 'Student Submissions', icon: Inbox },
  { id: 'community', label: 'Community', icon: Users },
];

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/15';

/* ---------- small shared pieces ---------- */

function StatCard({ icon: Icon, label, value, tone = 'text-[#002147]' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <Icon className={`h-4 w-4 ${tone}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value ?? '—'}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const hidden = status === 'hidden';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
        hidden ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {hidden ? 'Hidden' : 'Visible'}
    </span>
  );
}

function Pager({ page, lastPage, total, onPage }) {
  if (!total) return null;
  return (
    <div className="flex items-center justify-between pt-3 text-xs text-slate-600">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-slate-300 bg-white p-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold">
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-slate-300 bg-white p-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl animate-slideUp">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

/* ---------- Overview ---------- */

function OverviewPanel({ token, onGo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    teacherRequest('/teacher/overview', token, { signal: controller.signal })
      .then(setData)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => controller.abort();
  }, [token]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <p className="p-6 text-xs text-slate-500">Loading overview...</p>;

  const { stats, activity, topContributors, recent } = data;
  const maxUploads = Math.max(1, ...activity.map((d) => d.uploads));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Total reviewers" value={stats.totalReviewers} />
        <StatCard icon={Inbox} label="Student submissions" value={stats.studentSubmissions} />
        <StatCard icon={EyeOff} label="Hidden" value={stats.hiddenReviewers} tone="text-rose-600" />
        <StatCard icon={TrendingUp} label="New this week" value={stats.newThisWeek} tone="text-emerald-600" />
        <StatCard icon={Users} label="Students" value={stats.students} />
        <StatCard icon={ShieldCheck} label="Faculty" value={stats.teachers} />
        <StatCard icon={UserPlus} label="New members (7d)" value={stats.newMembersThisWeek} tone="text-emerald-600" />
        <StatCard icon={UploadCloud} label="My uploads" value={stats.myUploads} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-black text-slate-900">Uploads — last 7 days</h3>
          <div className="mt-4 flex h-36 items-end gap-3">
            {activity.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600">{day.uploads}</span>
                <div
                  className="w-full rounded-t-md bg-[#002147]"
                  style={{ height: `${Math.max(4, (day.uploads / maxUploads) * 100)}px` }}
                />
                <span className="text-[10px] text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">Top contributors</h3>
          {topContributors.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No student uploads yet.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {topContributors.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    <span className="mr-2 font-black text-amber-600">{i + 1}</span>
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-700">{c.uploads}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Recent uploads</h3>
          <button type="button" onClick={() => onGo('submissions')} className="text-xs font-bold text-[#002147] underline cursor-pointer">
            Review submissions
          </button>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {recent.length === 0 && <li className="py-3 text-xs text-slate-500">Nothing uploaded yet.</li>}
          {recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-bold text-slate-900">{r.title}</span>
                <span className="text-slate-500"> · {r.courseCode} · {r.author}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="text-slate-500">{formatDate(r.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Manage Reviewers + Student Submissions (same table, different filters) ---------- */

function ResourceManager({ token, mode, currentUserId, refreshKey, onOpenResource }) {
  const isSubmissions = mode === 'submissions';
  const [author, setAuthor] = useState(isSubmissions ? 'student' : 'all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [hiding, setHiding] = useState(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (signal) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), per_page: '10', author, status });
        if (search.trim()) params.set('search', search.trim());
        const data = await teacherRequest(`/teacher/resources?${params}`, token, { signal });
        if (requestId !== requestRef.current) return;
        setRows(data.data || []);
        setMeta({ lastPage: data.last_page ?? 1, total: data.total ?? 0 });
      } catch (err) {
        if (err.name !== 'AbortError' && requestId === requestRef.current) setError(err.message);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [token, page, author, status, search]
  );

  // Debounce typing in the search box; reloads when filters, page, or refreshKey change.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, refreshKey]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const replaceRow = (updated) => setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const setVisibility = async (row, nextStatus, note) => {
    setBusyId(row.id);
    try {
      const data = await teacherRequest(`/teacher/resources/${row.id}/status`, token, {
        method: 'PATCH',
        body: { status: nextStatus, note },
      });
      replaceRow(data.resource);
      setHiding(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? The file will be permanently removed.`)) return;
    setBusyId(row.id);
    try {
      await teacherRequest(`/resources/${row.id}`, token, { method: 'DELETE' });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const download = async (row) => {
    setBusyId(row.id);
    try {
      saveBlob(await fetchBlob(row.downloadUrl, token), row.filename || 'reviewer');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const iconBtn = 'rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => changeFilter(setSearch)(e.target.value)}
            placeholder="Search title, course code, or author"
            className={`${inputClass} pl-9`}
            aria-label="Search reviewers"
          />
        </div>
        {!isSubmissions && (
          <select value={author} onChange={(e) => changeFilter(setAuthor)(e.target.value)} className={`${inputClass} sm:w-44`} aria-label="Filter by author">
            <option value="all">All reviewers</option>
            <option value="student">Student uploads</option>
            <option value="mine">My uploads</option>
          </select>
        )}
        <select value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)} className={`${inputClass} sm:w-36`} aria-label="Filter by visibility">
          <option value="all">Any status</option>
          <option value="approved">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <ErrorBanner message={error} />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Reviewer</th>
              <th className="px-3 py-2.5">{isSubmissions ? 'Submitted by' : 'Author'}</th>
              <th className="px-3 py-2.5">Uploaded</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  {isSubmissions ? 'No student submissions match your filters.' : 'No reviewers match your filters.'}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className={row.status === 'hidden' ? 'bg-rose-50/40' : ''}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#002147]" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{row.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {row.courseCode} · {row.filename} · {formatFileSize(row.fileSize)}
                        </p>
                        {row.status === 'hidden' && row.moderationNote && (
                          <p className="mt-0.5 text-[11px] italic text-rose-600">Reason: {row.moderationNote}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">
                      {row.author}
                      {row.userId === currentUserId && <span className="ml-1 text-[10px] font-black text-amber-600">(you)</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {row.authorRole === 'teacher' ? 'Faculty' : row.authorId || 'Student'}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {busyId === row.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />
                      ) : (
                        <>
                          {onOpenResource && (
                            <button type="button" className={iconBtn} title="QR code, ratings and comments" aria-label="QR code, ratings and comments" onClick={() => onOpenResource(row.id)}><QrCode className="h-3.5 w-3.5" /></button>
                          )}
                          <button type="button" className={iconBtn} title="Preview" aria-label="Preview" onClick={() => setPreview(row)}><Eye className="h-3.5 w-3.5" /></button>
                          <button type="button" className={iconBtn} title="Download" aria-label="Download" onClick={() => download(row)}><Download className="h-3.5 w-3.5" /></button>
                          <button type="button" className={iconBtn} title="Edit details" aria-label="Edit details" onClick={() => setEditing(row)}><Pencil className="h-3.5 w-3.5" /></button>
                          {row.status === 'hidden' ? (
                            <button type="button" className={iconBtn} title="Show in community" aria-label="Show in community" onClick={() => setVisibility(row, 'approved')}><RotateCcw className="h-3.5 w-3.5" /></button>
                          ) : (
                            <button type="button" className={iconBtn} title="Hide from community" aria-label="Hide from community" onClick={() => setHiding(row)}><EyeOff className="h-3.5 w-3.5" /></button>
                          )}
                          <button type="button" className={`${iconBtn} text-rose-600`} title="Delete" aria-label="Delete" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pager page={page} lastPage={meta.lastPage} total={meta.total} onPage={setPage} />

      {preview && <PdfPreview resource={preview} token={token} onClose={() => setPreview(null)} />}

      {editing && (
        <EditModal
          row={editing}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replaceRow(updated);
            setEditing(null);
          }}
        />
      )}

      {hiding && (
        <HideModal
          row={hiding}
          busy={busyId === hiding.id}
          onClose={() => setHiding(null)}
          onConfirm={(note) => setVisibility(hiding, 'hidden', note)}
        />
      )}
    </div>
  );
}

function EditModal({ row, token, onClose, onSaved }) {
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
      const data = await teacherRequest(`/teacher/resources/${row.id}`, token, { method: 'PATCH', body: form });
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
        <label className="block text-[11px] font-bold text-slate-700">Title
          <input className={`${inputClass} mt-1`} value={form.title} onChange={set('title')} required />
        </label>
        <label className="block text-[11px] font-bold text-slate-700">Course code
          <input className={`${inputClass} mt-1`} value={form.course_code} onChange={set('course_code')} required />
        </label>
        <label className="block text-[11px] font-bold text-slate-700">College
          <select className={`${inputClass} mt-1`} value={form.college} onChange={set('college')}>
            <option value="">— None —</option>
            {JRU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            {form.college && !JRU_DEPARTMENTS.includes(form.college) && <option value={form.college}>{form.college}</option>}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-slate-700">Description
          <textarea className={`${inputClass} mt-1`} rows={3} value={form.description} onChange={set('description')} />
        </label>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#002147] px-3 py-2 text-xs font-bold text-white disabled:opacity-60 cursor-pointer">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function HideModal({ row, busy, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  return (
    <Modal title="Hide from community" onClose={onClose}>
      <p className="text-xs text-slate-600">
        “{row.title}” will no longer appear in the Reviewer Community. You can restore it any time.
      </p>
      <label className="mt-3 block text-[11px] font-bold text-slate-700">Reason (optional)
        <textarea className={`${inputClass} mt-1`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Contains unauthorized exam material" />
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold cursor-pointer">Cancel</button>
        <button type="button" disabled={busy} onClick={() => onConfirm(note.trim() || undefined)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60 cursor-pointer">
          {busy ? 'Hiding...' : 'Hide reviewer'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Upload ---------- */

function UploadPanel({ token, onUploaded }) {
  const empty = { title: '', course_code: '', college: JRU_DEPARTMENTS[0], description: '', file: null };
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInput = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('File is too large. The maximum size is 20 MB.');
      e.target.value = '';
      return;
    }
    setForm((f) => ({ ...f, file }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.course_code.trim()) return setError('Please fill in the title and course code.');
    if (!form.file) return setError('Please attach a file.');

    const body = new FormData();
    body.append('title', form.title.trim());
    body.append('course_code', form.course_code.trim());
    body.append('college', form.college);
    if (form.description.trim()) body.append('description', form.description.trim());
    body.append('file', form.file);

    setUploading(true);
    try {
      await teacherRequest('/resources', token, { method: 'POST', body });
      setForm(empty);
      if (fileInput.current) fileInput.current.value = '';
      setSuccess('Learning resource published to the community.');
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-black text-slate-900">Upload a learning resource</h3>
        <p className="text-xs text-slate-500">Published reviewers appear in the Reviewer Community right away.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-bold text-slate-700 sm:col-span-2">Title
          <input className={`${inputClass} mt-1`} value={form.title} onChange={set('title')} maxLength={255} placeholder="e.g. Data Structures Midterm Reviewer" />
        </label>
        <label className="block text-[11px] font-bold text-slate-700">Course code
          <input className={`${inputClass} mt-1`} value={form.course_code} onChange={set('course_code')} maxLength={50} placeholder="e.g. IT 201" />
        </label>
        <label className="block text-[11px] font-bold text-slate-700">College
          <select className={`${inputClass} mt-1`} value={form.college} onChange={set('college')}>
            {JRU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-slate-700 sm:col-span-2">Description (optional)
          <textarea className={`${inputClass} mt-1`} rows={3} maxLength={5000} value={form.description} onChange={set('description')} />
        </label>
        <label className="block text-[11px] font-bold text-slate-700 sm:col-span-2">File (PDF, Word, PowerPoint, or image — max 20 MB)
          <input ref={fileInput} type="file" accept={ALLOWED_EXTENSIONS.map((x) => `.${x}`).join(',')} onChange={pickFile} className={`${inputClass} mt-1`} />
        </label>
      </div>

      <ErrorBanner message={error} />
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{success}</p>}

      <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-[#002147] px-4 py-2 text-xs font-bold text-white disabled:opacity-60 cursor-pointer">
        {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? 'Uploading...' : 'Publish resource'}
      </button>
    </form>
  );
}

/* ---------- Community monitoring ---------- */

function CommunityPanel({ token }) {
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), per_page: '10', role });
        if (search.trim()) params.set('search', search.trim());
        const data = await teacherRequest(`/teacher/community?${params}`, token, { signal: controller.signal });
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
  }, [token, role, search, page]);

  return (
    <div className="space-y-5">
      <OverviewPanelStats token={token} />

      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900">Community members</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, or ID" className={`${inputClass} pl-9`} aria-label="Search members" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className={`${inputClass} sm:w-40`} aria-label="Filter by role">
            <option value="all">Everyone</option>
            <option value="student">Students</option>
            <option value="teacher">Faculty</option>
          </select>
        </div>

        <ErrorBanner message={error} />

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Member</th>
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">College / Year</th>
                <th className="px-3 py-2.5">Uploads</th>
                <th className="px-3 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Loading...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">No members found.</td></tr>}
              {!loading && rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-900">
                      {u.name}
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${u.role === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'teacher' ? 'Faculty' : 'Student'}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{u.schoolId || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-700">{[u.department, u.yearLevel].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{u.uploads}</td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDate(u.joinedAt)}</td>
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

// Compact stats strip reused at the top of the community tab.
function OverviewPanelStats({ token }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    teacherRequest('/teacher/overview', token, { signal: controller.signal })
      .then((d) => setStats(d.stats))
      .catch(() => {});
    return () => controller.abort();
  }, [token]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={Users} label="Students" value={stats?.students} />
      <StatCard icon={ShieldCheck} label="Faculty" value={stats?.teachers} />
      <StatCard icon={UserPlus} label="New members (7d)" value={stats?.newMembersThisWeek} tone="text-emerald-600" />
      <StatCard icon={EyeOff} label="Hidden reviewers" value={stats?.hiddenReviewers} tone="text-rose-600" />
    </div>
  );
}

/* ---------- Dashboard shell ---------- */

export function TeacherDashboard({ teacher, onSignOut, onOpenResource }) {
  const [tab, setTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const token = teacher?.token;

  return (
    <div className="w-full space-y-4">
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#002147] to-[#092B54] p-5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black sm:text-2xl">{teacher?.name || 'Faculty'}</h1>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-[#002147]">Faculty Account</span>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            {[teacher?.facultyId, teacher?.department].filter(Boolean).join(' · ') || 'Faculty dashboard'}
          </p>
        </div>
        <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20 cursor-pointer sm:self-auto">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Teacher dashboard sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${
              tab === id ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="animate-fadeIn" key={tab}>
        {tab === 'overview' && <OverviewPanel token={token} onGo={setTab} />}
        {tab === 'manage' && <ResourceManager token={token} mode="manage" currentUserId={teacher?.id} refreshKey={refreshKey} onOpenResource={onOpenResource} />}
        {tab === 'upload' && (
          <UploadPanel
            token={token}
            onUploaded={() => setRefreshKey((k) => k + 1)}
          />
        )}
        {tab === 'submissions' && <ResourceManager token={token} mode="submissions" currentUserId={teacher?.id} refreshKey={refreshKey} onOpenResource={onOpenResource} />}
        {tab === 'community' && <CommunityPanel token={token} />}
      </div>
    </div>
  );
}

export default TeacherDashboard;