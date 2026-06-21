import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { Plus, Trash2, Calendar, BookOpen, FolderTree, X, Loader2 } from 'lucide-react';

export default function CourseManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('courses'); // courses, departments, schedules
  
  // Forms state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Form inputs
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', credits: 4, departmentId: '', semester: 1 });
  const [scheduleForm, setScheduleForm] = useState({ courseId: '', teacherId: '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', room: '' });

  // Fetch departments
  const { data: deptsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/departments');
      return res.data.data;
    }
  });

  // Fetch courses
  const { data: coursesRes, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses');
      return res.data.data;
    }
  });

  // Fetch teachers
  const { data: teachersRes } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await axiosInstance.get('/teachers');
      return res.data.data;
    }
  });

  // Fetch schedules
  const { data: schedulesRes } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules');
      return res.data.data;
    }
  });

  // Mutations
  const addDeptMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/courses/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '' });
    }
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/courses/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['departments'])
  });

  const addCourseMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      setShowCourseModal(false);
      setCourseForm({ name: '', code: '', credits: 4, departmentId: '', semester: 1 });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['courses'])
  });

  const addScheduleMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/courses/schedules', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      setShowScheduleModal(false);
      setScheduleForm({ courseId: '', teacherId: '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', room: '' });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/courses/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['schedules'])
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Curriculum & Scheduling</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage courses, department divisions, and weekly timetable structures.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'departments' && (
            <button onClick={() => setShowDeptModal(true)} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Department
            </button>
          )}
          {activeTab === 'courses' && (
            <button onClick={() => setShowCourseModal(true)} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Course
            </button>
          )}
          {activeTab === 'schedules' && (
            <button onClick={() => setShowScheduleModal(true)} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Time Slot
            </button>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800/60">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === 'courses' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === 'departments' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === 'schedules' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'
          }`}
        >
          Timetables
        </button>
      </div>

      {/* Tab Contents */}
      {coursesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="glass-card overflow-hidden">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Credits</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesRes?.map(c => (
                    <tr key={c.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                      <td className="font-semibold text-brand-400">{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.credits} Credits</td>
                      <td>{c.department?.name}</td>
                      <td>Semester {c.semester}</td>
                      <td className="text-right px-6 py-4">
                        <button
                          onClick={() => {
                            if (confirm(`Delete course ${c.name}?`)) deleteCourseMutation.mutate(c.id);
                          }}
                          className="p-1 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="glass-card overflow-hidden">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Department Name</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptsRes?.map(d => (
                    <tr key={d.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                      <td className="font-semibold text-purple-400">{d.code}</td>
                      <td>{d.name}</td>
                      <td className="text-right px-6 py-4">
                        <button
                          onClick={() => {
                            if (confirm(`Delete department ${d.name}?`)) deleteDeptMutation.mutate(d.id);
                          }}
                          className="p-1 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Timetables Tab */}
          {activeTab === 'schedules' && (
            <div className="glass-card overflow-hidden">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    <th>Room</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedulesRes?.map(s => (
                    <tr key={s.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                      <td className="font-semibold text-slate-300">{s.dayOfWeek}</td>
                      <td className="text-xs font-mono">{s.startTime} - {s.endTime}</td>
                      <td className="text-brand-400 font-medium">{s.course?.code}</td>
                      <td>{s.course?.name}</td>
                      <td>{s.teacher?.name}</td>
                      <td className="font-semibold">{s.room}</td>
                      <td className="text-right px-6 py-4">
                        <button
                          onClick={() => {
                            if (confirm(`Delete this slot?`)) deleteScheduleMutation.mutate(s.id);
                          }}
                          className="p-1 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg">Add Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Department Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Civil Engineering"
                  className="glass-input text-xs py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Code</label>
                <input
                  type="text"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="CIVIL"
                  className="glass-input text-xs py-2"
                />
              </div>
              <button
                onClick={() => addDeptMutation.mutate(deptForm)}
                className="w-full btn-primary text-xs py-2.5"
              >
                Save Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg">Add Course Mapping</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Course Code</label>
                <input
                  type="text"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="CSE-304"
                  className="glass-input text-xs py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Course Name</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Computer Networks"
                  className="glass-input text-xs py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Credits</label>
                  <input
                    type="number"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, credits: e.target.value }))}
                    placeholder="4"
                    className="glass-input text-xs py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Semester</label>
                  <input
                    type="number"
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="3"
                    className="glass-input text-xs py-2"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Department</label>
                <select
                  value={courseForm.departmentId}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="glass-input text-xs py-2"
                >
                  <option value="">Select Department</option>
                  {deptsRes?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => addCourseMutation.mutate(courseForm)}
                className="w-full btn-primary text-xs py-2.5"
              >
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Timetable Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg">Add Class Time Slot</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Select Course</label>
                <select
                  value={scheduleForm.courseId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="glass-input text-xs py-2"
                >
                  <option value="">Choose Course</option>
                  {coursesRes?.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Assigned Faculty</label>
                <select
                  value={scheduleForm.teacherId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="glass-input text-xs py-2"
                >
                  <option value="">Choose Faculty</option>
                  {teachersRes?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Day</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="glass-input text-[10px] px-1 py-2"
                  >
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Start Time</label>
                  <input
                    type="text"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                    placeholder="09:00"
                    className="glass-input text-xs py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">End Time</label>
                  <input
                    type="text"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                    placeholder="10:30"
                    className="glass-input text-xs py-2"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Room / Lecture Hall</label>
                <input
                  type="text"
                  value={scheduleForm.room}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="LH-301"
                  className="glass-input text-xs py-2"
                />
              </div>
              <button
                onClick={() => addScheduleMutation.mutate(scheduleForm)}
                className="w-full btn-primary text-xs py-2.5"
              >
                Save Schedule Slot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
