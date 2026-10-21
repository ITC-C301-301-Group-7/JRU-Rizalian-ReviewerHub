import React, { useEffect, useState } from 'react';
import { JruLogo } from './components/JruLogo';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { StudentDashboardPreview } from './components/StudentDashboardPreview';
import { ReviewerCommunityView } from './components/ReviewerCommunityView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { FeatureNav } from './components/FeatureNav';
import { BookmarksView } from './components/BookmarksView';
import { DocumentTranslator } from './components/DocumentTranslator';
import ResourceDetailModal from './components/ResourceDetailModal';
import QrScannerModal from './components/QrScannerModal';
import { captureIncomingResource, takePendingResource } from './utils/resourceLinks';
import { CampusFooter } from './components/CampusFooter';
import {
  clearToken,
  fetchCurrentUser,
  loadToken,
  logoutRequest,
  saveToken,
} from './utils/Session';
import { 
  Shield, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft, 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  TrendingUp, 
  UploadCloud, 
  UserCheck, 
  Zap,
  CheckCircle,
  Search
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'community' | 'leaderboard' | 'bookmarks' | 'translate'
  // Learning features shared by students and faculty
  const [openResourceId, setOpenResourceId] = useState(null); // resource detail modal (QR links, saved list, feed)
  const [scannerOpen, setScannerOpen] = useState(false);
  const [translateResource, setTranslateResource] = useState(null); // resource sent to the translator
  const [resourceVersion, setResourceVersion] = useState(0); // bumps when a rating / bookmark / comment changes
  // True while we check a saved token against the server on first load.
  const [restoringSession, setRestoringSession] = useState(() =>
    Boolean(loadToken())
  );

  // Restore the signed-in user after a page refresh.
  useEffect(() => {
    const token = loadToken();
    if (!token) return undefined;

    const controller = new AbortController();

    fetchCurrentUser(token, controller.signal)
      .then((user) => setAuthenticatedUser(user))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // Token is invalid or expired: forget it. Keep it on network errors.
        if (err.status === 401) clearToken();
      })
      .finally(() => {
        if (!controller.signal.aborted) setRestoringSession(false);
      });

    return () => controller.abort();
  }, []);

  // A shared QR link (?resource=12) is remembered on load and opened once the user is signed in.
  useEffect(() => {
    captureIncomingResource();
  }, []);

  useEffect(() => {
    if (!authenticatedUser) return;
    const pending = takePendingResource();
    if (pending) setOpenResourceId(pending);
  }, [authenticatedUser]);

  const handleAuthSuccess = (user, remember = true) => {
    saveToken(user.token, remember);
    setAuthenticatedUser(user);
    setCurrentView('dashboard');
  };

  const handleSignOut = () => {
    // Revoke the token on the server, then forget it locally.
    logoutRequest(authenticatedUser?.token);
    clearToken();
    setAuthenticatedUser(null);
    setActiveTab('login');
    setCurrentView('dashboard');
    setOpenResourceId(null);
    setScannerOpen(false);
    setTranslateResource(null);
  };

  // Merge fields returned by the API (e.g. a new profile_photo_url) into the signed-in user.
  const handleUserUpdated = (updatedUser) => {
    setAuthenticatedUser((previous) => (previous ? { ...previous, ...updatedUser } : previous));
  };

  const handleNavigate = (destination) => {
    if (destination === 'ReviewerCommunityView' || destination === 'community') {
      setCurrentView('community');
    } else if (destination === 'leaderboard') {
      setCurrentView('leaderboard');
    } else if (destination === 'bookmarks' || destination === 'translate') {
      setCurrentView(destination);
    } else {
      setCurrentView('dashboard');
    }
  };

  // Sample leaderboard data across university colleges
  const leaderboardData = [
    { rank: 1, name: 'Maria Santos', college: 'College of Business Administration', program: 'BSBA - Financial Management', points: 1420, contributions: 28, badge: 'Top Contributor', avatarColor: 'bg-amber-400 text-[#002147]' },
    { rank: 2, name: 'Jann Dela Cruz', college: 'College of Computer Studies', program: 'BS Information Technology', points: 1250, contributions: 22, badge: 'Quizmaster', avatarColor: 'bg-slate-300 text-[#002147]' },
    { rank: 3, name: 'Rhea Alonzo', college: 'College of Nursing & Health Sciences', program: 'BS Nursing', points: 1180, contributions: 19, badge: 'Verified Scholar', avatarColor: 'bg-amber-700 text-white' },
    { rank: 4, name: 'Mark Anthony Reyes', college: 'College of Engineering & Tech', program: 'BS Computer Engineering', points: 980, contributions: 16, badge: 'Peer Tutor', avatarColor: 'bg-blue-100 text-blue-900' },
    { rank: 5, name: 'Camille Villar', college: 'College of Liberal Arts & Education', program: 'BA Communication', points: 890, contributions: 14, badge: 'Resource Hero', avatarColor: 'bg-[#002147] text-white' },
    { rank: 6, name: 'Paul Jebulan', college: 'College of Business Administration', program: 'BS Accountancy', points: 840, contributions: 12, badge: 'Active Contributor', avatarColor: 'bg-[#002147] text-white' },
    { rank: 7, name: 'Sofia Nicole Garcia', college: 'College of Computer Studies', program: 'BS Computer Science', points: 790, contributions: 11, badge: 'Active Contributor', avatarColor: 'bg-[#002147] text-white' },
    { rank: 8, name: 'Gabriel Mendoza', college: 'College of Hospitality Management', program: 'BS Hospitality Management', points: 720, contributions: 9, badge: 'Active Contributor', avatarColor: 'bg-[#002147] text-white' },
    { rank: 9, name: 'Angela Bautista', college: 'College of Nursing & Health Sciences', program: 'BS Nursing', points: 680, contributions: 8, badge: 'Active Contributor', avatarColor: 'bg-[#002147] text-white' },
    { rank: 10, name: 'Kevin Joshua Tan', college: 'College of Engineering & Tech', program: 'BS Industrial Engineering', points: 640, contributions: 7, badge: 'Active Contributor', avatarColor: 'bg-[#002147] text-white' }
  ];

  // User's active position mock data
  const userStats = {
    rank: 14,
    points: 450,
    contributions: 5,
    badgesEarned: ['Verified Student', 'First Upload']
  };

  const isTeacher = authenticatedUser?.role === 'teacher';

  const openTranslator = (resource) => {
    setOpenResourceId(null);
    setTranslateResource(resource);
    setCurrentView('translate');
  };

  if (restoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06152B] text-sm text-slate-200">
        Restoring your session...
      </div>
    );
  }

  return (
    <div
      id="jru-portal-app"
      className={`min-h-screen flex flex-col justify-between relative overflow-x-hidden selection:bg-yellow-400 selection:text-blue-950 transition-colors duration-200 ${
        authenticatedUser
          ? 'bg-slate-100 text-slate-900'
          : 'bg-gradient-to-b from-[#06152B] via-[#0A2244] to-[#040E1E] text-slate-100'
      }`}
    >
      {/* Background Blurs (Only for Unauthenticated Mode) */}
      {!authenticatedUser && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-yellow-400/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Global Header */}
      <header
        id="jru-portal-header"
        className="w-full bg-[#002147] text-white border-b border-amber-400/40 shadow-md relative z-20"
      >
        <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => authenticatedUser && setCurrentView('dashboard')}
          >
            <JruLogo size="sm" className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide font-varsity uppercase text-white">
                  Jose Rizal University
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 bg-amber-400 px-2 py-0.5 rounded-full shadow-sm">
                  {isTeacher ? 'Faculty Portal' : currentView === 'community' ? 'Reviewer Hub' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] hidden sm:block text-slate-300">
                Official Student Academic Services &amp; Learning Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/10 text-amber-300 border border-amber-400/30">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              All University Colleges &amp; Divisions
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-slate-200 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Students &amp; Faculty
            </span>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main
        id="jru-main-container"
        className="w-full max-w-5xl lg:max-w-6xl mx-auto my-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 flex-1 flex flex-col justify-center"
      >
        {authenticatedUser ? (
          <>
            <FeatureNav view={currentView} onChange={handleNavigate} onScan={() => setScannerOpen(true)} />

            {/* Faculty home */}
            {currentView === 'dashboard' && isTeacher && (
              <TeacherDashboard teacher={authenticatedUser} onSignOut={handleSignOut} onOpenResource={setOpenResourceId} />
            )}

            {/* Saved reviewers */}
            {currentView === 'bookmarks' && (
              <BookmarksView
                token={authenticatedUser.token}
                onOpenResource={setOpenResourceId}
                refreshKey={resourceVersion}
              />
            )}

            {/* OCR + translation */}
            {currentView === 'translate' && (
              <DocumentTranslator
                token={authenticatedUser.token}
                initialResource={translateResource}
                onInitialResourceUsed={() => setTranslateResource(null)}
              />
            )}

            {/* VIEW 1: Main Student Dashboard View */}
            {currentView === 'dashboard' && !isTeacher && (
              <StudentDashboardPreview
                student={authenticatedUser}
                onSignOut={handleSignOut}
                onBack={handleSignOut}
                onNavigate={handleNavigate}
                onUserUpdated={handleUserUpdated}
              />
            )}

            {/* VIEW 2: Reviewer Community Component View */}
            {currentView === 'community' && (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Rizalian Learning Community Hub
                  </span>
                </div>

                <ReviewerCommunityView
                  currentUser={authenticatedUser}
                  onBackToDashboard={() => setCurrentView('dashboard')}
                  onOpenResource={setOpenResourceId}
                  onTranslateResource={openTranslator}
                  refreshKey={resourceVersion}
                />
              </div>
            )}

            {/* VIEW 3: General Academic Honors & Styled Leaderboard View */}
            {currentView === 'leaderboard' && (
              <div className="w-full max-w-5xl mx-auto space-y-6">
                
                {/* Header Navigation */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="text-sm sm:text-base font-black text-slate-900 font-varsity tracking-wide uppercase">
                      Rizalian Academic Honor Roll &amp; Contributor Leaderboard
                    </h2>
                  </div>
                </div>

                {/* USER PERSONAL PERFORMANCE BANNER */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* My Ranking & My Contribution Points Banner */}
                  <div className="md:col-span-8 bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] text-white p-6 rounded-2xl border border-amber-400/40 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                          My Honor Standings
                        </span>
                        <h3 className="text-xl font-black mt-2">{authenticatedUser?.name || 'Rizalian Student'}</h3>
                        <p className="text-xs text-slate-300 mt-0.5">{authenticatedUser?.program || 'College Student'}</p>
                      </div>

                      {/* Stat Metrics */}
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-center min-w-[100px]">
                          <span className="text-[10px] uppercase font-bold text-slate-300 block">My Ranking</span>
                          <span className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                            #{userStats.rank}
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Overall Campus</span>
                        </div>

                        <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-center min-w-[110px]">
                          <span className="text-[10px] uppercase font-bold text-slate-300 block">My Points</span>
                          <span className="text-xl font-black text-amber-300 flex items-center justify-center gap-1">
                            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                            {userStats.points}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Contribution Pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Badges Bar */}
                    <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-medium">Earned Recognition:</span>
                        {userStats.badgesEarned.map((badge) => (
                          <span key={badge} className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-400" />
                            {badge}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-300 italic">
                        Upload reviewers to earn <strong>+50 pts</strong> each!
                      </span>
                    </div>
                  </div>

                  {/* Contributor Recognition Card */}
                  <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Contributor Recognition</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">How Points Work</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Points are awarded when you share verified study guides, answer peer questions, and publish course reviewers.
                      </p>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium"><UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Share Reviewer</span>
                        <span className="font-bold text-emerald-600">+50 Pts</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium"><UserCheck className="w-3.5 h-3.5 text-amber-600" /> Answer Peer Inquiry</span>
                        <span className="font-bold text-emerald-600">+20 Pts</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium"><Star className="w-3.5 h-3.5 text-amber-500" /> 5-Star Material Rating</span>
                        <span className="font-bold text-emerald-600">+10 Pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOP 3 PODIUM RECOGNITION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* #2 Rank */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative order-2 md:order-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 font-black text-lg flex items-center justify-center border-2 border-slate-300 mb-2 shadow-inner">
                      2
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Runner Up</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1">{leaderboardData[1].name}</h4>
                    <p className="text-[11px] text-slate-500">{leaderboardData[1].program}</p>
                    <span className="mt-2 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3 text-slate-500" />
                      {leaderboardData[1].badge}
                    </span>
                    <p className="text-base font-black text-[#002147] mt-3">{leaderboardData[1].points} <span className="text-xs font-semibold text-slate-500">Pts</span></p>
                  </div>

                  {/* #1 Rank - Champion */}
                  <div className="bg-gradient-to-b from-amber-50 via-white to-amber-50/30 p-6 rounded-2xl border-2 border-amber-400 shadow-md flex flex-col items-center text-center relative order-1 md:order-2 transform md:-translate-y-2">
                    <div className="absolute -top-3 bg-amber-400 text-blue-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-blue-950" /> Campus Scholar Leader
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 text-[#002147] font-black text-2xl flex items-center justify-center border-2 border-white mb-2 shadow-md">
                      1
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">#1 Overall Contributor</span>
                    <h4 className="text-base font-black text-slate-900 mt-1">{leaderboardData[0].name}</h4>
                    <p className="text-[11px] text-slate-500">{leaderboardData[0].program}</p>
                    <span className="mt-2 bg-amber-400/20 text-amber-900 border border-amber-400/40 text-[10px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {leaderboardData[0].badge}
                    </span>
                    <p className="text-xl font-black text-[#002147] mt-3">{leaderboardData[0].points} <span className="text-xs font-semibold text-slate-500">Pts</span></p>
                  </div>

                  {/* #3 Rank */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative order-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-black text-lg flex items-center justify-center border-2 border-amber-300 mb-2 shadow-inner">
                      3
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">3rd Place</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1">{leaderboardData[2].name}</h4>
                    <p className="text-[11px] text-slate-500">{leaderboardData[2].program}</p>
                    <span className="mt-2 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Medal className="w-3 h-3 text-amber-600" />
                      {leaderboardData[2].badge}
                    </span>
                    <p className="text-base font-black text-[#002147] mt-3">{leaderboardData[2].points} <span className="text-xs font-semibold text-slate-500">Pts</span></p>
                  </div>
                </div>

                {/* FULL RANKINGS TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">University Top Contributors</h3>
                      <p className="text-xs text-slate-500">Live points breakdown based on verified study guide uploads and peer assistance.</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      Top 10 Active Students
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">College &amp; Program</th>
                          <th className="py-3 px-4 text-center">Badge &amp; Status</th>
                          <th className="py-3 px-4 text-center">Materials Shared</th>
                          <th className="py-3 px-4 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {leaderboardData.map((item) => (
                          <tr key={item.rank} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-black">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                                item.rank === 1 ? 'bg-amber-400 text-blue-950' :
                                item.rank === 2 ? 'bg-slate-300 text-slate-900' :
                                item.rank === 3 ? 'bg-amber-700 text-white' : 'text-slate-500'
                              }`}>
                                #{item.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="block font-semibold text-slate-800">{item.college}</span>
                              <span className="text-[10px] text-slate-500">{item.program}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-500" />
                                {item.badge}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {item.contributions} Reviewers
                            </td>
                            <td className="py-3 px-4 text-right font-black text-[#002147]">
                              {item.points} Pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sticky Footer Row: MY RANKING PINNED */}
                  <div className="bg-blue-950 text-white p-4 border-t-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-400 text-blue-950 font-black text-xs flex items-center justify-center shrink-0">
                        #{userStats.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{authenticatedUser?.name || 'Rizalian Student'}</span>
                          <span className="bg-amber-400 text-blue-950 font-black text-[9px] uppercase px-2 py-0.2 rounded">Your Position</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{authenticatedUser?.program || 'College Student'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span>Shared: <strong>{userStats.contributions} Materials</strong></span>
                      <span className="text-amber-400 font-black text-sm">{userStats.points} Points</span>
                      <button
                        onClick={() => setCurrentView('community')}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Upload Materials to Rank Up
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        ) : (
          <div
            id="jru-auth-landscape-card"
            className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-950/80 border-2 border-yellow-400 overflow-hidden text-slate-800 transition-all duration-300 md:grid md:grid-cols-12 min-h-0 md:min-h-[540px]"
          >
            {/* Left Brand Panel */}
            <div
              id="jru-landscape-brand-panel"
              className="md:col-span-5 bg-gradient-to-br from-[#002147] via-[#092B54] to-[#001733] p-4 sm:p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r-2 border-yellow-400/40"
            >
              <div className="absolute -top-16 -left-16 w-52 h-52 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3.5">
                  <JruLogo size="md" className="w-12 h-12 sm:w-14 sm:h-14" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-950 bg-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-sm font-sans">
                      Rizalian Student Portal
                    </span>
                    <h2 className="text-base sm:text-lg font-black uppercase font-varsity tracking-wide text-white mt-1">
                      Jose Rizal University
                    </h2>
                    <p className="text-[11px] text-yellow-300/90 font-serif italic">
                      Causa &bull; Scientia &bull; Patria &bull; Est. 1919
                    </p>
                  </div>
                </div>
                <div className="pt-1 sm:pt-2 border-t border-yellow-400/30">
                  <h3 className="text-base sm:text-lg lg:text-xl font-black text-white leading-tight">
                    Integrated Student Academic Portal &amp; Resource Hub
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 sm:mt-1.5 leading-relaxed hidden sm:block">
                    The central portal for students across all colleges and programs at Jose Rizal University to access grades, class schedules, enrollment details, and shared academic reviewers.
                  </p>
                </div>
              </div>

              <div className="relative z-10 my-3 sm:my-5 space-y-2.5 hidden sm:block">
                <div className="space-y-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2.5 bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-300 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                    <span className="leading-snug">
                      <strong>Unified Academic Record &amp; Enrollment Access</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-300 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                    <span className="leading-snug">
                      <strong>Integrated Reviewer &amp; Learning Resource Library</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-300 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                    <span className="leading-snug">
                      <strong>Official Institutional Resources</strong> from JRU, CHED &amp; Library Hubs
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Colleges &amp; Academic Divisions
                  </span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="bg-yellow-400 text-blue-950 font-bold px-1.5 py-0.5 rounded border border-yellow-300">Computer Studies</span>
                    <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">Business Admin</span>
                    <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">Nursing &amp; Health</span>
                    <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">Education &amp; Liberal Arts</span>
                    <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">Hospitality Mgmt</span>
                    <span className="bg-white/10 text-white px-1.5 py-0.5 rounded">Law</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-2 pt-3 border-t border-yellow-400/30 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-yellow-300 font-semibold text-[11px] sm:text-xs">
                  <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Official JRU Student Authentication</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-yellow-400" />
                    JRU Student ID Single Sign-On
                  </span>
                  <span>Mandaluyong City, Philippines</span>
                </div>
              </div>
            </div>

            {/* Right Form Panel */}
            <div
              id="jru-landscape-form-panel"
              className="md:col-span-7 bg-white p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                {/* CENTERED Navigation Tabs Header */}
                <div className="relative border-b border-slate-200 pb-4 mb-6 flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'login'
                          ? 'bg-[#002147] text-amber-400 shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'signup'
                          ? 'bg-[#002147] text-amber-400 shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      Register Account
                    </button>
                  </div>

                  {activeTab === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="absolute right-0 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}
                </div>

                {/* Form Switcher Views */}
                {activeTab === 'login' && (
                  <LoginForm
                    onSuccess={handleAuthSuccess}
                    onForgotPassword={() => setActiveTab('forgot')}
                  />
                )}

                {activeTab === 'signup' && (
                  <SignUpForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToLogin={() => setActiveTab('login')}
                  />
                )}

                {activeTab === 'forgot' && (
                  <ForgotPasswordView
                    onBackToLogin={() => setActiveTab('login')}
                  />
                )}
              </div>

              {/* Security Footer Notice */}
              <div className="pt-6 mt-6 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  SSL Encrypted Connection
                </span>
                <span>JRU IT Infrastructure System</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Resource features available from any screen (QR scan, shared links, saved list, feed) */}
      {authenticatedUser && scannerOpen && (
        <QrScannerModal
          onClose={() => setScannerOpen(false)}
          onResource={(id) => {
            setScannerOpen(false);
            setOpenResourceId(id);
          }}
        />
      )}
      {authenticatedUser && openResourceId && (
        <ResourceDetailModal
          resourceId={openResourceId}
          token={authenticatedUser.token}
          currentUser={authenticatedUser}
          onClose={() => setOpenResourceId(null)}
          onChanged={() => setResourceVersion((v) => v + 1)}
          onTranslate={openTranslator}
        />
      )}

      {/* Global Campus Footer */}
      <CampusFooter />
    </div>
  );
}