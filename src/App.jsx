import React, { useEffect, useState } from 'react';
import { JruLogo } from './components/JruLogo';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { ResetPasswordView } from './components/ResetPasswordView';
import { takeResetLink } from './utils/resetLink';
import { StudentDashboardPreview } from './components/StudentDashboardPreview';
import { ReviewerCommunityView } from './components/ReviewerCommunityView';
import { HonorRollView } from './components/HonorRollView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { FeatureNav } from './components/FeatureNav';
import { BookmarksView } from './components/BookmarksView';
import { DocumentTranslator } from './components/DocumentTranslator';
import ResourceDetailModal from './components/ResourceDetailModal';
import QrScannerModal from './components/QrScannerModal';
import QuizGame from './components/QuizGame';
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
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

// Read once when the page loads (module scope, so React StrictMode cannot run it twice).
const INITIAL_RESET_LINK = takeResetLink();

export default function App() {
  const [resetLink] = useState(INITIAL_RESET_LINK);
  const [activeTab, setActiveTab] = useState(INITIAL_RESET_LINK ? 'reset' : 'login');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'community' | 'leaderboard' | 'bookmarks' | 'translate' | 'quiz'
  const [dashboardHome, setDashboardHome] = useState(0); // bumps when "Dashboard" is clicked so the dashboard returns to its Overview tab
  // Learning features shared by students and faculty
  const [openResourceId, setOpenResourceId] = useState(null); // resource detail modal (QR links, saved list, feed)
  const [scannerOpen, setScannerOpen] = useState(false);
  const [translateResource, setTranslateResource] = useState(null); // resource sent to the translator
  const [quizResource, setQuizResource] = useState(null); // resource sent to the quiz game
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
    setQuizResource(null);
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
    } else if (destination === 'bookmarks' || destination === 'translate' || destination === 'quiz') {
      setCurrentView(destination);
    } else {
      setCurrentView('dashboard');
      setDashboardHome((n) => n + 1);
    }
  };

  const isTeacher = authenticatedUser?.role === 'teacher';

  const openTranslator = (resource) => {
    setOpenResourceId(null);
    setTranslateResource(resource);
    setCurrentView('translate');
  };

  const openQuiz = (resource) => {
    setOpenResourceId(null);
    setQuizResource(resource);
    setCurrentView('quiz');
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
            role={authenticatedUser ? 'button' : undefined}
            tabIndex={authenticatedUser ? 0 : undefined}
            aria-label={authenticatedUser ? 'Go to dashboard' : undefined}
            onClick={() => authenticatedUser && handleNavigate('dashboard')}
            onKeyDown={(e) => {
              if (authenticatedUser && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleNavigate('dashboard');
              }
            }}
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

            {/* Quiz game built from a reviewer's QR code or file */}
            {currentView === 'quiz' && (
              <QuizGame
                token={authenticatedUser.token}
                initialResource={quizResource}
                onInitialResourceUsed={() => setQuizResource(null)}
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
                onOpenResource={setOpenResourceId}
                refreshKey={resourceVersion}
                homeSignal={dashboardHome}
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

            {/* VIEW 3: Honor Roll (real rankings from GET /api/leaderboard) */}
            {currentView === 'leaderboard' && (
              <HonorRollView
                user={authenticatedUser}
                refreshKey={resourceVersion}
                onBack={() => setCurrentView('dashboard')}
                onUpload={() => setCurrentView('community')}
              />
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

                {activeTab === 'reset' && resetLink && (
                  <ResetPasswordView
                    token={resetLink.token}
                    email={resetLink.email}
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
          onQuiz={openQuiz}
        />
      )}

      {/* Global Campus Footer */}
      <CampusFooter />
    </div>
  );
}