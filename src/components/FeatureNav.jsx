import React from 'react';
import { LayoutDashboard, BookOpen, Bookmark, Languages, QrCode } from 'lucide-react';

// Shortcuts to the learning features, shown for both students and faculty.
export function FeatureNav({ view, onChange, onScan }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'community', label: 'Reviewer Community', icon: BookOpen },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark },
    { id: 'translate', label: 'Translate Document', icon: Languages },
  ];

  const base = 'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer';

  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Learning features">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={view === id ? 'page' : undefined}
          className={`${base} ${view === id ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
      <button type="button" onClick={onScan} className={`${base} ml-auto bg-amber-400 text-[#002147] hover:bg-amber-300`}>
        <QrCode className="h-4 w-4" />
        Scan QR
      </button>
    </nav>
  );
}

export default FeatureNav;