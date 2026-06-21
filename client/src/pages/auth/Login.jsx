import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Logo from '../../components/Logo';
import {
  Mail,
  Lock,
  Loader2,
  Chrome,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import axiosInstance from '../../utils/axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { theme, toggleTheme } = useThemeStore();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Custom dropdown state
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const res = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, user } = res.data.data;
      setSession(accessToken, user);

      // Redirect to respective dashboard
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      else if (user.role === 'STUDENT') navigate('/student/dashboard');
      else if (user.role === 'PARENT') navigate('/parent/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async (mockRoleToken) => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await axiosInstance.post('/auth/google', { token: mockRoleToken });
      const { accessToken, user } = res.data.data;
      setSession(accessToken, user);

      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      else if (user.role === 'STUDENT') navigate('/student/dashboard');
      else if (user.role === 'PARENT') navigate('/parent/dashboard');
    } catch (err) {
      setError('Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const roles = [
    { key: 'ADMIN', label: 'Admin' },
    { key: 'TEACHER', label: 'Teacher' },
    { key: 'STUDENT', label: 'Student' },
    { key: 'PARENT', label: 'Parent' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      
      {/* LEFT PANEL: Large Logo & Illustration Mockup */}
      <div className="hidden md:flex md:w-1/2 bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12 text-white">
        
        {/* Animated Light effects / Mesh Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-dark-gradient -z-10" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#4338CA]/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#14B8A6]/20 rounded-full blur-[100px] animate-pulse" />

        {/* Top Header Logo */}
        <div>
          <Logo size="lg" className="text-white" />
        </div>

        {/* Left Center Content Illustration */}
        <div className="my-auto space-y-8 max-w-lg">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              The Smart Way to <br />
              <span className="text-campus-gradient">Manage Your Campus.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Experience CampusFlow's ERP environment with real-time analytics, grade heatmaps, contactless QR attendance logging, and an integrated AI assistant.
            </p>
          </div>

          {/* Graphical Mockup Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4 relative overflow-hidden bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold tracking-wider">CAMPUSFLOW ERP</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#14B8A6]/20 text-[#14B8A6]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">AI Predictor</p>
                    <p className="text-[10px] text-slate-400">Class GPA forecast</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#14B8A6]">94.2% Success</span>
              </div>
              
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-campus-gradient h-full w-[85%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-slate-500 text-xs">
          © {new Date().getFullYear()} CampusFlow System Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Glass Login Card Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
        
        {/* Dynamic Background Orbs for Light/Dark mode */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-[80px] dark:bg-[#4338CA]/5 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-[80px] dark:bg-[#14B8A6]/5 pointer-events-none" />

        {/* Theme switcher floating top-right */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/5 rounded-2xl shadow-sm text-slate-500 dark:text-slate-400 hover:text-[#4338CA] dark:hover:text-[#14B8A6] transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <div className="w-full max-w-md space-y-6 z-10">
          
          {/* Mobile Brand Logo */}
          <div className="md:hidden flex justify-center mb-2">
            <Logo size="lg" />
          </div>

          <div className="glass-card p-8 border border-white/20 dark:border-white/5 shadow-2xl relative">
            <div className="space-y-1.5 mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                Sign In to portal
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Enter your credentials to enter ERP system
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Custom Dropdown Role Selector */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Access Role</label>
                <div>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/40 dark:bg-[#0f172a]/60 border border-[#E2E8F0] dark:border-white/5 text-[#0F172A] dark:text-[#F8FAFC] text-sm outline-none transition-all hover:shadow-glow duration-300 font-semibold"
                  >
                    <span>{roles.find(r => r.key === selectedRole)?.label}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/10 shadow-xl overflow-hidden">
                      {roles.map((roleOption) => (
                        <div
                          key={roleOption.key}
                          onClick={() => {
                            setSelectedRole(roleOption.key);
                            setDropdownOpen(false);
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 ${
                            selectedRole === roleOption.key
                              ? 'bg-campus-gradient text-white font-bold'
                              : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {roleOption.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    {...register('email')}
                    className="glass-input pl-10 text-sm"
                    placeholder="name@university.edu"
                  />
                </div>
                {errors.email && (
                  <span className="text-red-500 text-[10px] font-semibold">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#4338CA] dark:text-[#14B8A6] hover:underline font-semibold">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    {...register('password')}
                    className="glass-input pl-10 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <span className="text-red-500 text-[10px] font-semibold">{errors.password.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 btn-primary flex items-center justify-center gap-2 text-sm font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-1/2 border-t border-[#E2E8F0] dark:border-white/5 z-0"></span>
              <span className="relative bg-white dark:bg-[#111827] px-3 text-[10px] text-slate-400 dark:text-slate-500 z-10 font-bold tracking-wider">
                DEVELOPMENT SIMULATOR LOGINS
              </span>
            </div>

            {/* Quick Mock Login Roles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGoogleLogin('mock-admin-token')}
                disabled={googleLoading}
                className="px-2 py-2.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-white/5 hover:border-[#4338CA] text-slate-700 dark:text-slate-300 hover:text-[#4338CA] dark:hover:text-[#14B8A6] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Chrome className="h-3.5 w-3.5 text-red-500" />
                Admin
              </button>
              <button
                onClick={() => handleGoogleLogin('mock-teacher-token')}
                disabled={googleLoading}
                className="px-2 py-2.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-white/5 hover:border-[#4338CA] text-slate-700 dark:text-slate-300 hover:text-[#4338CA] dark:hover:text-[#14B8A6] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Chrome className="h-3.5 w-3.5 text-yellow-500" />
                Teacher
              </button>
              <button
                onClick={() => handleGoogleLogin('mock-student-token')}
                disabled={googleLoading}
                className="px-2 py-2.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-white/5 hover:border-[#4338CA] text-slate-700 dark:text-slate-300 hover:text-[#4338CA] dark:hover:text-[#14B8A6] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Chrome className="h-3.5 w-3.5 text-blue-500" />
                Student
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
