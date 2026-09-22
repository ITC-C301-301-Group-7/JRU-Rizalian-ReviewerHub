import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, LifeBuoy, Check } from 'lucide-react';
import { formatJruId, isJruIdValid, getJruIdValidationError } from '../utils/idValidation';

export const ForgotPasswordView = ({ onBackToLogin }) => {
  const [emailOrId, setEmailOrId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIdentifierChange = (val) => {
    if (!val.includes('@') && /^[0-9-]*$/.test(val)) {
      setEmailOrId(formatJruId(val));
    } else {
      setEmailOrId(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const clean = emailOrId.trim();
    if (!clean) {
      setError('Please enter your Student ID or JRU Email.');
      return;
    }
    if (!clean.includes('@')) {
      const idError = getJruIdValidationError(clean, 'student');
      if (idError) {
        setError(idError);
        return;
      }
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div id="jru-forgot-password-view" className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          id="btn-back-from-forgot"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:text-amber-600 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </button>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-blue-950">
          Reset Portal Password
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Enter your JRU Student ID or institutional email to receive recovery instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-950">Password Reset Link Sent</h3>
            <p className="text-xs text-slate-600">
              We sent password recovery instructions to the registered inbox for <strong>{emailOrId}</strong>.
            </p>
          </div>
          <div className="text-[11px] text-slate-500 bg-white/80 p-2.5 rounded-xl border border-slate-200">
            Please check your <strong>@my.jru.edu</strong> Google Workspace inbox or spam folder. If you still cannot log in, contact the JRU I.T. Helpdesk.
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl transition-all"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reset-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Student Number or JRU Email
              </label>
              <span className="text-[10px] text-amber-800 font-semibold font-mono bg-yellow-100 px-1.5 py-0.5 rounded-sm border border-yellow-300">
                e.g. 25-260000 (Example)
              </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-900 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reset-email"
                type="text"
                required
                value={emailOrId}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                placeholder="e.g. 25-260000 (Example ID) or student@my.jru.edu"
                className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 hover:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white ${
                  !emailOrId.includes('@') && emailOrId.length > 0
                    ? isJruIdValid(emailOrId)
                      ? 'border-emerald-500 focus:ring-emerald-400 font-mono tracking-wider'
                      : 'border-amber-400 focus:ring-amber-400 font-mono tracking-wider'
                    : 'border-slate-200 focus:ring-amber-400 focus:border-blue-900'
                }`}
              />
              {emailOrId && !emailOrId.includes('@') && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isJruIdValid(emailOrId) ? (
                    <span className="text-emerald-600 flex items-center">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-1 py-0.5 rounded">
                      {emailOrId.length}/9
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Format: 2 digits - 6 digits (e.g. <span className="font-mono font-semibold text-blue-950">25-260000</span> is just an example; 21-, 22-, 23-, 24-, 25- accepted)
            </p>
          </div>

          <button
            type="submit"
            id="btn-send-reset-link"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-blue-950 font-bold text-sm tracking-wide uppercase rounded-xl shadow-md transition-all duration-200 cursor-pointer border border-amber-300"
          >
            {isLoading ? 'Processing Request...' : 'Send Reset Instructions'}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <LifeBuoy className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Need immediate campus assistance? Contact <strong>itc@jru.edu</strong> or visit Tower Building, 3rd Floor.</span>
          </div>
        </form>
      )}
    </div>
  );
};