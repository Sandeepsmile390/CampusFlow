import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import {
  Users,
  GraduationCap,
  FolderTree,
  BookOpen,
  ClipboardCheck,
  IndianRupee,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const COLORS = ['#4338CA', '#14B8A6', '#38BDF8', '#312e81', '#0d9488', '#0284c7'];

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await axiosInstance.get('/analytics/dashboard/admin');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3">
        <AlertTriangle className="h-6 w-6" />
        <div>
          <h3 className="font-bold">Error loading dashboard</h3>
          <p className="text-sm">{error.message || 'Failed to retrieve analytics data from server.'}</p>
        </div>
      </div>
    );
  }

  const { kpis, charts } = dashboardData;

  const cardStats = [
    { name: 'Total Students', value: kpis.totalStudents, change: '+4.2%', icon: Users, color: 'text-[#14B8A6] bg-[#14B8A6]/10' },
    { name: 'Total Teachers', value: kpis.totalTeachers, change: 'Stable', icon: GraduationCap, color: 'text-[#4338CA] bg-[#4338CA]/10' },
    { name: 'Average Attendance', value: `${kpis.attendanceRate}%`, change: '+1.5%', icon: ClipboardCheck, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Fees Collected', value: `₹${kpis.totalCollected.toLocaleString()}`, change: `₹${kpis.totalPending.toLocaleString()} pending`, icon: IndianRupee, color: 'text-sky-500 bg-sky-500/10' },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Top Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-dark-gradient text-white p-8 shadow-xl border border-white/5">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#4338CA]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Good Morning 👋</h1>
            <p className="text-slate-300 text-sm max-w-lg">Manage your campus efficiently. Here are the latest analytics, course collections, and KPI metrics.</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center text-xs font-bold text-[#14B8A6] bg-[#14B8A6]/10 px-3.5 py-2 rounded-xl border border-[#14B8A6]/20">
            <TrendingUp className="h-4 w-4" />
            <span>Syncing Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card flex items-center justify-between p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{stat.name}</span>
                <p className="text-3xl font-display font-bold">{stat.value}</p>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <span className={stat.change.includes('+') ? 'text-emerald-500' : ''}>{stat.change}</span>
                  <span>this semester</span>
                </div>
              </div>
              <div className={`p-3.5 rounded-2xl ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends Area Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Attendance Trends</h3>
            <span className="text-xs text-slate-400 font-medium">Monthly rates</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.attendanceTrends}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4338CA" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4338CA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1}/>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11}/>
                <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]}/>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Statistics Bar Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Department Statistics</h3>
            <span className="text-xs text-slate-400 font-medium font-semibold">Student enrollments</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1}/>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11}/>
                <YAxis stroke="#64748b" fontSize={11}/>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="students" fill="#14B8A6" radius={[8, 8, 0, 0]}>
                  {charts.departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Pie Chart */}
        <div className="glass-card lg:col-span-1 flex flex-col justify-between p-6">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Grade Distribution</h3>
            <span className="text-xs text-slate-400 font-medium">Active semester assignments</span>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Progress Bar Chart */}
        <div className="glass-card lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Fee Collections</h3>
            <span className="text-xs text-slate-400 font-medium">Collected vs Outstanding</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.feeCollection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1}/>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11}/>
                <YAxis stroke="#64748b" fontSize={11}/>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="collected" name="Paid Invoices ($)" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending Invoices ($)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
