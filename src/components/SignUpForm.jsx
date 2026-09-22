import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  IdCard,
  GraduationCap,
  Briefcase,
  Check,
  AlertCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  ACADEMIC_CATEGORIES,
  JRU_DEPARTMENTS,
  STUDENT_YEAR_LEVELS,
  TEACHER_RANKS,
} from '../types';
import { formatJruId, isJruIdValid, getJruIdValidationError } from '../utils/idValidation';

export const SignUpForm = ({ onSuccess, onSwitchToLogin }) => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    role: 'student',
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    category: 'Information Technology',
    department: JRU_DEPARTMENTS[0],
    yearLevelOrRank: STUDENT_YEAR_LEVELS[0],
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    wantToContribute: true,
    studyInterests: ['Information Technology & Software Engineering'],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIdChange = (rawVal) => {
    if (formData.idNumber.endsWith('-') && rawVal.length === formData.idNumber.length - 1) {
      setFormData((prev) => ({ ...prev, idNumber: rawVal }));
      return;
    }
    const formatted = formatJruId(rawVal);
    setFormData((prev) => ({ ...prev, idNumber: formatted }));
  };

  const hasMinLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch =
    formData.password.length > 0 && formData.password === formData.confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    const idValidationError = getJruIdValidationError(formData.idNumber, role);
    if (idValidationError) {
      setError(idValidationError);
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide your institutional JRU email address.');
      return;
    }
    if (!hasMinLength || !hasNumber) {
      setError('Password must be at least 8 characters and include at least 1 number.');
      return;
    }
    if (!passwordsMatch) {
      setError('Password and confirmation password do not match.');
      return;
    }
    if (!formData.agreedToTerms) {
      setError('You must accept the JRU Academic Integrity and Code of Conduct.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({
        role,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        studentNumber: formData.idNumber.trim(),
        email: formData.email.toLowerCase().trim(),
        category: formData.category,
        department: formData.department,
        yearLevel: formData.yearLevelOrRank,
        status: role === 'teacher' ? 'Faculty' : 'Official',
        contributedReviewersCount: formData.wantToContribute ? 1 : 0,
        upvotesReceived: 0,
        savedReviewersCount: 2,
      });
    }, 800);
  };

  return (
    <form id="jru-signup-form" onSubmit={handleSubmit} className="space-y-3.5">
      <div className="p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setRole('student');
            setFormData({
              ...formData,
              role: 'student',
              yearLevelOrRank: STUDENT_YEAR_LEVELS[0],
            });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            role === 'student'
              ? 'bg-[#002147] text-amber-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Registration</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('teacher');
            setFormData({
              ...formData,
              role: 'teacher',
              yearLevelOrRank: TEACHER_RANKS[0],
            });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            role === 'teacher'
              ? 'bg-[#002147] text-amber-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Teacher / Faculty</span>
        </button>
      </div>

      {error && (
        <div
          id="signup-error-alert"
          className="p-3 text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="signup-first-name"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            First Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <User className="w-3.5 h-3.5" />
            </div>
            <input
              id="signup-first-name"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Jose"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="signup-last-name"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Last Name
          </label>
          <input
            id="signup-last-name"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="e.g. Rizal"
            className="w-full px-3 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="signup-student-number"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              {role === 'teacher' ? 'Faculty ID' : 'Student ID'}
            </label>
            <span className="text-[10px] text-amber-800 font-semibold font-mono bg-yellow-100 px-1.5 py-0.5 rounded-sm border border-yellow-300">
              e.g. 25-260000 (Example)
            </span>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <IdCard className="w-3.5 h-3.5" />
            </div>
            <input
              id="signup-student-number"
              name="studentNumber"
              type="text"
              required
              maxLength={9}
              value={formData.idNumber}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="e.g. 25-260000"
              className={`w-full pl-9 pr-8 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 font-mono tracking-wider ${
                formData.idNumber.length > 0
                  ? isJruIdValid(formData.idNumber, role === 'teacher')
                    ? 'border-emerald-500 focus:ring-emerald-400 bg-emerald-50/20'
                    : 'border-amber-400 focus:ring-amber-400'
                  : 'border-slate-200 focus:ring-amber-400 focus:border-blue-900'
              }`}
            />
            {formData.idNumber && (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                {isJruIdValid(formData.idNumber, role === 'teacher') ? (
                  <span className="text-emerald-600 flex items-center" title="Valid JRU ID Format">
                    <Check className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-1 py-0.5 rounded">
                    {formData.idNumber.length}/9
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            Format: 2 digits - 6 digits (e.g. <span className="font-mono font-semibold text-blue-950">25-260000</span> is just an example; 21-, 22-, 23-, 24-, 25- accepted)
          </p>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="signup-email"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            JRU Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={role === 'teacher' ? 'name@jru.edu' : 'name@my.jru.edu'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="signup-category"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            Academic Category
          </label>
          <select
            id="signup-category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/70 hover:bg-white text-slate-900 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900"
          >
            {ACADEMIC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="signup-year-level"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {role === 'teacher' ? 'Faculty Rank / Title' : 'Year Level'}
          </label>
          <select
            id="signup-year-level"
            name="yearLevel"
            value={formData.yearLevelOrRank}
            onChange={(e) => setFormData({ ...formData, yearLevelOrRank: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/70 hover:bg-white text-slate-900 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900"
          >
            {role === 'teacher'
              ? TEACHER_RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))
              : STUDENT_YEAR_LEVELS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="signup-password"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 8 characters"
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="signup-confirm-password"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repeat password"
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
          <input
            type="checkbox"
            id="signup-agree-terms"
            checked={formData.agreedToTerms}
            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
            className="w-4 h-4 mt-0.5 text-blue-900 border-slate-300 rounded focus:ring-amber-400 cursor-pointer"
          />
          <span>
            I agree to the{' '}
            <strong className="text-blue-900">JRU Honor Code &amp; Academic Integrity</strong> and
            Data Privacy Act provisions for sharing study materials.
          </span>
        </label>
      </div>

      <button
        type="submit"
        id="btn-signup-submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] hover:from-[#001733] hover:to-[#002b5e] text-white font-bold text-sm sm:text-base rounded-xl border border-amber-400/80 shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Creating {role === 'teacher' ? 'Faculty' : 'Student'} Account...</span>
          </span>
        ) : (
          <>
            <span>Complete Registration</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          Already have a JRU portal account?{' '}
          <button
            type="button"
            id="btn-switch-to-login"
            onClick={onSwitchToLogin}
            className="font-bold text-blue-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </div>
    </form>
  );
};