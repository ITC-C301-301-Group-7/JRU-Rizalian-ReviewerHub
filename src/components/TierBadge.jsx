import React from 'react';
import { Award } from 'lucide-react';
import { tierLabel, tierNumber } from '../utils/tier';

// Full class names (not built from strings) so Tailwind can see them.
const STYLES = {
  low: 'border-slate-200 bg-slate-100 text-slate-700',
  mid: 'border-sky-200 bg-sky-50 text-sky-800',
  high: 'border-purple-200 bg-purple-50 text-purple-800',
  top: 'border-amber-300 bg-amber-100 text-amber-900',
  faculty: 'border-[#002147] bg-[#002147] text-amber-300',
};

const styleFor = (key) => {
  if (key === 'faculty') return STYLES.faculty;
  const number = tierNumber(key) ?? 0;
  if (number >= 10) return STYLES.top;
  if (number >= 7) return STYLES.high;
  if (number >= 4) return STYLES.mid;
  return STYLES.low;
};

export default function TierBadge({ tier, size = 'md', className = '' }) {
  if (!tier) return null;

  const small = size === 'sm';

  return (
    <span
      title={tierLabel(tier)}
      className={`inline-flex items-center gap-1 rounded-full border font-extrabold ${small ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} ${styleFor(tier)} ${className}`}
    >
      <Award className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {tierLabel(tier)}
    </span>
  );
}