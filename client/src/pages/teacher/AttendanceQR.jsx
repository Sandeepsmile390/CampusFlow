import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { QrCode, BookOpen, Clock, Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

export default function AttendanceQR() {
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);

  // Fetch teacher schedules to get courses
  const { data: schedules } = useQuery({
    queryKey: ['teacherSchedules', user.profile?.id],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules', { params: { teacherId: user.profile?.id } });
      return res.data.data;
    }
  });

  const teacherCourses = schedules ? Array.from(new Map(schedules.map(s => [s.course?.id, s.course])).values()) : [];

  useEffect(() => {
    if (teacherCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(teacherCourses[0].id);
    }
  }, [teacherCourses, selectedCourse]);

  // Handle automatic rotation of token
  const fetchNewQR = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post('/attendance/qr/generate', { courseId: selectedCourse });
      setQrToken(res.data.data.qrToken);
      setTimeLeft(60);
    } catch (err) {
      console.error('Failed to generate QR token:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchNewQR();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (!qrToken) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchNewQR(); // Rotate token
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrToken, selectedCourse]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">QR Attendance Generator</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Project a real-time signed QR Code. Students scan to log check-ins instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-lg">Active Course</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select the current lecture. The generated code signs your session details with a 60-second validity window.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Class Lecture Subject</label>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="glass-select text-xs w-full py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="glass-select-option">Select course</option>
                {teacherCourses.map(c => (
                  <option key={c.id} value={c.id} className="glass-select-option">{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {qrToken && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Code Rotation</span>
                <span>{timeLeft}s remaining</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-teal transition-all duration-1000" style={{ width: `${(timeLeft / 60) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* QR Visual Projector */}
        <div className="lg:col-span-2 glass-card flex flex-col items-center justify-center p-8 space-y-6 min-h-[400px] border-glow">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/20 dark:border-slate-800/40 flex items-center justify-center h-76 w-76">
                <Skeleton className="h-64 w-64 rounded-xl" />
              </div>
              <Skeleton className="h-5 w-32 mt-4" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          ) : qrToken ? (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Screen Frame */}
              <div className="relative p-6 bg-white rounded-3xl shadow-xl shadow-black/10 border-2 border-brand-indigo/30 flex items-center justify-center">
                {/* Scanner corners */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-brand-indigo rounded-tl"></div>
                <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-brand-indigo rounded-tr"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-brand-indigo rounded-bl"></div>
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-brand-indigo rounded-br"></div>
                
                {/* Simulated Complex QR Code block */}
                <div className="h-64 w-64 bg-slate-950 flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-center">
                  <QrCode className="h-32 w-32 text-white animate-pulse" />
                  <span className="text-[8px] font-mono text-slate-500 max-w-[200px] truncate">{qrToken}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-teal font-bold bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>LIVENESS ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="font-bold text-lg">Scan this QR Code</p>
                <p className="text-xs text-slate-400">Open student dashboard on mobile browser to scan and sign check-in.</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Select a course to project the class check-in QR Code.</p>
          )}
        </div>

      </div>

    </div>
  );
}
