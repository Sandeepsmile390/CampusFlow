import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { Check, X, Clock, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { SkeletonTable } from '../../components/Skeleton';

export default function AttendanceMark() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentsList, setStudentsList] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch teacher schedules to get courses
  const { data: schedules } = useQuery({
    queryKey: ['teacherSchedules', user.profile?.id],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules', { params: { teacherId: user.profile?.id } });
      return res.data.data;
    }
  });

  // Unique courses for this teacher
  const teacherCourses = schedules ? Array.from(new Map(schedules.map(s => [s.course?.id, s.course])).values()) : [];

  // Automatically select first course
  useEffect(() => {
    if (teacherCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(teacherCourses[0].id);
    }
  }, [teacherCourses, selectedCourse]);

  // Fetch student roster when course changes
  const { data: studentsRes, isLoading: studentsLoading } = useQuery({
    queryKey: ['rosterStudents', selectedCourse],
    enabled: !!selectedCourse,
    queryFn: async () => {
      // Find course details to filter students by department and semester
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

  // Populate local state to manage changes before submission
  useEffect(() => {
    if (studentsRes) {
      setStudentsList(
        studentsRes.map(s => ({
          studentId: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          status: 'PRESENT' // default state
        }))
      );
    }
  }, [studentsRes]);

  const markMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/attendance/mark', data),
    onSuccess: (res) => {
      setSuccessMsg(res.data.message || 'Attendance saved successfully.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to save attendance.');
      setSuccessMsg('');
    }
  });

  const toggleStatus = (studentId, status) => {
    setStudentsList(prev =>
      prev.map(s => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleSaveAttendance = () => {
    markMutation.mutate({
      courseId: selectedCourse,
      date: attendanceDate,
      records: studentsList.map(s => ({ studentId: s.studentId, status: s.status }))
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Manual Attendance Entry</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Mark student attendance registries manually by selecting lectures.</p>
      </div>

      {/* Select Course & Date panel */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="glass-select text-xs w-full py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {teacherCourses.map(c => (
              <option key={c.id} value={c.id} className="glass-select-option">{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="h-5 w-5 text-slate-400" />
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="glass-input text-xs w-full py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <Check className="h-5 w-5" /> <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <X className="h-5 w-5" /> <span>{errorMsg}</span>
        </div>
      )}

      {/* Students list */}
      <div className="glass-card overflow-hidden">
        {studentsLoading ? (
          <SkeletonTable rows={5} cols={3} />
        ) : studentsList.length > 0 ? (
          <div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th className="text-center">Status Toggles</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map(s => (
                  <tr key={s.studentId} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                    <td className="font-semibold text-brand-400">{s.rollNumber}</td>
                    <td>{s.name}</td>
                    <td className="flex items-center justify-center gap-2 py-4">
                      {/* Present */}
                      <button
                        onClick={() => toggleStatus(s.studentId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          s.status === 'PRESENT'
                            ? 'bg-emerald-500 text-white border-glow shadow-md shadow-emerald-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" /> Present
                      </button>
                      
                      {/* Absent */}
                      <button
                        onClick={() => toggleStatus(s.studentId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          s.status === 'ABSENT'
                            ? 'bg-red-500 text-white border-glow shadow-md shadow-red-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <X className="h-3.5 w-3.5" /> Absent
                      </button>

                      {/* Late */}
                      <button
                        onClick={() => toggleStatus(s.studentId, 'LATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          s.status === 'LATE'
                            ? 'bg-yellow-500 text-white border-glow shadow-md shadow-yellow-500/10'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" /> Late
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end p-6 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleSaveAttendance}
                disabled={markMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {markMutation.isPending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                <span>Submit Attendance</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            No students enrolled under the department/semester of this course.
          </div>
        )}
      </div>

    </div>
  );
}
