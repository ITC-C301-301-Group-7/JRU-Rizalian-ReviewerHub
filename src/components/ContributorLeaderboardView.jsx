import React, { useState } from 'react';
import { 
  Trophy, Flame, ShieldCheck, ArrowLeft, LogOut, 
  Sparkles, CheckCircle2
} from 'lucide-react';

export function ContributorLeaderboardView({ student = {}, onBack, onSignOut }) {
  const [toastMessage, setToastMessage] = useState('');

  // Floating user rank card state (e.g. Jann, Loraine, or Princez)
  const currentUser = {
    id: student.id || 'JRU-2023-10492',
    name: student.name || 'Jann Dela Cruz',
    department: 'College of IT',
    points: 3450,
    rank: 1,
    uploads: 24,
    badge: 'Master IT Contributor',
    initials: 'JD'
  };

  // Top 10 Contributors featuring the 3 IT students
  const top10Contributors = [
    { rank: 1, name: 'Jann Dela Cruz', department: 'College of IT', points: 3450, uploads: 24, badge: 'Master IT Contributor', initials: 'JD' },
    { rank: 2, name: 'Loraine Joyce Fabular', department: 'College of IT', points: 2980, uploads: 20, badge: 'Database Lead Scholar', initials: 'LF' },
    { rank: 3, name: 'Princez Jhaymie Jebulan', department: 'College of IT', points: 2610, uploads: 18, badge: 'Web Architecture Lead', initials: 'PJ' },
    { rank: 4, name: 'Mark Tan', department: 'Engineering', points: 2150, uploads: 16, badge: 'Senior Reviewer', initials: 'MT' },
    { rank: 5, name: 'Patricia Gomez', department: 'Education', points: 1890, uploads: 14, badge: 'Content Specialist', initials: 'PG' },
    { rank: 6, name: 'Christian Bautista', department: 'Business Admin', points: 1620, uploads: 12, badge: 'Active Helper', initials: 'CB' },
    { rank: 7, name: 'Elena Torralba', department: 'Nursing', points: 1410, uploads: 10, badge: 'Peer Tutor', initials: 'ET' },
    { rank: 8, name: 'Dave Villanueva', department: 'College of IT', points: 1280, uploads: 9, badge: 'Code Mentor', initials: 'DV' },
    { rank: 9, name: 'Samantha Lim', department: 'Accountancy', points: 1100, uploads: 8, badge: 'Scholar Contributor', initials: 'SL' },
    { rank: 10, name: 'Gabriel Mendoza', department: 'Engineering', points: 950, uploads: 7, badge: 'Verified Contributor', initials: 'GM' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fadeIn p-4 relative pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#002147] text-white p-4 rounded-2xl border border-yellow-400/40 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Contributor Leaderboard</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300">
              Honoring Top BSIT Learning Resource Contributors
            </p>
          </div>
        </div>
        <button onClick={onSignOut} className="text-xs text-slate-300 hover:text-amber-400 flex items-center gap-1">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Podium showcasing Jann, Loraine, and Princez */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        {/* Rank 2 - Loraine */}
        <div className="bg-white rounded-2xl p-3 border-2 border-slate-200 text-center shadow-sm flex flex-col justify-between space-y-2 mt-4">
          <div className="space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border-2 border-slate-300 relative">
              {top10Contributors[1].initials}
              <span className="absolute -bottom-1 -right-1 bg-slate-400 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 truncate">{top10Contributors[1].name}</h4>
            <p className="text-[10px] text-slate-400 truncate">{top10Contributors[1].department}</p>
          </div>
          <div className="bg-slate-50 py-1.5 rounded-xl border">
            <p className="text-xs font-extrabold text-slate-800">{top10Contributors[1].points} pts</p>
            <p className="text-[9px] text-amber-600 font-bold">{top10Contributors[1].badge}</p>
          </div>
        </div>

        {/* Rank 1 - Jann */}
        <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-3 border-2 border-amber-400 text-center shadow-md flex flex-col justify-between space-y-2 relative -mt-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3 h-3 fill-blue-950" /> #1 Leader
          </div>
          <div className="space-y-1 pt-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-400 text-blue-950 font-extrabold flex items-center justify-center text-sm border-2 border-amber-500 shadow-sm relative">
              {top10Contributors[0].initials}
              <span className="absolute -bottom-1 -right-1 bg-amber-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">1</span>
            </div>
            <h4 className="text-xs font-extrabold text-slate-900 truncate">{top10Contributors[0].name}</h4>
            <p className="text-[10px] text-slate-500 truncate">{top10Contributors[0].department}</p>
          </div>
          <div className="bg-amber-100/70 py-1.5 rounded-xl border border-amber-200">
            <p className="text-xs font-black text-blue-950">{top10Contributors[0].points} pts</p>
            <p className="text-[9px] text-amber-800 font-extrabold">{top10Contributors[0].badge}</p>
          </div>
        </div>

        {/* Rank 3 - Princez */}
        <div className="bg-white rounded-2xl p-3 border-2 border-amber-800/20 text-center shadow-sm flex flex-col justify-between space-y-2 mt-6">
          <div className="space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs border-2 border-amber-700/40 relative">
              {top10Contributors[2].initials}
              <span className="absolute -bottom-1 -right-1 bg-amber-800 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">3</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 truncate">{top10Contributors[2].name}</h4>
            <p className="text-[10px] text-slate-400 truncate">{top10Contributors[2].department}</p>
          </div>
          <div className="bg-slate-50 py-1.5 rounded-xl border">
            <p className="text-xs font-extrabold text-slate-800">{top10Contributors[2].points} pts</p>
            <p className="text-[9px] text-amber-700 font-bold">{top10Contributors[2].badge}</p>
          </div>
        </div>
      </div>

      {/* TOP 10 LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {top10Contributors.map((user) => (
            <div key={user.rank} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-extrabold text-xs text-slate-500">#{user.rank}</span>
                <div className="w-8 h-8 rounded-xl bg-blue-950 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                  {user.initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                  <p className="text-[10px] text-slate-500">{user.department} • {user.uploads} Uploads</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-900">{user.points} pts</span>
                <p className="text-[10px] text-amber-700 font-bold">{user.badge}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Position Card */}
      <div className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 pb-4 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent z-40">
        <div className="bg-[#002147] text-white p-3.5 rounded-2xl border-2 border-amber-400 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 font-black flex items-center justify-center text-sm shadow-md">
              #{currentUser.rank}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{currentUser.name}</h4>
              <p className="text-[11px] text-amber-300 font-bold">{currentUser.badge}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-300 font-bold">My Contribution Points</p>
            <p className="text-base font-black text-amber-300">{currentUser.points} pts</p>
          </div>
        </div>
      </div>
    </div>
  );
}