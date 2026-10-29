import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Check, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../utils/Session';

// Shown when someone opens the link from the reset email: /?reset_token=...&email=...
export const ResetPasswordView = ({ token, email, onDone, onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const matches = password.length > 0 && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasNumber) {
      setError('Password must be at least 8 characters and include a number.');
      return;
    }
    if (!matches) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: confirm,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.errors ? Object.values(data.errors).flat().join(' ') : data.message || 'Could not reset the password.'
        );
      }

      setSuccess(true);
      onDone?.();
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div id="jru-reset-password-success" className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-blue-950">Password changed</h3>
        <p className="text-xs text-slate-600">You were signed out of all devices. Sign in with your new password.</p>
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <form id="jru-reset-password-view" onSubmit={handleSubmit} className="space-y-3.5">
      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:text-amber-600 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sign In</span>
      </button>

      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-blue-950">Choose a new password</h2>
        <p className="text-xs text-slate-500">
          For <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="reset-new-password" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          New password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <input
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="reset-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Confirm new password
        </label>
        <input
          id="reset-confirm-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-50/70 hover:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-blue-900 focus:bg-white"
        />
      </div>

      <ul className="text-[11px] text-slate-500 space-y-0.5">
        {[
          [hasMinLength, 'At least 8 characters'],
          [hasNumber, 'Includes a number'],
          [matches, 'Both passwords match'],
        ].map(([ok, label]) => (
          <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600' : ''}`}>
            <Check className={`w-3 h-3 ${ok ? '' : 'opacity-30'}`} />
            {label}
          </li>
        ))}
      </ul>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-blue-950 font-bold text-sm tracking-wide uppercase rounded-xl shadow-md transition-all duration-200 cursor-pointer border border-amber-300 disabled:opacity-60"
      >
        {isLoading ? 'Saving...' : 'Change Password'}
      </button>
    </form>
  );
};