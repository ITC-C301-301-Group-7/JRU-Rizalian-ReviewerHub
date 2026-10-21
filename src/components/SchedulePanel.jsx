import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Pencil, Trash2, LoaderCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../utils/teacherApi';

const SAMPLE_CLASSES = [
  { code: 'MGT 301', name: 'Strategic Management', instructor: 'Prof. A. Santos', schedule: 'Mon/Wed 10:00 AM - 11:30 AM', room: 'Building A - Room 302', grade: '1.25' },
  { code: 'ACC 202', name: 'Financial Accounting & Reporting', instructor: 'Dr. M. Reyes', schedule: 'Tue/Thu 1:00 PM - 2:30 PM', room: 'Building B - Room 104', grade: '1.50' },
  { code: 'GE 105', name: 'Purposive Communication', instructor: 'Prof. L. Garcia', schedule: 'Fri 8:00 AM - 11:00 AM', room: 'Online / LMS', grade: '1.00' },
  { code: 'IT 101', name: 'Introduction to Computing', instructor: 'Engr. J. Cruz', schedule: 'Tue/Thu 9:00 AM - 10:30 AM', room: 'IT Lab 3', grade: '1.25' },
];

const EMPTY_FORM = { code: '', name: '', instructor: '', schedule: '', room: '', grade: '' };

// Loads and changes the signed-in user's saved class schedule (GET/POST/PUT/DELETE /api/schedule).
export function useSchedule(token) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    apiRequest('/schedule', token, { signal: controller.signal })
      .then((data) => setCourses(data.entries || []))
      .catch((err) => err.name !== 'AbortError' && setError(err.message))
      .finally(() => !controller.signal.aborted && setLoading(false));

    return () => controller.abort();
  }, [token]);

  const add = useCallback(
    async (fields) => {
      const data = await apiRequest('/schedule', token, { method: 'POST', body: fields });
      setCourses((list) => [...list, data.entry]);
    },
    [token]
  );

  const update = useCallback(
    async (id, fields) => {
      const data = await apiRequest(`/schedule/${id}`, token, { method: 'PUT', body: fields });
      setCourses((list) => list.map((c) => (c.id === id ? data.entry : c)));
    },
    [token]
  );

  const remove = useCallback(
    async (id) => {
      await apiRequest(`/schedule/${id}`, token, { method: 'DELETE' });
      setCourses((list) => list.filter((c) => c.id !== id));
    },
    [token]
  );

  const addSamples = useCallback(async () => {
    const created = [];
    for (const sample of SAMPLE_CLASSES) {
      const data = await apiRequest('/schedule', token, { method: 'POST', body: sample });
      created.push(data.entry);
    }
    setCourses((list) => [...list, ...created]);
  }, [token]);

  return { courses, loading, error, add, update, remove, addSamples };
}

const FIELDS = [
  { key: 'code', label: 'Course code', placeholder: 'e.g. IT 101', required: true, max: 20 },
  { key: 'name', label: 'Subject name', placeholder: 'e.g. Introduction to Computing', required: true, max: 255 },
  { key: 'schedule', label: 'Schedule', placeholder: 'e.g. Tue/Thu 9:00 AM - 10:30 AM', required: true, max: 255 },
  { key: 'room', label: 'Room', placeholder: 'e.g. IT Lab 3', max: 255 },
  { key: 'instructor', label: 'Instructor', placeholder: 'e.g. Engr. J. Cruz', max: 255 },
  { key: 'grade', label: 'Grade (optional)', placeholder: 'e.g. 1.25', max: 10 },
];

function ClassForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        code: form.code.trim(),
        name: form.name.trim(),
        schedule: form.schedule.trim(),
        room: form.room.trim(),
        instructor: form.instructor.trim(),
        grade: form.grade.trim(),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-blue-950/20 bg-white p-3.5">
      <div className="grid gap-2 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-xs font-bold text-slate-700">
            {f.label}
            <input
              required={f.required}
              maxLength={f.max}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-normal outline-none focus:border-blue-950"
            />
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-[#002147] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

// "Current Class Schedule": add, edit and delete classes.
export function SchedulePanel({ schedule }) {
  const { courses, loading, error, add, update, remove, addSamples } = schedule;
  const [editingId, setEditingId] = useState(null); // a class id, 'new', or null
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleDelete = async (course) => {
    if (!window.confirm(`Remove ${course.code} - ${course.name} from your schedule?`)) return;
    setActionError('');
    setBusyId(course.id);
    try {
      await remove(course.id);
      if (editingId === course.id) setEditingId(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSamples = async () => {
    setActionError('');
    setBusyId('samples');
    try {
      await addSamples();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Calendar size={16} className="text-amber-600" /> Current Class Schedule
        </h2>
        <button
          type="button"
          onClick={() => setEditingId('new')}
          disabled={editingId === 'new'}
          className="flex items-center gap-1 rounded-lg bg-[#002147] px-3 py-2 text-xs font-bold text-amber-300 disabled:opacity-50"
        >
          <Plus size={14} /> Add class
        </button>
      </div>

      {(error || actionError) && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle size={14} className="shrink-0" /> {error || actionError}
        </p>
      )}

      {editingId === 'new' && (
        <ClassForm
          submitLabel="Add class"
          onSubmit={async (fields) => {
            await add(fields);
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {loading && (
        <p className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <LoaderCircle size={14} className="animate-spin" /> Loading your schedule...
        </p>
      )}

      {!loading && !error && courses.length === 0 && editingId !== 'new' && (
        <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-xs text-slate-500">No classes yet. Add your first class to build your schedule.</p>
          <button
            type="button"
            onClick={handleSamples}
            disabled={busyId === 'samples'}
            className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-[#002147] disabled:opacity-60"
          >
            {busyId === 'samples' ? 'Adding...' : 'Or load a sample schedule'}
          </button>
        </div>
      )}

      {courses.map((course) => (
        <div key={course.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          {editingId === course.id ? (
            <ClassForm
              initial={course}
              submitLabel="Save changes"
              onSubmit={async (fields) => {
                await update(course.id, fields);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900">{course.code}</span>
                <h3 className="mt-1 text-xs font-bold">{course.name}</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  <Clock size={12} className="mr-1 inline" />
                  {course.schedule}
                </p>
                {course.room && <p className="mt-1 text-[11px] text-slate-500">Room: {course.room}</p>}
                {course.instructor && <p className="mt-1 text-[11px] font-semibold text-slate-600">{course.instructor}</p>}
              </div>

              <div className="flex shrink-0 gap-1.5">
                {busyId === course.id ? (
                  <LoaderCircle size={16} className="animate-spin text-slate-500" />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingId(course.id)}
                      title="Edit class"
                      aria-label={`Edit ${course.code}`}
                      className="flex items-center gap-1 rounded-lg bg-[#002147] px-3 py-2 text-xs font-bold text-amber-300"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(course)}
                      title="Delete class"
                      aria-label={`Delete ${course.code}`}
                      className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SchedulePanel;