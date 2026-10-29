import React, { useEffect, useState } from 'react';
import { Bookmark, LoaderCircle, MessageSquare, Star, Trophy } from 'lucide-react';
import { apiRequest } from '../utils/teacherApi';
import { ReviewerRow } from './StudyReviewersPanel';

// What each ranking means, and how its number is shown on a row.
const SORTS = [
  {
    id: 'rated',
    label: 'Top Rated',
    icon: Star,
    hint: 'Reviewers with the highest average star rating.',
    empty: 'No reviewer has been rated yet. Rate one in the community to start the list.',
    metric: (r) => `${r.ratingAverage} average from ${r.ratingCount} rating${r.ratingCount === 1 ? '' : 's'}`,
  },
  {
    id: 'reviewed',
    label: 'Most Reviewed',
    icon: MessageSquare,
    hint: 'Reviewers with the most ratings and comments combined.',
    empty: 'Nothing has been rated or commented on yet.',
    metric: (r) => `${r.ratingCount + r.commentCount} reviews (${r.ratingCount} rating${r.ratingCount === 1 ? '' : 's'}, ${r.commentCount} comment${r.commentCount === 1 ? '' : 's'})`,
  },
  {
    id: 'saved',
    label: 'Most Saved',
    icon: Bookmark,
    hint: 'Reviewers that students saved the most.',
    empty: 'Nobody has saved a reviewer yet.',
    metric: (r) => `Saved by ${r.bookmarkCount} student${r.bookmarkCount === 1 ? '' : 's'}`,
  },
];

export function TopReviewersPanel({ token, onOpenResource, refreshKey }) {
  const [sortId, setSortId] = useState('rated');
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const sort = SORTS.find((s) => s.id === sortId);

  useEffect(() => {
    const controller = new AbortController();
    setState({ items: [], loading: true, error: '' });

    apiRequest(`/resources/top?sort=${sortId}&limit=10`, token, { signal: controller.signal })
      .then((data) => setState({ items: Array.isArray(data.data) ? data.data : [], loading: false, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ items: [], loading: false, error: err.message });
      });

    return () => controller.abort();
  }, [token, sortId, refreshKey]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black"><Trophy size={16} className="text-amber-500" />Top Reviewers</h2>
        <p className="mt-1 text-xs text-slate-500">{sort.hint}</p>
      </div>

      <div role="tablist" aria-label="Ranking" className="flex flex-wrap gap-2">
        {SORTS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sortId === id}
            onClick={() => setSortId(id)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              sortId === id ? 'border-[#002147] bg-[#002147] text-amber-300' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {state.loading && <p className="flex items-center justify-center gap-2 p-6 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading...</p>}
      {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}
      {!state.loading && !state.error && state.items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">{sort.empty}</p>
      )}

      <div className="space-y-2">
        {state.items.map((item, index) => (
          <ReviewerRow key={item.id} item={item} token={token} onOpen={onOpenResource} rank={index + 1} metric={sort.metric(item)} compact />
        ))}
      </div>
    </section>
  );
}

export default TopReviewersPanel;