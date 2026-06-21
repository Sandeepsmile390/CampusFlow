import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { ClipboardCheck, QrCode, Camera, Loader2, Calendar, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Attendance() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const studentId = user.profile?.id;

  const [activeTab, setActiveTab] = useState('summary'); // summary, qrCode, faceAuth
  const [qrToken, setQrToken] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Facial recognition states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState(null);

  // Fetch student performance (gives summaries)
  const { data: perfRes, isLoading: perfLoading } = useQuery({
    queryKey: ['studentPerformance', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/students/${studentId}/performance`);
      return res.data.data;
    }
  });

  // Fetch full attendance history
  const { data: historyRes } = useQuery({
    queryKey: ['studentAttendanceHistory', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/attendance/student/${studentId}`);
      return res.data.data;
    }
  });

  // Fetch courses to provide choices in face recognition
  const { data: schedules } = useQuery({
    queryKey: ['studentSchedules'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules');
      return res.data.data;
    }
  });
  const studentCourses = schedules ? Array.from(new Map(schedules.map(s => [s.course?.id, s.course])).values()) : [];

  const [selectedCourseForFace, setSelectedCourseForFace] = useState('');

  // Mutations
  const qrMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/attendance/qr/scan', data),
    onSuccess: (res) => {
      setSuccessMsg(res.data.message);
      setQrToken('');
      queryClient.invalidateQueries(['studentPerformance']);
      queryClient.invalidateQueries(['studentAttendanceHistory']);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Verification failed.');
    }
  });

  const faceMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/attendance/face-recognition', data),
    onSuccess: (res) => {
      setVerificationOutcome({
        status: 'PASSED',
        message: res.data.message,
      });
      queryClient.invalidateQueries(['studentPerformance']);
      queryClient.invalidateQueries(['studentAttendanceHistory']);
    },
    onError: (err) => {
      setVerificationOutcome({
        status: 'FAILED',
        message: err.response?.data?.message || 'Face matched below confidence ratio.',
      });
    }
  });

  const handleQRSubmit = (e) => {
    e.preventDefault();
    if (!qrToken.trim()) return;
    setSuccessMsg('');
    setErrorMsg('');
    qrMutation.mutate({ qrToken });
  };

  const handleFaceScan = () => {
    if (!selectedCourseForFace) {
      alert('Please choose a course lecture slot first.');
      return;
    }
    setVerificationOutcome(null);
    setCameraActive(true);
    setCameraLoading(true);

    // Simulate webcam video feed taking frame capture
    setTimeout(() => {
      setCameraLoading(false);
      
      // Hit face recognition mock endpoint with base64 dummy data
      faceMutation.mutate({
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA...',
        courseId: selectedCourseForFace
      });
    }, 2000);
  };

  if (perfLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#4338CA] dark:text-[#14B8A6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Class Attendance Check-In</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Scan timing QR codes or complete face-matching checks to sign in.</p>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800/60">
        <button onClick={() => setActiveTab('summary')} className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${activeTab === 'summary' ? 'border-[#4338CA] text-[#4338CA] dark:border-[#14B8A6] dark:text-[#14B8A6]' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
          Attendance Summary
        </button>
        <button onClick={() => { setActiveTab('qrCode'); setSuccessMsg(''); setErrorMsg(''); }} className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${activeTab === 'qrCode' ? 'border-[#4338CA] text-[#4338CA] dark:border-[#14B8A6] dark:text-[#14B8A6]' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
          QR Check-in
        </button>
        <button onClick={() => { setActiveTab('faceAuth'); setVerificationOutcome(null); setCameraActive(false); }} className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${activeTab === 'faceAuth' ? 'border-[#4338CA] text-[#4338CA] dark:border-[#14B8A6] dark:text-[#14B8A6]' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
          AI Face Check-in
        </button>
      </div>

      {/* Summary View */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Wise Progress bars */}
          <div className="lg:col-span-2 glass-card p-6 space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Subject Attendance Summary</h3>
            
            <div className="space-y-4">
              {perfRes?.subjectWisePerformance.map((c, i) => {
                // Fetch student performance returns custom rates or mock
                const rate = c.code === 'CSE-301' ? 68 : 84;
                const isUnder = rate < 75;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{c.name} ({c.code})</span>
                      <span className={`font-bold ${isUnder ? 'text-red-500' : 'text-emerald-500'}`}>{rate}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isUnder ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                    {isUnder && (
                      <p className="text-[10px] text-red-500 font-medium">⚠️ Debarred warning: Attendance rate falls below required 75%.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Heatmap grids */}
          <div className="lg:col-span-1 glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white"><Calendar className="h-5 w-5 text-[#4338CA] dark:text-[#14B8A6]" /> Attendance Heatmap</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Each cell represents a calendar date check-in status (Green = Present, Red = Absent, Gray = Weekend/Holiday).</p>
            
            {/* 6x7 grid representing 30 days of the month */}
            <div className="grid grid-cols-7 gap-2.5 max-w-[280px]">
              {Array.from({ length: 28 }).map((_, idx) => {
                let color = 'bg-slate-100 dark:bg-slate-800/65 text-slate-600 dark:text-slate-400'; // Default gray
                
                // Simulate some present/absent boxes
                if ([2, 4, 8, 10, 11, 14, 16, 18, 22, 24, 25].includes(idx)) {
                  color = 'bg-emerald-500 text-white border-glow shadow-md shadow-emerald-500/10';
                } else if ([6, 12, 20].includes(idx)) {
                  color = 'bg-red-500 text-white border-glow shadow-md shadow-red-500/10';
                } else if ([15].includes(idx)) {
                  color = 'bg-yellow-500 text-slate-900 border-glow shadow-md shadow-yellow-500/10';
                }
                
                return (
                  <div key={idx} className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold border border-slate-200/10 ${color}`}>
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance History logs table */}
          <div className="lg:col-span-3 glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#4338CA] dark:text-[#14B8A6]" />
              Attendance History Logs
            </h3>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200/20 dark:border-slate-800/40">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Check-in Method</th>
                    <th>Marked By</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRes && historyRes.length > 0 ? (
                    historyRes.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/10">
                        <td>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">{record.course?.code}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{record.course?.name}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (
                              record.status === 'LATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            )
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200/10 dark:border-slate-800/40">
                            {record.method}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {record.markedBy?.name || 'System / Auto'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs italic">
                        No check-in history records logged for this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scan Input */}
      {activeTab === 'qrCode' && (
        <div className="glass-card max-w-md mx-auto p-8 text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] dark:bg-[#14B8A6]/10 dark:text-[#14B8A6] border border-[#4338CA]/10 dark:border-[#14B8A6]/10">
            <QrCode className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">Signed QR Code Check-in</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Projected QR codes expire in 60 seconds. Paste the signed token below to verify your classroom check-in.
          </p>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5" /> <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" /> <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleQRSubmit} className="space-y-4">
            <input
              type="text"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="Paste signed class QR token..."
              className="glass-input text-xs font-mono"
            />
            <button
              type="submit"
              disabled={qrMutation.isLoading || !qrToken.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2 text-xs py-2.5"
            >
              {qrMutation.isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
              <span>Verify check-in</span>
            </button>
          </form>
        </div>
      )}

      {/* AI Face Recognition webcam simulation */}
      {activeTab === 'faceAuth' && (
        <div className="glass-card max-w-lg mx-auto p-8 space-y-6 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] dark:bg-[#14B8A6]/10 dark:text-[#14B8A6] border border-[#4338CA]/10 dark:border-[#14B8A6]/10">
            <Camera className="h-10 w-10" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Liveness Face Recognition Check-in</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mark your attendance instantly by matching your face against database records.</p>
          </div>

          <div className="space-y-2 text-left max-w-sm mx-auto">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class Lecture Subject</label>
            <select
              value={selectedCourseForFace}
              onChange={(e) => setSelectedCourseForFace(e.target.value)}
              className="glass-select text-xs w-full py-2.5 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="" className="glass-select-option">Select course</option>
              {studentCourses.map(c => (
                <option key={c.id} value={c.id} className="glass-select-option">{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Camera Frame Box */}
          {cameraActive ? (
            <div className="relative h-60 w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-[#4338CA]/40 dark:border-[#14B8A6]/40">
              {cameraLoading ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-10 w-10 animate-spin text-[#14B8A6]" />
                  <span className="text-xs font-mono text-slate-300">Calibrating Anti-spoofing filters...</span>
                </div>
              ) : verificationOutcome ? (
                <div className="p-6 text-center space-y-4">
                  {verificationOutcome.status === 'PASSED' ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400">
                      <CheckCircle className="h-12 w-12" />
                      <h4 className="font-bold">Check-in Signed</h4>
                      <p className="text-xs text-slate-300">{verificationOutcome.message}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-red-400">
                      <ShieldAlert className="h-12 w-12" />
                      <h4 className="font-bold">Liveness Check Failed</h4>
                      <p className="text-xs text-slate-300">{verificationOutcome.message}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setVerificationOutcome(null); setCameraActive(false); }}
                    className="btn-secondary text-xs px-4 py-2 mt-4"
                  >
                    Reset Camera
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <div className="h-44 w-44 rounded-full border-2 border-dashed border-[#4338CA]/50 dark:border-[#14B8A6]/50 flex items-center justify-center animate-pulse">
                    <span className="text-[10px] font-mono text-[#14B8A6]">ALIVE FACE FOCUS</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleFaceScan}
              className="btn-primary text-xs py-2.5 px-6"
            >
              Verify Face & Mark Present
            </button>
          )}
        </div>
      )}

    </div>
  );
}
