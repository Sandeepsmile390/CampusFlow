import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Users, ClipboardCheck, Clock, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const teacherId = user.profile?.id;

  // Fetch teacher schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['teacherSchedules', teacherId],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules', { params: { teacherId } });
      return res.data.data;
    }
  });

  // Fetch courses to count assignments/students
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Workload details
  const totalClasses = schedules?.length || 0;
  const uniqueCourses = [...new Set(schedules?.map(s => s.courseId))].length;

  const cards = [
    { title: 'Assigned Classes', value: totalClasses, icon: BookOpen, color: 'text-[#4338CA] bg-[#4338CA]/10' },
    { title: 'Total Student Scope', value: uniqueCourses * 45 || 45, icon: Users, color: 'text-[#14B8A6] bg-[#14B8A6]/10' },
    { title: 'Pending Gradings', value: 3, icon: FileSpreadsheet, color: 'text-[#38BDF8] bg-[#38BDF8]/10' },
    { title: 'Classes Today', value: 2, icon: Clock, color: 'text-emerald-500 bg-emerald-500/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-dark-gradient text-white p-8 shadow-xl border border-white/5">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#4338CA]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Good Morning 👋</h1>
          <p className="text-slate-300 text-sm max-w-md">Welcome back, {user.profile?.name || 'Professor'}. Manage schedules, verify grade inputs, and generate class reports.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card flex items-center justify-between p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">{card.title}</span>
                <p className="text-3xl font-display font-bold">{card.value}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Schedule Timetable */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-6">Weekly Lecture Timetable</h3>
        
        {schedules && schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Subject Code</th>
                  <th>Course Name</th>
                  <th>Lecture Slot</th>
                  <th>Lecture Room</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(slot => (
                  <tr key={slot.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                    <td className="font-bold text-[#4338CA] dark:text-[#14B8A6]">{slot.dayOfWeek}</td>
                    <td className="font-semibold">{slot.course?.code}</td>
                    <td>{slot.course?.name}</td>
                    <td className="font-mono text-xs text-slate-400">{slot.startTime} - {slot.endTime}</td>
                    <td className="font-semibold">{slot.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-10 text-slate-400 text-sm">No courses or lectures mapped for this faculty account.</p>
        )}
      </div>

    </div>
  );
}
