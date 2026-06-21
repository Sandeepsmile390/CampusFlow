import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, FileSpreadsheet, Loader2, Sparkles, UserCheck } from 'lucide-react';

export default function Marks() {
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradesRoster, setGradesRoster] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Fetch students enrolled in course department and resolve their performance details
  const { data: studentsRes, isLoading: rosterLoading } = useQuery({
    queryKey: ['rosterStudentsForGrades', selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      const activeCourse = teacherCourses.find(c => c.id === selectedCourse);
      const res = await axiosInstance.get('/students', {
        params: {
          departmentId: activeCourse?.departmentId,
          semester: activeCourse?.semester,
          limit: 100
        }
      });
      return res.data.data;
    }
  });

  // Query performance scores for each student dynamically
  useEffect(() => {
    const resolveStudentsPerformance = async () => {
      if (!studentsRes) return;
      setLoadingDetails(true);
      try {
        const roster = [];
        for (const s of studentsRes) {
          const perf = await axiosInstance.get(`/students/${s.id}/performance`);
          roster.push({
            id: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            cgpa: perf.data.data.cgpa,
            attendance: perf.data.data.attendancePercentage,
            gradedCount: perf.data.data.gradedSubmissionsCount
          });
        }
        setGradesRoster(roster);
      } catch (err) {
        console.error('Failed to resolve grades details:', err.message);
      } finally {
        setLoadingDetails(false);
      }
    };

    resolveStudentsPerformance();
  }, [studentsRes]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Grade Ledger</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review student semester progress, active grade point averages (CGPA), and attendance scores.</p>
      </div>

      {/* Select Course panel */}
      <div className="glass-card flex items-center gap-4 p-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-sm w-full md:w-64"
          >
            {teacherCourses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grades Registry table */}
      <div className="glass-card overflow-hidden">
        {rosterLoading || loadingDetails ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <span className="text-sm text-slate-400">Loading student scores...</span>
          </div>
        ) : gradesRoster.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Attendance Rate</th>
                  <th>Submissions Graded</th>
                  <th>Semester CGPA</th>
                  <th>Academic Standing</th>
                </tr>
              </thead>
              <tbody>
                {gradesRoster.map(s => {
                  const debarred = parseFloat(s.attendance) < 75;
                  const excellent = parseFloat(s.cgpa) >= 8.5;
                  return (
                    <tr key={s.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                      <td className="font-bold text-brand-400">{s.rollNumber}</td>
                      <td className="font-semibold">{s.name}</td>
                      <td>
                        <span className={`font-semibold ${debarred ? 'text-red-500' : 'text-slate-200'}`}>
                          {s.attendance}%
                        </span>
                        {debarred && <span className="text-[10px] ml-2 text-red-500 uppercase tracking-widest font-bold font-sans">Low Attendance</span>}
                      </td>
                      <td>{s.gradedCount} assignments</td>
                      <td className="font-display font-extrabold text-sm">{s.cgpa} / 10.0</td>
                      <td className="py-4">
                        {excellent ? (
                          <span className="text-[10px] px-2.5 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                            <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} /> Outstanding
                          </span>
                        ) : debarred ? (
                          <span className="text-[10px] px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold uppercase tracking-wider w-fit">
                            Debarred Warning
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                            <UserCheck className="h-3 w-3" /> Satisfactory
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            No students found enrolled under this course.
          </div>
        )}
      </div>

    </div>
  );
}
