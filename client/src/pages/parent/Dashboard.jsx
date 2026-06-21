import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { Users, GraduationCap, ClipboardCheck, IndianRupee, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const children = user.profile?.students || [];
  
  // Active selected child state
  const [selectedChildId, setSelectedChildId] = useState('');

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Fetch selected child performance details
  const { data: perfRes, isLoading: perfLoading } = useQuery({
    queryKey: ['childPerformance', selectedChildId],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/students/${selectedChildId}/performance`);
      return res.data.data;
    }
  });

  // Fetch child invoices
  const { data: feesRes } = useQuery({
    queryKey: ['childFees', selectedChildId],
    enabled: !!selectedChildId,
    queryFn: async () => {
      const res = await axiosInstance.get('/fees', { params: { studentId: selectedChildId } });
      return res.data.data;
    }
  });

  if (children.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        No registered children linked to your parent account in database.
      </div>
    );
  }

  const activeChild = children.find(c => c.id === selectedChildId);
  const pendingFeeInvoice = feesRes?.find(f => f.status === 'PENDING');
  const attendanceRate = perfRes?.attendancePercentage || '100';
  const isDebarredWarning = parseFloat(attendanceRate) < 75;

  return (
    <div className="space-y-8">
      
      {/* Header child switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Parent Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor academic progression, attendance rates, and billing invoices.</p>
        </div>

        {children.length > 1 && (
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold"
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Warnings */}
      {isDebarredWarning && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
          ⚠️ <strong>Debarred Warning:</strong> Your child's class attendance ({attendanceRate}%) has fallen below the mandatory 75% requirement.
        </div>
      )}

      {/* Progress Cards */}
      {perfLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card flex items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Child's Name</span>
              <p className="text-xl font-bold">{activeChild?.name}</p>
              <p className="text-[10px] text-slate-400">Roll: {activeChild?.rollNumber}</p>
            </div>
            <div className="p-3.5 rounded-xl text-brand-500 bg-brand-500/10">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Cumulative CGPA</span>
              <p className="text-2xl font-display font-extrabold">{perfRes?.cgpa} / 10.0</p>
              <p className="text-[10px] text-slate-400">Stable progression</p>
            </div>
            <div className="p-3.5 rounded-xl text-purple-500 bg-purple-500/10">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Overall Attendance</span>
              <p className="text-2xl font-display font-extrabold text-emerald-500">{attendanceRate}%</p>
              <p className="text-[10px] text-slate-400">{isDebarredWarning ? 'Action Required' : 'Compliant status'}</p>
            </div>
            <div className="p-3.5 rounded-xl text-emerald-500 bg-emerald-500/10">
              <ClipboardCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between p-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Fees Status</span>
              <p className="text-2xl font-display font-extrabold">{pendingFeeInvoice ? 'Pending Invoice' : 'Settled'}</p>
              <p className="text-[10px] text-slate-400">{pendingFeeInvoice ? `₹${pendingFeeInvoice.amount} outstanding` : 'Receipts cleared'}</p>
            </div>
            <div className="p-3.5 rounded-xl text-yellow-500 bg-yellow-500/10">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Roster of subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Subject Performances */}
        <div className="lg:col-span-2 glass-card space-y-4">
          <h3 className="font-bold text-lg">Curriculum Grades Breakdown</h3>
          {perfRes?.subjectWisePerformance?.length > 0 ? (
            <div className="space-y-3">
              {perfRes.subjectWisePerformance.map((subj, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/10 rounded-xl text-sm">
                  <div>
                    <span className="font-semibold text-xs text-slate-400">{subj.code}</span>
                    <p className="font-bold text-sm mt-0.5">{subj.name}</p>
                  </div>
                  <span className="font-display font-extrabold text-brand-400 text-lg">{subj.gpa} / 10.0</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-slate-400 text-sm">No grading scores resolved yet.</p>
          )}
        </div>

        {/* Right: Reminders & Exam Dates */}
        <div className="lg:col-span-1 glass-card space-y-4">
          <h3 className="font-bold text-lg">Academics Calendar</h3>
          <div className="space-y-3">
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <span className="text-[10px] text-brand-400 font-bold uppercase font-sans">Sem Exam</span>
              <p className="font-bold text-xs mt-0.5">End Semester Evaluations</p>
              <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-400 font-medium">
                <Clock className="h-3 w-3" /> Starts Dec 10th, 2026
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
