import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Trophy, 
  Calendar, 
  Clock, 
  Download, 
  Star, 
  Search, 
  CheckCircle, 
  Building2,
  Sparkles,
  ShieldCheck,
  Lock,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';

export function StudentDashboardPreview({ student, onSignOut, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Fallback handler if onNavigate is not provided
  const handleNavigateToReviewerHub = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('ReviewerCommunityView');
    } else {
      setActiveTab('reviewers');
    }
  };

  // Default fallback user data
  const userData = {
    name: student?.name || 'Aines Julia Degesica',
    studentId: student?.studentId || 'JRU-2024-01919',
    program: student?.program || 'Bachelor of Science in Business Administration',
    college: student?.college || 'College of Business Administration',
    yearLevel: student?.yearLevel || '3rd Year (Junior)',
    gpa: student?.gpa || '1.25',
    email: student?.email || 'student@jru.edu'
  };

  const courses = [
    { code: 'MGT 301', name: 'Strategic Management', instructor: 'Prof. A. Santos', schedule: 'Mon/Wed 10:00 AM - 11:30 AM', room: 'Building A - Room 302', grade: '1.25' },
    { code: 'ACC 202', name: 'Financial Accounting & Reporting', instructor: 'Dr. M. Reyes', schedule: 'Tue/Thu 1:00 PM - 2:30 PM', room: 'Building B - Room 104', grade: '1.50' },
    { code: 'GE 105', name: 'Purposive Communication', instructor: 'Prof. L. Garcia', schedule: 'Fri 8:00 AM - 11:00 AM', room: 'Online / LMS', grade: '1.00' },
    { code: 'IT 101', name: 'Introduction to Computing', instructor: 'Engr. J. Cruz', schedule: 'Tue/Thu 9:00 AM - 10:30 AM', room: 'IT Lab 3', grade: '1.25' }
  ];

  const studyResources = [
    { id: 1, title: 'Comprehensive Strategic Management Midterm Reviewer', course: 'MGT 301', author: 'J. Dela Cruz', rating: 4.9, downloads: 342, date: 'Oct 2024' },
    { id: 2, title: 'Financial Accounting Practice Problems & Solutions', course: 'ACC 202', author: 'L. Fabular', rating: 4.8, downloads: 512, date: 'Nov 2024' },
    { id: 3, title: 'Purposive Communication Finals Summary Guide', course: 'GE 105', author: 'P. Jebulan', rating: 4.7, downloads: 219, date: 'Dec 2024' }
  ];

  // 5 Core Policies Dataset
  const portalPolicies = [
    {
      id: 1,
      title: 'Account Security & Identity Verification',
      icon: Lock,
      rules: [
        'Login access is restricted strictly to verified JRU students and faculty.',
        'Credentials are non-transferable; account sharing or impersonation is prohibited.'
      ]
    },
    {
      id: 2,
      title: 'Academic Integrity & Content Quality',
      icon: UserCheck,
      rules: [
        'Uploaded study guides must be original work or cited appropriately.',
        'Leaking live examination keys or unauthorized test materials is grounds for expulsion.'
      ]
    },
    {
      id: 3,
      title: 'Prohibition of Unlawful & Harmful Content',
      icon: AlertTriangle,
      rules: [
        'Distributing malware, spyware, or malicious scripts via files is forbidden.',
        'Copyright-infringing commercial textbooks without authorization are prohibited.'
      ]
    },
    {
      id: 4,
      title: 'Respectful Community Conduct',
      icon: CheckCircle,
      rules: [
        'All forum interactions and feedback must adhere to JRU civil conduct rules.',
        'Harassment, hate speech, or derogatory comments will result in account suspension.'
      ]
    },
    {
      id: 5,
      title: 'Data Privacy & Infrastructure Compliance',
      icon: ShieldCheck,
      rules: [
        'Bypassing system encryption or scraping institutional records is forbidden.',
        'System usage is logged under JRU IT Infrastructure policies for audit compliance.'
      ]
    }
  ];

  // Filter study resources dynamically
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return studyResources;
    const query = searchQuery.toLowerCase();
    return studyResources.filter(
      (res) =>
        res.title.toLowerCase().includes(query) ||
        res.course.toLowerCase().includes(query) ||
        res.author.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle Download Action
  const handleDownload = (resource) => {
    setDownloadingId(resource.id);
    const content = `Study Material: ${resource.title}\nCourse: ${resource.course}\nAuthor: ${resource.author}\nDownloaded via JRU Student Portal`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.course}_Reviewer.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
  };

  return (
    <div className="w-full space-y-6 text-slate-800">
      
      {/* Top Banner / Student Profile Header */}
      <div className="bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] text-white p-6 rounded-2xl shadow-md border border-amber-400/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-[#002147] font-black text-2xl flex items-center justify-center border-2 border-white shadow-md shrink-0">
              {userData.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide">{userData.name}</h1>
                <span className="bg-amber-400 text-[#002147] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Active Student
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>ID: <strong>{userData.studentId}</strong></span>
                <span>&bull;</span>
                <span>{userData.yearLevel}</span>
              </p>
              <p className="text-xs text-amber-300 font-medium mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {userData.college}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              type="button"
              onClick={handleNavigateToReviewerHub}
              className="px-3.5 py-2 rounded-xl bg-amber-400 text-[#002147] font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:bg-amber-300"
            >
              <BookOpen className="w-4 h-4 text-[#002147]" />
              <span>Reviewer Community</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Academic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cumulative GPA</p>
            <p className="text-lg font-black text-slate-900">{userData.gpa}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-lg font-black text-slate-900">{courses.length} Subjects</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Academic Status</p>
            <p className="text-xs font-extrabold text-emerald-700">Good Standing</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Honor Points</p>
            <p className="text-lg font-black text-slate-900">450 Pts</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#002147] text-[#002147]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview &amp; Schedule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-[#002147] text-[#002147]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Courses ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviewers')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'reviewers'
              ? 'border-[#002147] text-[#002147]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Study Reviewers &amp; Files
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'policies'
              ? 'border-[#002147] text-[#002147]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rules &amp; Policies (5)
        </button>
      </div>

      {/* TAB CONTENT 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Class Schedule Card */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Current Class Schedule</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">1st Semester</span>
            </div>

            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.code} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 hover:border-amber-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-[#002147] bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800">{course.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {course.schedule}</span>
                      <span>&bull;</span>
                      <span>{course.room}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">{course.instructor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & University Bulletins */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Portal Quick Links</span>
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  type="button"
                  onClick={handleNavigateToReviewerHub}
                  className="p-3 bg-amber-50 hover:bg-amber-100/80 rounded-xl border border-amber-300 text-[#002147] font-bold text-left transition-colors flex flex-col gap-1 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Browse Reviewers</span>
                  <span className="text-[10px] text-amber-800 font-normal">Go to Reviewer Community</span>
                </button>
                <button 
                  type="button"
                  onClick={() => typeof onNavigate === 'function' ? onNavigate('leaderboard') : null}
                  className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 text-slate-800 font-bold text-left transition-colors flex flex-col gap-1 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Honor Roll</span>
                  <span className="text-[10px] text-slate-500 font-normal">Check Leaderboard</span>
                </button>
              </div>
            </div>

            <div className="bg-[#002147] text-white p-5 rounded-2xl border border-amber-400/30 space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Official Announcement</span>
              <h3 className="text-xs font-bold">Midterm Examination Schedule Released</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Check your course rooms or the Canvas LMS portal for complete exam room assignments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900">Enrolled Subjects &amp; Grade Overviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.code} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black text-blue-950 bg-amber-400 px-2 py-0.5 rounded">
                      {course.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{course.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Grade</span>
                    <span className="text-base font-black text-blue-950">{course.grade}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                  <p><strong>Faculty:</strong> {course.instructor}</p>
                  <p><strong>Schedule:</strong> {course.schedule}</p>
                  <p><strong>Location:</strong> {course.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Study Resources & Files */}
      {activeTab === 'reviewers' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900">Saved Study Materials &amp; Shared Reviewers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Looking for community notes? Head to the{' '}
                <button 
                  type="button"
                  onClick={handleNavigateToReviewerHub} 
                  className="text-amber-600 font-bold underline cursor-pointer"
                >
                  Reviewer Community
                </button>.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-xs pl-8 pr-8 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <div key={resource.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-[#002147] text-white px-2 py-0.5 rounded">
                        {resource.course}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{resource.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>By {resource.author}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {resource.rating}
                      </span>
                      <span>&bull;</span>
                      <span>{resource.downloads} downloads</span>
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDownload(resource)}
                    disabled={downloadingId === resource.id}
                    className="px-3 py-1.5 bg-[#002147] text-amber-300 font-bold text-xs rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-75"
                  >
                    {downloadingId === resource.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No study materials match "{searchQuery}".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Rules & Policies - EXACTLY 5 POLICIES */}
      {activeTab === 'policies' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Student Portal Rules &amp; Acceptable Use Policy</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Institutional guidelines governing academic resource usage and student portal conduct.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
              5 Core Guidelines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {portalPolicies.map((policy) => {
              const PolicyIcon = policy.icon;
              return (
                <div key={policy.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-[#002147] font-bold">
                    <PolicyIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <h3>{policy.id}. {policy.title}</h3>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1.5 leading-relaxed pl-1">
                    {policy.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              All account actions are governed by the Jose Rizal University Student Code of Conduct.
            </span>
            <span className="italic">JRU IT Infrastructure System</span>
          </div>
        </div>
      )}
    </div>
  );
}