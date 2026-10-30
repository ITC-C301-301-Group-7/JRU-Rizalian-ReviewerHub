import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Trophy, Award, Medal, Sparkles, Zap, TrendingUp,
  UploadCloud, UserCheck, Star, LoaderCircle,
} from 'lucide-react';
import { apiRequest } from '../utils/teacherApi';

const PERIODS = [
  { id: 'month', label: 'This Month' },
  { id: 'semester', label: 'This Semester' },
  { id: 'all', label: 'All-Time' },
];
const LIMIT = 20;

const badgeFor = (row) =>
  row.rank === 1 ? 'Top Contributor'
    : row.fiveStarRatings >= 5 ? 'Quality Scholar'
      : row.contributions >= 5 ? 'Active Contributor'
        : 'Rising Contributor';

const EMPTY = {
  items: [], loading: true, error: '', label: '', total: 0,
  me: { rank: null, points: 0, contributions: 0 },
  allTime: { points: 0, contributions: 0 },
  rules: { upload: 50, fiveStar: 10 },
};

function PodiumCard({ row, place }) {
  const styles = {
    1: {
      wrap: 'order-1 md:order-2 border-amber-400 bg-gradient-to-b from-amber-50 via-white to-amber-50/30 p-6 shadow-md md:-translate-y-2',
      num: 'h-16 w-16 bg-amber-400 text-2xl text-[#002147] border-white shadow-md',
      tag: '#1 Overall Contributor', tagColor: 'text-amber-700',
      pill: 'bg-amber-400/20 text-amber-900 border-amber-400/40', Icon: Sparkles, iconColor: 'text-amber-600',
      pts: 'text-xl',
    },
    2: {
      wrap: 'order-2 md:order-1 border-slate-200 bg-white p-5 shadow-sm',
      num: 'h-12 w-12 bg-slate-100 text-lg text-slate-700 border-slate-300 shadow-inner',
      tag: 'Runner Up', tagColor: 'text-slate-500',
      pill: 'bg-slate-100 text-slate-700 border-slate-200', Icon: Award, iconColor: 'text-slate-500',
      pts: 'text-base',
    },
    3: {
      wrap: 'order-3 border-slate-200 bg-white p-5 shadow-sm',
      num: 'h-12 w-12 bg-amber-100 text-lg text-amber-900 border-amber-300 shadow-inner',
      tag: '3rd Place', tagColor: 'text-slate-500',
      pill: 'bg-slate-100 text-slate-700 border-slate-200', Icon: Medal, iconColor: 'text-amber-600',
      pts: 'text-base',
    },
  }[place];

  if (!row) {
    const order = { 1: 'order-1 md:order-2', 2: 'order-2 md:order-1', 3: 'order-3' }[place];
    return <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-5 text-center text-[11px] text-slate-400 ${order}`}>
      <span className="text-lg font-black">{place}</span>Open spot
    </div>;
  }

  return (
    <div className={`relative flex flex-col items-center rounded-2xl border-2 text-center ${styles.wrap}`}>
      {place === 1 && (
        <div className="absolute -top-3 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-black uppercase text-blue-950 shadow-sm">
          <Trophy className="h-3 w-3" /> Campus Scholar Leader
        </div>
      )}
      <div className={`mb-2 flex items-center justify-center rounded-2xl border-2 font-black ${styles.num}`}>{place}</div>
      <span className={`text-[10px] font-black uppercase tracking-wider ${styles.tagColor}`}>{styles.tag}</span>
      <h4 className="mt-1 text-sm font-black text-slate-900">{row.name}</h4>
      <p className="text-[11px] text-slate-500">{row.program}</p>
      <span className={`mt-2 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${styles.pill}`}>
        <styles.Icon className={`h-3 w-3 ${styles.iconColor}`} />{row.badge}
      </span>
      <p className={`mt-3 font-black text-[#002147] ${styles.pts}`}>{row.points} <span className="text-xs font-semibold text-slate-500">Pts</span></p>
    </div>
  );
}

export function HonorRollView({ user, onBack, onUpload, refreshKey }) {
  const token = user?.token;
  const [period, setPeriod] = useState('month');
  const [state, setState] = useState(EMPTY);
  const requestRef = useRef(0); // a newer request replaces an older one

  const load = useCallback(async (signal) => {
    const requestId = ++requestRef.current;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await apiRequest(`/leaderboard?period=${period}&limit=${LIMIT}`, token, { signal });
      if (requestId !== requestRef.current) return;
      setState({
        items: (Array.isArray(data.data) ? data.data : []).map((row) => ({
          ...row,
          program: row.program || row.college || 'JRU Student',
          badge: badgeFor(row),
        })),
        loading: false,
        error: '',
        label: data.label || '',
        total: data.total ?? 0,
        me: data.me || EMPTY.me,
        allTime: data.allTime || EMPTY.allTime,
        rules: data.rules || EMPTY.rules,
      });
    } catch (err) {
      if (err.name === 'AbortError' || requestId !== requestRef.current) return;
      setState((prev) => ({ ...prev, items: [], loading: false, error: err.message || 'Unable to load the honor roll.' }));
    }
  }, [token, period]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const rows = state.loading ? [] : state.items;
  const { me, allTime, rules } = state;
  const myId = user?.id;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button type="button" onClick={onBack} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200">
          <ArrowLeft className="h-4 w-4" /><span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="font-varsity text-sm font-black uppercase tracking-wide text-slate-900 sm:text-base">Rizalian Academic Honor Roll &amp; Contributor Leaderboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] p-6 text-white shadow-md md:col-span-8">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="rounded-full border border-amber-400/30 bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">My Honor Standings</span>
              <h3 className="mt-2 text-xl font-black">{user?.name || 'Rizalian Student'}</h3>
              <p className="mt-0.5 text-xs text-slate-300">{user?.college || user?.department || user?.program || 'College Student'}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-[100px] rounded-xl border border-white/20 bg-white/10 p-3 text-center">
                <span className="block text-[10px] font-bold uppercase text-slate-300">My Ranking</span>
                <span className="flex items-center justify-center gap-1 text-xl font-black text-amber-400">
                  {me.rank ? `#${me.rank}` : '—'}
                  {me.rank && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                </span>
                <span className="mt-0.5 block text-[9px] text-slate-400">{state.label || 'Overall Campus'}</span>
              </div>
              <div className="min-w-[110px] rounded-xl border border-white/20 bg-white/10 p-3 text-center">
                <span className="block text-[10px] font-bold uppercase text-slate-300">My Points</span>
                <span className="flex items-center justify-center gap-1 text-xl font-black text-amber-300">
                  <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />{allTime.points}
                </span>
                <span className="mt-0.5 block text-[9px] text-slate-400">All-Time Pts</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs">
            <span className="text-[11px] text-slate-300">
              {me.rank ? `${me.points} pts and ${me.contributions} reviewer${me.contributions === 1 ? '' : 's'} in this period.` : 'No points yet in this period.'}
            </span>
            <span className="text-[11px] italic text-slate-300">Upload reviewers to earn <strong>+{rules.upload} pts</strong> each!</span>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600"><Sparkles className="h-4 w-4" /><span>Contributor Recognition</span></div>
            <h4 className="mt-1 text-sm font-black text-slate-900">How Points Work</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">Points come from your approved reviewers and the 5-star ratings other students give them.</p>
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-700">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 font-medium"><UploadCloud className="h-3.5 w-3.5 text-blue-600" /> Approved Reviewer</span><span className="font-bold text-emerald-600">+{rules.upload} Pts</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 font-medium"><Star className="h-3.5 w-3.5 text-amber-500" /> 5-Star Rating Received</span><span className="font-bold text-emerald-600">+{rules.fiveStar} Pts</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Honor roll period" className="inline-flex rounded-xl bg-slate-200/70 p-1">
          {PERIODS.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={period === id} onClick={() => setPeriod(id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${period === id ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-500">
          Showing: <strong className="text-slate-700">{state.label || '...'}</strong>
          {!state.loading && state.total > 0 && ` · ${state.total} ranked`}
        </span>
      </div>

      {state.loading && (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading honor roll...</p>
      )}
      {!state.loading && state.error && (
        <p role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <span>{state.error}</span>
          <button type="button" onClick={() => load()} className="cursor-pointer font-bold underline">Retry</button>
        </p>
      )}
      {!state.loading && !state.error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
          Nobody has earned points {period === 'all' ? 'yet' : 'in this period yet'}. Upload an approved reviewer to be the first on the honor roll.
          {onUpload && <div className="mt-3"><button type="button" onClick={onUpload} className="cursor-pointer rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-blue-950 hover:bg-amber-300">Upload a Reviewer</button></div>}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
            <PodiumCard row={rows[1]} place={2} />
            <PodiumCard row={rows[0]} place={1} />
            <PodiumCard row={rows[2]} place={3} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-sm font-black text-slate-900">University Top Contributors</h3>
              <p className="text-xs text-slate-500">Points are worked out from approved uploads and 5-star ratings received.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">College &amp; Program</th>
                    <th className="px-4 py-3 text-center">Badge</th>
                    <th className="px-4 py-3 text-center">Materials Shared</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rows.map((item) => (
                    <tr key={item.userId ?? item.rank} className={`transition-colors hover:bg-slate-50/80 ${item.userId === myId ? 'bg-amber-50/60' : ''}`}>
                      <td className="px-4 py-3 font-black">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${item.rank === 1 ? 'bg-amber-400 text-blue-950' : item.rank === 2 ? 'bg-slate-300 text-slate-900' : item.rank === 3 ? 'bg-amber-700 text-white' : 'text-slate-500'}`}>#{item.rank}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}{item.userId === myId && <span className="ml-2 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-950">You</span>}</td>
                      <td className="px-4 py-3"><span className="block font-semibold text-slate-800">{item.college || '—'}</span><span className="text-[10px] text-slate-500">{item.program}</span></td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700"><Award className="h-3 w-3 text-amber-500" />{item.badge}</span></td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{item.contributions} Reviewer{item.contributions === 1 ? '' : 's'}</td>
                      <td className="px-4 py-3 text-right font-black text-[#002147]">{item.points} Pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!state.loading && !state.error && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-t-2 border-amber-400 bg-blue-950 p-4 text-white shadow-sm sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-xs font-black text-blue-950">{me.rank ? `#${me.rank}` : '—'}</span>
            <div>
              <div className="flex items-center gap-2"><span className="text-xs font-bold">{user?.name || 'Rizalian Student'}</span><span className="rounded bg-amber-400 px-1.5 text-[9px] font-black uppercase text-blue-950">Your Position</span></div>
              <p className="text-[11px] text-slate-300">{me.rank ? state.label : 'Not ranked in this period yet'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>Shared: <strong>{me.contributions} Materials</strong></span>
            <span className="text-sm font-black text-amber-400">{me.points} Points</span>
            {onUpload && <button type="button" onClick={onUpload} className="cursor-pointer rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-blue-950 transition-colors hover:bg-amber-300">Upload Materials to Rank Up</button>}
          </div>
        </div>
      )}
    </div>
  );
}