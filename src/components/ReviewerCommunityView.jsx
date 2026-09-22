import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  Sparkles, 
  Zap, 
  Search, 
  BookOpen, 
  Filter, 
  ThumbsUp, 
  Download, 
  CheckCircle2,
  X,
  Mic,
  MicOff,
  QrCode,
  Flag,
  ShieldCheck,
  Building2,
  ExternalLink,
  Camera,
  Star,
  UploadCloud,
  ChevronUp,
  HelpCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export function ReviewerCommunityView({ currentUser, onBackToDashboard }) {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('leaderboard'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');
  
  // Leaderboard Specific States
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('month'); 
  const [showPointGuideModal, setShowPointGuideModal] = useState(false);

  // Voice & Camera Modal States
  const [isListening, setIsListening] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  
  // Rating & Reporting Modal States
  const [selectedReviewerForReport, setSelectedReviewerForReport] = useState(null);
  const [reportReason, setReportReason] = useState('Incorrect Information');
  const [reportDetails, setReportDetails] = useState('');
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    courseCode: '',
    college: 'College of Business Administration',
    description: '',
    file: null
  });

  // User Stats State
  const [userStats, setUserStats] = useState({
    rank: 14,
    points: currentUser?.points || 450,
    contributions: 5,
    badgesEarned: ['Verified Student', 'Resource Contributor']
  });

  // Community Feed Data State
  const [reviewersList, setReviewersList] = useState([
    {
      id: 1,
      title: 'Strategic Management Midterm Comprehensive Exam Reviewer',
      courseCode: 'MGT 301',
      author: 'Maria Santos',
      authorRole: 'Top Contributor',
      college: 'College of Business Administration',
      likes: 124,
      isLiked: false,
      downloads: 412,
      comments: 18,
      rating: 4.9,
      userRating: 0,
      date: '2 hours ago'
    },
    {
      id: 2,
      title: 'Database Management Systems & SQL Query Practice Set',
      courseCode: 'IT 204',
      author: 'Jann Dela Cruz',
      authorRole: 'Top Quizmaster',
      college: 'College of Computer Studies',
      likes: 98,
      isLiked: false,
      downloads: 305,
      comments: 12,
      rating: 4.8,
      userRating: 0,
      date: 'Yesterday'
    },
    {
      id: 3,
      title: 'Anatomy and Physiology Nursing Board Reviewer Summary',
      courseCode: 'NUR 102',
      author: 'Rhea Alonzo',
      authorRole: 'Verified Scholar',
      college: 'College of Nursing & Health Sciences',
      likes: 86,
      isLiked: false,
      downloads: 240,
      comments: 9,
      rating: 4.9,
      userRating: 0,
      date: '3 days ago'
    }
  ]);

  // Official Institutional Resources Data
  const officialResources = [
    {
      id: 'off-1',
      title: 'JRU Institutional Student Handbook & Academic Policies (2025–2026)',
      institution: 'Jose Rizal University - Academic Affairs',
      category: 'Official Handbook',
      courseCode: 'JRU-GEN',
      verifiedBy: 'JRU Office of the Registrar',
      downloadUrl: '#',
      fileSize: '4.2 MB PDF'
    },
    {
      id: 'off-2',
      title: 'CHED Curriculum Standards for BS Information Technology',
      institution: 'Commission on Higher Education (CHED)',
      category: 'Curriculum Guide',
      courseCode: 'CHED-IT',
      verifiedBy: 'CHED Higher Education Regional Office',
      downloadUrl: '#',
      fileSize: '1.8 MB PDF'
    },
    {
      id: 'off-3',
      title: 'OpenStax Principles of Financial Accounting Reference Guide',
      institution: 'Rice University / Open Educational Resources',
      category: 'Open Textbook',
      courseCode: 'ACT 101',
      verifiedBy: 'JRU Library Services',
      downloadUrl: '#',
      fileSize: '12.5 MB PDF'
    }
  ];

  // Leaderboard Data
  const [leaderboardData, setLeaderboardData] = useState([
    { rank: 1, name: 'Maria Santos', college: 'College of Business Administration', program: 'BSBA - Financial Management', points: 1420, contributions: 28, downloads: 1240, badge: 'Top Contributor' },
    { rank: 2, name: 'Jann Dela Cruz', college: 'College of Computer Studies', program: 'BS Information Technology', points: 1250, contributions: 22, downloads: 980, badge: 'Top Quizmaster' },
    { rank: 3, name: 'Rhea Alonzo', college: 'College of Nursing & Health Sciences', program: 'BS Nursing', points: 1180, contributions: 19, downloads: 850, badge: 'Verified Scholar' },
    { rank: 4, name: 'Mark Anthony Reyes', college: 'College of Engineering & Tech', program: 'BS Computer Engineering', points: 980, contributions: 16, downloads: 620, badge: 'Peer Tutor' },
    { rank: 5, name: 'Camille Villar', college: 'College of Liberal Arts & Education', program: 'BA Communication', points: 890, contributions: 14, downloads: 510, badge: 'Resource Hero' },
    { rank: 6, name: 'Joshua Lim', college: 'College of Computer Studies', program: 'BS Computer Science', points: 760, contributions: 11, downloads: 430, badge: 'Code Navigator' },
    { rank: 7, name: 'Patricia Gomez', college: 'College of Business Administration', program: 'BSBA - Marketing', points: 640, contributions: 9, downloads: 380, badge: 'Note Master' }
  ]);

  // Point Earning Rules Data
  const pointEarningRules = [
    { action: 'Upload Study Material / Reviewer', points: '+50 Pts', description: 'Share course notes, reviewers, or practice sets verified by peer votes.' },
    { action: 'Receive a 5-Star Usefulness Rating', points: '+10 Pts', description: 'Earn bonus points whenever a fellow student rates your material 5 stars.' },
    { action: 'Material Downloaded 50+ Times', points: '+25 Pts', description: 'Milestone bonus when your material becomes widely used by students.' },
    { action: 'Report Inappropriate / Fake Material', points: '+5 Pts', description: 'Help maintain community quality by flagging inaccurate or spam content.' },
    { action: 'Daily Academic Check-in', points: '+2 Pts', description: 'Log into the learning hub daily to maintain your active streak.' }
  ];

  // Voice Search Handler
  const toggleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  // QR Code Scanner Mock
  const handleSimulateQrScan = () => {
    setSearchQuery('IT 204');
    setIsQrScannerOpen(false);
    setUploadSuccessMessage('QR Code Scanned! Filtering for Course: IT 204');
    setTimeout(() => setUploadSuccessMessage(''), 4000);
  };

  // Rating Function
  const handleRateReviewer = (id, newRating) => {
    setReviewersList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, userRating: newRating };
        }
        return item;
      })
    );
  };

  // Reporting Submission
  const handleReportSubmit = (e) => {
    e.preventDefault();
    alert(`Report submitted for "${selectedReviewerForReport.title}". Thank you for keeping our community safe!`);
    setSelectedReviewerForReport(null);
    setReportDetails('');
  };

  // Like Function
  const handleLikeReviewer = (id) => {
    setReviewersList(prev =>
      prev.map(item => item.id === id ? { ...item, likes: item.isLiked ? item.likes - 1 : item.likes + 1, isLiked: !item.isLiked } : item)
    );
  };

  // Upload Submit Function
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.courseCode) {
      alert('Please fill in required fields.');
      return;
    }

    const newReviewer = {
      id: Date.now(),
      title: uploadForm.title,
      courseCode: uploadForm.courseCode.toUpperCase(),
      author: currentUser?.name || 'Rizalian Student',
      authorRole: 'Active Contributor',
      college: uploadForm.college,
      likes: 0,
      isLiked: false,
      downloads: 0,
      comments: 0,
      rating: 5.0,
      userRating: 0,
      date: 'Just now'
    };

    setReviewersList([newReviewer, ...reviewersList]);
    setUserStats({
      ...userStats,
      points: userStats.points + 50,
      contributions: userStats.contributions + 1
    });

    setUploadForm({ title: '', courseCode: '', college: 'College of Business Administration', description: '', file: null });
    setIsUploadModalOpen(false);
    setUploadSuccessMessage('Successfully published! You earned +50 Contribution Points.');
    setTimeout(() => setUploadSuccessMessage(''), 5000);
  };

  // Filtered Reviewers List
  const filteredReviewers = reviewersList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollege = selectedCollege === 'All' || item.college.includes(selectedCollege);
    return matchesSearch && matchesCollege;
  });

  return (
    <div className="w-full space-y-6 text-slate-800">
      
      {/* Toast Notification */}
      {uploadSuccessMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between transition-all animate-bounce">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>{uploadSuccessMessage}</span>
          </div>
          <button onClick={() => setUploadSuccessMessage('')} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Community Header Banner */}
      <div className="bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] text-white p-6 rounded-2xl border border-amber-400/40 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-blue-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                Peer &amp; Official Hub
              </span>
              <span className="text-xs text-amber-300 font-semibold">Jose Rizal University</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-varsity tracking-wide mt-1.5">
              Rizalian Learning Resources &amp; Community
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Explore peer reviewers and official institutional materials from JRU and CHED.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">My Points</span>
              <span className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                {userStats.points}
              </span>
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'feed' ? 'border-[#002147] text-[#002147]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Peer Reviewers Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('official')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'official' ? 'border-[#002147] text-[#002147]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Official Learning Resources</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full">Verified</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'leaderboard' ? 'border-[#002147] text-[#002147]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Leaderboard</span>
        </button>
      </div>

      {/* SEARCH BAR (FOR FEED & OFFICIAL) */}
      {activeTab !== 'leaderboard' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search keywords, course codes, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={toggleVoiceSearch}
              title="Voice Search"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isListening 
                  ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsQrScannerOpen(true)}
              title="Scan QR Code"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-slate-100 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="All">All Colleges</option>
              <option value="Business">Business Administration</option>
              <option value="Computer">Computer Studies</option>
              <option value="Nursing">Nursing &amp; Health</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: PEER REVIEWERS FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {filteredReviewers.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-blue-950 text-amber-300 px-2 py-0.5 rounded">
                      {item.courseCode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{item.college}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedReviewerForReport(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Report Content"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg text-xs">
                <span className="text-[11px] font-bold text-slate-600">Rate Usefulness:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateReviewer(item.id, star)}
                      className="cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${
                        star <= (item.userRating || item.rating) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300'
                      }`} />
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">({item.rating} overall)</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>By <strong>{item.author}</strong> &bull; {item.date}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleLikeReviewer(item.id)} className="flex items-center gap-1 hover:text-blue-900 cursor-pointer">
                    <ThumbsUp className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-blue-900 text-blue-900' : ''}`} />
                    <span>{item.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 bg-blue-950 text-amber-300 rounded-lg font-bold cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: OFFICIAL INSTITUTIONAL LEARNING RESOURCES */}
      {activeTab === 'official' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Official &amp; Verified Institutional Repository</span>
              <span>Materials in this section are verified documents provided directly by Jose Rizal University offices, CHED, and open educational partners.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialResources.map((res) => (
              <div key={res.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {res.verifiedBy}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{res.fileSize}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{res.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{res.institution}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{res.category}</span>
                  <a href={res.downloadUrl} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#002147] text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors">
                    <span>Access Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD WITH "HOW TO EARN POINTS" */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          
          {/* Header & Filter Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Community Honor Roll
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Top Rizalian contributors sharing verified study guides and academic resources.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPointGuideModal(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-blue-700" />
                <span>How to Earn Points</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setLeaderboardTimeframe('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    leaderboardTimeframe === 'month' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setLeaderboardTimeframe('semester')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    leaderboardTimeframe === 'semester' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  This Semester
                </button>
                <button
                  onClick={() => setLeaderboardTimeframe('allTime')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    leaderboardTimeframe === 'allTime' ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All-Time
                </button>
              </div>
            </div>
          </div>

          {/* QUICK HOW-TO EARN POINTS CAROUSEL / HIGHLIGHT BOX */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-blue-900/5 border border-amber-300/60 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                Ways to Climb the Leaderboard
              </span>
              <button 
                onClick={() => setShowPointGuideModal(true)}
                className="text-[11px] text-blue-950 font-black hover:underline cursor-pointer"
              >
                View Full Guide &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">Upload Reviewers</span>
                  <span className="text-[10px] text-slate-500">Share notes &amp; course sets</span>
                </div>
                <span className="bg-amber-100 text-amber-900 font-black text-xs px-2 py-1 rounded-lg shrink-0">
                  +50 Pts
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">5-Star Ratings</span>
                  <span className="text-[10px] text-slate-500">Peer quality appreciation</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 font-black text-xs px-2 py-1 rounded-lg shrink-0">
                  +10 Pts
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">50+ Downloads</span>
                  <span className="text-[10px] text-slate-500">High-impact study guide</span>
                </div>
                <span className="bg-blue-100 text-blue-950 font-black text-xs px-2 py-1 rounded-lg shrink-0">
                  +25 Pts
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 (Silver) */}
            {leaderboardData[1] && (
              <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded-2xl p-5 flex flex-col items-center text-center relative shadow-sm order-2 md:order-1 mt-0 md:mt-4">
                <div className="w-12 h-12 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-black text-lg border-2 border-slate-300 shadow-inner mb-2">
                  2
                </div>
                <Medal className="w-6 h-6 text-slate-400 absolute top-4 right-4" />
                <h4 className="font-black text-sm text-slate-900 mt-1">{leaderboardData[1].name}</h4>
                <span className="text-[10px] text-slate-500 font-medium">{leaderboardData[1].program}</span>
                <span className="mt-2 bg-slate-200 text-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {leaderboardData[1].badge}
                </span>
                <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Points</span>
                    <span className="font-black text-blue-950 flex items-center gap-0.5">
                      <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {leaderboardData[1].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Uploads</span>
                    <span className="font-bold text-slate-700">{leaderboardData[1].contributions}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {leaderboardData[0] && (
              <div className="bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-white border-2 border-amber-400 rounded-2xl p-5 flex flex-col items-center text-center relative shadow-md order-1 md:order-2">
                <div className="w-14 h-14 bg-amber-400 text-blue-950 rounded-full flex items-center justify-center font-black text-xl border-4 border-amber-300 shadow-lg mb-2">
                  1
                </div>
                <Trophy className="w-7 h-7 text-amber-500 absolute top-4 right-4 animate-bounce" />
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-1">
                  Community Champion
                </span>
                <h4 className="font-black text-base text-slate-900">{leaderboardData[0].name}</h4>
                <span className="text-[10px] text-slate-500 font-medium">{leaderboardData[0].program}</span>
                <span className="mt-2 bg-blue-950 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full">
                  {leaderboardData[0].badge}
                </span>
                <div className="mt-4 pt-3 border-t border-amber-200/60 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Points</span>
                    <span className="font-black text-amber-600 text-sm flex items-center gap-0.5">
                      <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {leaderboardData[0].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Uploads</span>
                    <span className="font-bold text-slate-800">{leaderboardData[0].contributions}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {leaderboardData[2] && (
              <div className="bg-gradient-to-b from-amber-900/5 to-slate-50 border border-amber-700/30 rounded-2xl p-5 flex flex-col items-center text-center relative shadow-sm order-3 mt-0 md:mt-4">
                <div className="w-12 h-12 bg-amber-800/20 text-amber-900 rounded-full flex items-center justify-center font-black text-lg border-2 border-amber-700/30 shadow-inner mb-2">
                  3
                </div>
                <Award className="w-6 h-6 text-amber-700 absolute top-4 right-4" />
                <h4 className="font-black text-sm text-slate-900 mt-1">{leaderboardData[2].name}</h4>
                <span className="text-[10px] text-slate-500 font-medium">{leaderboardData[2].program}</span>
                <span className="mt-2 bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {leaderboardData[2].badge}
                </span>
                <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Points</span>
                    <span className="font-black text-blue-950 flex items-center gap-0.5">
                      <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {leaderboardData[2].points}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Uploads</span>
                    <span className="font-bold text-slate-700">{leaderboardData[2].contributions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Ranks Table (Ranks 4+) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-extrabold text-xs text-slate-700 uppercase tracking-wider">
              Runner-Up Leaderboard Standings
            </div>
            <div className="divide-y divide-slate-100">
              {leaderboardData.slice(3).map((student) => (
                <div key={student.rank} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xs border border-slate-200">
                      {student.rank}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900">{student.name}</h5>
                      <span className="text-[10px] text-slate-500">{student.program}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full">
                      {student.badge}
                    </span>
                    <div className="text-right">
                      <span className="font-black text-blue-950 flex items-center justify-end gap-1">
                        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {student.points}
                      </span>
                      <span className="text-[10px] text-slate-400">{student.contributions} uploads</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logged in User Current Rank Floating Bar */}
          <div className="bg-[#002147] text-white p-4 rounded-2xl border border-amber-400/40 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 font-black flex items-center justify-center text-sm shadow">
                #{userStats.rank}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Your Current Rank</span>
                <h5 className="font-bold text-sm text-white">{currentUser?.name || 'Rizalian Student'}</h5>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Your Total Points</span>
                <span className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {userStats.points} Pts
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: UPLOAD MATERIAL MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002147] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">Share Academic Reviewer</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Final Summary Reviewer"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MGT 301"
                    value={uploadForm.courseCode}
                    onChange={(e) => setUploadForm({ ...uploadForm, courseCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">College</label>
                  <select
                    value={uploadForm.college}
                    onChange={(e) => setUploadForm({ ...uploadForm, college: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="College of Business Administration">Business Admin</option>
                    <option value="College of Computer Studies">Computer Studies</option>
                    <option value="College of Nursing & Health Sciences">Nursing & Health</option>
                    <option value="College of Engineering & Tech">Engineering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brief Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add details about covered chapters or exam topics..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-slate-700 block">Click to attach document</span>
                <span className="text-[10px] text-slate-400">PDF, DOCX, or PNG (Max 25MB)</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-blue-950 text-blue-950" />
                  <span>Publish &amp; Earn +50 Pts</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HOW TO EARN POINTS GUIDE */}
      {showPointGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002147] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">How Point Allocation Works</h3>
              </div>
              <button onClick={() => setShowPointGuideModal(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <p className="text-slate-600">
                Earn Contribution Points by uploading quality study guides and maintaining community standards. Points dictate your rank on the Rizalian Honor Roll.
              </p>

              <div className="space-y-2.5">
                {pointEarningRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-slate-900">{rule.action}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{rule.description}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-lg shrink-0">
                      {rule.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPointGuideModal(false)}
                className="px-5 py-2 bg-[#002147] text-white font-bold rounded-xl text-xs hover:bg-blue-900 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QR SCANNER SIMULATION MODAL */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-center p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-950" />
                Scan Course QR Code
              </h3>
              <button onClick={() => setIsQrScannerOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-48 h-48 mx-auto bg-slate-900 rounded-2xl border-4 border-amber-400 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse" />
              <QrCode className="w-24 h-24 text-slate-700" />
            </div>

            <p className="text-xs text-slate-500">
              Align the QR code from your course syllabus or bulletin board inside the frame.
            </p>

            <button
              onClick={handleSimulateQrScan}
              className="w-full py-2.5 bg-blue-950 text-amber-300 font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors cursor-pointer"
            >
              Simulate Scanning "IT 204"
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: REPORT CONTENT MODAL */}
      {selectedReviewerForReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                <h3 className="font-black text-sm text-white">Report Resource</h3>
              </div>
              <button onClick={() => setSelectedReviewerForReport(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                <span className="font-bold block">Reporting material:</span>
                <span className="font-semibold">{selectedReviewerForReport.title}</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Flagging</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="Incorrect Information">Incorrect or Outdated Information</option>
                  <option value="Copyright Violation">Copyright / Plagiarism Concern</option>
                  <option value="Spam or Inappropriate">Spam or Inappropriate Content</option>
                  <option value="Corrupted File">Corrupted or Unreadable File</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this content needs review..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReviewerForReport(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}