import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  LogIn,
  GraduationCap,
  Briefcase,
  Check,
} from 'lucide-react';
import { formatJruId, isJruIdValid, getJruIdValidationError } from '../utils/idValidation';

export const LoginForm = ({ onSuccess, onForgotPassword, onSwitchToSignUp }) => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    role: 'student',
    identifier: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIdentifierChange = (val) => {
    if (formData.identifier.endsWith('-') && val.length === formData.identifier.length - 1) {
      setFormData((prev) => ({ ...prev, identifier: val }));
      return;
    }
    if (!val.includes('@') && /^[0-9-]*$/.test(val)) {
      setFormData((prev) => ({ ...prev, identifier: formatJruId(val) }));
    } else {
      setFormData((prev) => ({ ...prev, identifier: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const cleanIdentifier = formData.identifier.trim();
    if (!cleanIdentifier) {
      setError(
        role === 'teacher'
          ? 'Please enter your Faculty ID or JRU Email.'
          : 'Please enter your Student ID Number or JRU Email.'
      );
      return;
    }

    const isEmail = cleanIdentifier.includes('@');
    if (!isEmail) {
      const idError = getJruIdValidationError(cleanIdentifier, role);
      if (idError) {
        setError(idError);
        return;
      }
    }

    if (!formData.password) {
      setError('Please enter your portal password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const emailDomain = isEmail
        ? cleanIdentifier
        : role === 'teacher'
        ? `${cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '')}@jru.edu`
        : `${cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '')}@my.jru.edu`;

      if (role === 'teacher') {
        onSuccess({
          role: 'teacher',
          name: isEmail
            ? cleanIdentifier
                .split('@')[0]
                .split('.')
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' ')
            : 'Prof. Arnold Dela Cruz',
          studentNumber: isEmail ? 'FAC-8092' : cleanIdentifier,
          email: emailDomain.toLowerCase(),
          category: 'Information Technology',
          department: 'College of Computer Studies',
          yearLevel: 'Associate Professor / Faculty Lead',
          status: 'Faculty',
          contributedReviewersCount: 8,
          upvotesReceived: 215,
          savedReviewersCount: 12,
        });
      } else {
        onSuccess({
          role: 'student',
          name: isEmail
            ? cleanIdentifier
                .split('@')[0]
                .split('.')
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' ')
            : 'Aines Julia Degesica',
          studentNumber: isEmail ? '25-260000' : cleanIdentifier,
          email: emailDomain.toLowerCase(),
          category: 'Information Technology',
          department: 'College of Computer Studies',
          yearLevel: '3rd Year (Junior)',
          status: 'Enrolled',
          contributedReviewersCount: 3,
          upvotesReceived: 88,
          savedReviewersCount: 6,
        });
      }
    }, 600);
  };

  const handleInstitutionalEmailSSO = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'teacher') {
        onSuccess({
          role: 'teacher',
          name: 'Prof. Arnold Dela Cruz',
          studentNumber: 'FAC-8092',
          email: 'arnold.delacruz@jru.edu',
          category: 'Information Technology',
          department: 'College of Computer Studies',
          yearLevel: 'Associate Professor',
          status: 'Faculty',
          contributedReviewersCount: 8,
          upvotesReceived: 215,
          savedReviewersCount: 12,
        });
      } else {
        onSuccess({
          role: 'student',
          name: 'Aines Julia Degesica',
          studentNumber: '25-260000',
          email: 'ainesjulia.degesica@my.jru.edu',
          category: 'Information Technology',
          department: 'College of Computer Studies',
          yearLevel: '3rd Year (Junior)',
          status: 'Enrolled',
          contributedReviewersCount: 3,
          upvotesReceived: 88,
          savedReviewersCount: 6,
        });
      }
    }, 500);
  };

  return (
    <form id="jru-login-form" onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
      <div className="p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setRole('student');
            setFormData({ ...formData, role: 'student' });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            role === 'student'
              ? 'bg-[#002147] text-amber-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('teacher');
            setFormData({ ...formData, role: 'teacher' });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            role === 'teacher'
              ? 'bg-[#002147] text-amber-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Faculty &amp; Teacher</span>
        </button>
      </div>

      {error && (
        <div
          id="login-error-alert"
          className="p-3 text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-fadeIn"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-identifier"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {role === 'teacher' ? 'Faculty ID or JRU Email' : 'Student ID or JRU Email'}
          </label>
          <span className="text-[11px] text-amber-800 font-semibold font-mono bg-yellow-100 px-1.5 py-0.5 rounded-sm border border-yellow-300">
            {role === 'teacher' ? 'e.g. 25-260000 (Example) or @jru.edu' : 'e.g. 25-260000 (Example) or @my.jru.edu'}
          </span>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
            <User className="w-4 h-4" />
          </div>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            value={formData.identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            placeholder={
              role === 'teacher'
                ? 'e.g. 25-260000 (Example ID) or faculty@jru.edu'
                : 'e.g. 25-260000 (Example ID) or student@my.jru.edu'
            }
            className={`w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
              !formData.identifier.includes('@') && formData.identifier.length > 0
                ? isJruIdValid(formData.identifier, role === 'teacher')
                  ? 'border-emerald-500 focus:ring-emerald-400 font-mono tracking-wider'
                  : 'border-amber-400 focus:ring-amber-400 font-mono tracking-wider'
                : 'border-slate-200 focus:ring-amber-400 focus:border-blue-900'
            }`}
          />
          {formData.identifier && !formData.identifier.includes('@') && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {isJruIdValid(formData.identifier, role === 'teacher') ? (
                <span className="text-emerald-600 flex items-center" title="Valid JRU ID Format">
                  <Check className="w-4 h-4" />
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-1 py-0.5 rounded">
                  {formData.identifier.length}/9
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          Format: 2 digits - 6 digits (e.g. <span className="font-mono font-semibold text-blue-950">25-260000</span> is just an example; 21-, 22-, 23-, 24-, 25- batches accepted)
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-medium text-amber-700 hover:text-blue-900 hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-600">
          <input
            type="checkbox"
            id="login-remember-me"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
          />
          <span>Remember this device</span>
        </label>
        <span className="text-[11px] text-slate-500 font-mono">SSL 256-bit</span>
      </div>

      <button
        type="submit"
        id="btn-login-submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#002147] via-[#092B54] to-[#001733] hover:from-[#001733] hover:to-[#002b5e] text-white font-bold text-sm sm:text-base rounded-xl border border-amber-400/80 shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Authenticating {role === 'teacher' ? 'Faculty' : 'Student'}...</span>
          </span>
        ) : (
          <>
            <LogIn className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign In to Learning Portal</span>
          </>
        )}
      </button>

      <div className="relative flex items-center justify-center pt-1">
        <div className="flex-grow border-t border-slate-200" />
        <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 bg-white">
          Or Continue With
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      <button
        type="button"
        id="btn-google-sso"
        onClick={handleInstitutionalEmailSSO}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          Sign in with <strong>JRU Email</strong> ({role === 'teacher' ? '@jru.edu' : '@my.jru.edu'})
        </span>
      </button>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          New to the JRU Learning Community?{' '}
          <button
            type="button"
            id="btn-switch-to-signup"
            onClick={onSwitchToSignUp}
            className="font-bold text-blue-900 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Create student or faculty account
          </button>
        </p>
      </div>
    </form>
  );
};