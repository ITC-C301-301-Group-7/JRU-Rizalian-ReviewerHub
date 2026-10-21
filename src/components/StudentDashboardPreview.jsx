import React, { useMemo, useState } from 'react';
import { SchedulePanel, useSchedule } from './SchedulePanel';
import { API_URL } from '../utils/Session';
import {
  BookOpen, GraduationCap, LogOut, Trophy, Download,
  Star, Search, CheckCircle, Building2, Sparkles, ShieldCheck, Lock,
  UserCheck, Check, X, AlertTriangle, Camera
} from 'lucide-react';

const resources = [
  { id: 1, title: 'Comprehensive Strategic Management Midterm Reviewer', course: 'MGT 301', author: 'J. Dela Cruz', rating: 4.9, downloads: 342 },
  { id: 2, title: 'Financial Accounting Practice Problems & Solutions', course: 'ACC 202', author: 'L. Fabular', rating: 4.8, downloads: 512 },
  { id: 3, title: 'Purposive Communication Finals Summary Guide', course: 'GE 105', author: 'P. Jebulan', rating: 4.7, downloads: 219 },
];

const policies = [
  { title: 'Account Security & Identity Verification', icon: Lock, rules: ['Only verified JRU students and faculty may log in.', 'Account sharing and impersonation are prohibited.'] },
  { title: 'Academic Integrity & Content Quality', icon: UserCheck, rules: ['Cite sources when needed.', 'Sharing unauthorized exam materials is prohibited.'] },
  { title: 'Prohibition of Unlawful & Harmful Content', icon: AlertTriangle, rules: ['Malware and malicious scripts are forbidden.', 'Unauthorized copyrighted textbooks are prohibited.'] },
  { title: 'Respectful Community Conduct', icon: CheckCircle, rules: ['Follow JRU civil conduct rules.', 'Harassment and hate speech may result in suspension.'] },
  { title: 'Data Privacy & Infrastructure Compliance', icon: ShieldCheck, rules: ['Do not bypass security or scrape records.', 'System activity may be logged for audits.'] },
];

const Button = ({ children, onClick, className = '', ...props }) => (
  <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2 text-xs font-bold ${className}`} {...props}>{children}</button>
);

export function StudentDashboardPreview({ student, onSignOut, onNavigate, onUserUpdated }) {
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const schedule = useSchedule(student?.token); // saved class schedule (add / edit / delete)
  const courses = schedule.courses;
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  const name = student?.name || 'Name not provided';
  const studentId = student?.studentNumber || student?.studentId || 'Not provided';
  const college = student?.college || student?.department || 'Not provided';
  const year = student?.yearLevel || 'Not provided';
  const role = student?.role || 'student';
  const photo = student?.profile_photo_url;
  const filteredResources = useMemo(() => resources.filter(r =>
    `${r.title} ${r.course} ${r.author}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  const goToReviewers = () => typeof onNavigate === 'function' ? onNavigate('ReviewerCommunityView') : setTab('reviewers');

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPhotoError(''); setPhotoSuccess('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setPhotoError('Choose a JPG, PNG, or WEBP image.');
    if (file.size > 2 * 1024 * 1024) return setPhotoError('The image must be 2 MB or smaller.');
    if (!student?.token) return setPhotoError('Please sign in again before changing your picture.');
  
  const body = new FormData();
    body.append('profile_photo', file);
    setUploading(true);

  try {
  const response = await fetch(`${API_URL}/api/profile/photo`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${student.token}`,},
    body,
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    console.error(text);
    throw new Error('Server error. Check Laravel logs.');
  }
  if (!response.ok) {
    throw new Error(data.message || 'Upload failed.');
  }
  if (data.user) onUserUpdated?.(data.user);
    setPhotoSuccess('Profile picture updated.');
    setPhotoError('');
    }  catch (error) {
        setPhotoError(error.message);
    } finally {
        setUploading(false);
    }
  };

  const downloadResource = (resource) => {
    const text = `Study Material: ${resource.title}\nCourse: ${resource.course}\nAuthor: ${resource.author}\nDownloaded via JRU Student Portal`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${resource.course}_Reviewer.txt`; link.click(); URL.revokeObjectURL(url);
  };

  const tabs = [['overview', 'Overview & Schedule'], ['courses', `My Courses (${courses.length})`], ['reviewers', 'Study Reviewers & Files'], ['policies', 'Rules & Policies (5)']];

  return <div className="w-full space-y-6 text-slate-800">
    <header className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] p-6 text-white shadow-md">
      <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <img src={photo ? (photo.startsWith('http') ? photo : `${API_URL}${photo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002147&color=ffffff`} alt="Profile" className="h-16 w-16 rounded-2xl border-2 border-white object-cover shadow-md" />
            <label title="Change profile picture" className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-[#002147] bg-amber-400 text-[#002147] shadow hover:bg-amber-300">
              <Camera size={14} /><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changePhoto} disabled={uploading} />
            </label>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black sm:text-2xl">{name}</h1><span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-[#002147]">{role === 'teacher' ? 'Faculty Account' : 'Student Account'}</span></div>
            <p className="mt-1 text-xs text-slate-300">ID: <strong>{studentId}</strong> · {year}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-300"><Building2 size={14} />{college}</p>
            <p className="mt-1 text-[10px] text-slate-300">{uploading ? 'Uploading picture…' : 'Click the camera to change your picture'}</p>
            {photoError && <p role="alert" className="mt-1 text-xs text-rose-200">{photoError}</p>}{photoSuccess && <p role="status" className="mt-1 text-xs text-emerald-200">{photoSuccess}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <Button onClick={goToReviewers} className="flex items-center gap-2 bg-amber-400 text-[#002147] hover:bg-amber-300"><BookOpen size={16}/>Reviewer Community</Button>
          <Button onClick={onSignOut} className="flex items-center gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20"><LogOut size={16}/>Sign Out</Button>
        </div>
      </div>
    </header>

    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        [GraduationCap, 'Cumulative GPA', student?.gpa || 'Not available', 'bg-blue-50 text-blue-900'],
        [BookOpen, 'Enrolled Courses', `${courses.length} Subjects`, 'bg-amber-50 text-amber-700'],
        [CheckCircle, 'Academic Status', 'Good Standing', 'bg-emerald-50 text-emerald-700'],
        [Trophy, 'Honor Points', '450 Pts', 'bg-purple-50 text-purple-700'],
      ].map(([Icon, label, value, color]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={20}/></div><div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="text-sm font-black text-slate-900">{value}</p></div></div>)}
    </section>

    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200">{tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-4 pb-3 text-xs font-bold ${tab === key ? 'border-[#002147] text-[#002147]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</nav>

    {tab === 'overview' && <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <SchedulePanel schedule={schedule} />
      <div className="space-y-4 lg:col-span-5"><div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-black"><Sparkles size={16} className="text-amber-500"/>Portal Quick Links</h2><Button onClick={goToReviewers} className="mr-2 bg-amber-100 text-[#002147]">Browse Reviewers</Button><Button onClick={() => onNavigate?.('leaderboard')} className="bg-slate-100 text-slate-800"><Trophy size={14} className="mr-1 inline"/>Honor Roll</Button></div><div className="space-y-2 rounded-2xl border border-amber-400/30 bg-[#002147] p-5 text-white"><p className="text-[10px] font-black uppercase text-amber-400">Official Announcement</p><h3 className="text-xs font-bold">Midterm Examination Schedule Released</h3><p className="text-[11px] text-slate-300">Check your course rooms or the LMS portal for exam room assignments.</p></div></div>
    </section>}

    {tab === 'courses' && <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2"><h2 className="text-sm font-black md:col-span-2">Enrolled Subjects & Grade Overviews</h2>{courses.length === 0 && <p className="text-xs text-slate-500 md:col-span-2">No classes yet. Add them under Overview &amp; Schedule.</p>}{courses.map(c => <article key={c.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex justify-between gap-2"><div><span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-black">{c.code}</span><h3 className="mt-1 text-sm font-bold">{c.name}</h3></div><strong>Grade {c.grade || '—'}</strong></div><p className="border-t pt-2 text-xs text-slate-600">Faculty: {c.instructor || '—'}<br/>Schedule: {c.schedule}<br/>Location: {c.room || '—'}</p></article>)}</section>}

    {tab === 'reviewers' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-sm font-black">Saved Study Materials & Shared Reviewers</h2><p className="mt-1 text-xs text-slate-500">Browse or download sample study materials.</p></div><div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search materials..." className="rounded-xl border bg-slate-50 py-2 pl-8 pr-8 text-xs"/>{query && <button onClick={() => setQuery('')} className="absolute right-2 top-2"><X size={14}/></button>}</div></div>{filteredResources.length ? filteredResources.map(r => <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4"><div><span className="rounded bg-[#002147] px-2 py-0.5 text-[10px] text-white">{r.course}</span><h3 className="mt-1 text-xs font-bold">{r.title}</h3><p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">By {r.author} · <Star size={12} className="text-amber-500"/>{r.rating} · {r.downloads} downloads</p></div><Button onClick={() => downloadResource(r)} className="flex shrink-0 items-center gap-1 bg-[#002147] text-amber-300"><Download size={14}/>Download</Button></div>) : <p className="p-6 text-center text-xs text-slate-500">No materials match “{query}”.</p>}</section>}

    {tab === 'policies' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-black"><ShieldCheck size={18} className="text-amber-500"/>Student Portal Rules & Acceptable Use Policy</h2><div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">{policies.map((policy, i) => { const Icon = policy.icon; return <article key={policy.title} className="space-y-2 rounded-xl border bg-slate-50 p-4"><h3 className="flex items-center gap-2 font-bold text-[#002147]"><Icon size={16} className="text-amber-600"/>{i + 1}. {policy.title}</h3><ul className="list-inside list-disc space-y-1 text-slate-600">{policy.rules.map(rule => <li key={rule}>{rule}</li>)}</ul></article>; })}</div><p className="border-t pt-3 text-[11px] text-slate-500">JRU IT Infrastructure System · Follow university policies and protect account information.</p></section>}
  </div>;
}