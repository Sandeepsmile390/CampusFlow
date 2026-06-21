import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import Logo from '../../components/Logo';
import axiosInstance from '../../utils/axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { theme, toggleTheme } = useThemeStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword || !token) {
      setError('Invalid request. Reset token is missing.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-[80px] dark:bg-[#4338CA]/5 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-[80px] dark:bg-[#14B8A6]/5 pointer-events-none" />

      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/5 rounded-2xl shadow-sm text-slate-500 dark:text-slate-400 hover:text-[#4338CA] dark:hover:text-[#14B8A6] transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Header Logo */}
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>

        <div className="glass-card p-8 border border-white/20 dark:border-white/5 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/login" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-[#4338CA] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Set New Password</h1>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Password Updated</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Your password has been changed successfully. You can now log in with your new credentials.
              </p>
              <Link to="/login" className="block w-full btn-primary text-center">
                Login Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="glass-input pl-10 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="glass-input pl-10 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 text-sm font-bold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
