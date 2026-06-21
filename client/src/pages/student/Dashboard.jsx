import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { Bot, ClipboardCheck, Clock, IndianRupee, FileText, Loader2, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const studentId = user.profile?.id;

  // Fetch student performance
  const { data: perfRes, isLoading: perfLoading } = useQuery({
    queryKey: ['studentPerformance', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/students/${studentId}/performance`);
      return res.data.data;
    }
  });

  // Fetch active fees
  const { data: feesRes } = useQuery({
    queryKey: ['studentFees', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get('/fees', { params: { studentId } });
      return res.data.data;
    }
  });

  if (perfLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const attendanceRate = perfRes?.attendancePercentage || '100';
  const isDebarredWarning = parseFloat(attendanceRate) < 75;

  const pendingFeeInvoice = feesRes?.find(f => f.status === 'PENDING');

  const cards = [
    { title: 'Cumulative GPA', value: `${perfRes?.cgpa || '8.40'} / 10.0`, sub: 'Excellent Standing', icon: Sparkles, color: 'text-[#4338CA] bg-[#4338CA]/10' },
    { title: 'Total Attendance', value: `${attendanceRate}%`, sub: isDebarredWarning ? 'Warning: Low Attendance' : 'Compliant', icon: ClipboardCheck, color: isDebarredWarning ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Pending Assignments', value: perfRes?.submissionsCount === 0 ? 2 : 1, sub: 'Due shortly', icon: FileText, color: 'text-[#38BDF8] bg-[#38BDF8]/10' },
    { title: 'Fee Balance', value: pendingFeeInvoice ? `₹${pendingFeeInvoice.amount}` : '₹0', sub: pendingFeeInvoice ? 'Due soon' : 'All Paid', icon: IndianRupee, color: pendingFeeInvoice ? 'text-amber-500 bg-amber-500/10' : 'text-[#14B8A6] bg-[#14B8A6]/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-dark-gradient text-white p-8 shadow-xl border border-white/5">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#4338CA]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Good Morning 👋</h1>
          <p className="text-slate-300 text-sm max-w-md">Welcome back, {user.profile?.name || 'Student'}. Manage your courses, view grades, and check timetables efficiently.</p>
        </div>
      </div>

      {/* Warnings */}
      {isDebarredWarning && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <span>⚠️ Debarred Warning: Your attendance is below the university-mandated 75% threshold.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card flex items-center justify-between p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">{card.title}</span>
                <p className="text-2xl font-display font-bold">{card.value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{card.sub}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject performance comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Chart */}
        <div className="glass-card lg:col-span-2 p-6">
          <h3 className="font-bold text-lg mb-6">Subject Performance Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfRes?.subjectWisePerformance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1}/>
                <XAxis dataKey="code" stroke="#64748b" fontSize={11}/>
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 10]}/>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}/>
                <Bar dataKey="gpa" name="Grade Point (out of 10)" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming events calendar */}
        <div className="glass-card lg:col-span-1 space-y-4 p-6">
          <h3 className="font-bold text-lg">Upcoming Schedules</h3>
          <div className="space-y-3">
            <div className="p-4 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-2xl">
              <span className="text-[10px] text-[#14B8A6] font-bold uppercase tracking-wider">Exam retest</span>
              <p className="font-bold text-sm mt-0.5">Operating Systems Midterm</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Dec 8th at 10:00 AM | LH-102</span>
              </div>
            </div>
            
            <div className="p-4 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl">
              <span className="text-[10px] text-[#4338CA] font-bold uppercase tracking-wider">Lab Viva</span>
              <p className="font-bold text-sm mt-0.5">Database Systems Lab Exam</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Dec 12th at 2:00 PM | DBMS Lab</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
