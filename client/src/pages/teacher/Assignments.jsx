import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { Plus, Check, FileText, Calendar, BookOpen, X, Loader2, MessageSquare } from 'lucide-react';
import { SkeletonList } from '../../components/Skeleton';

export default function Assignments() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [createModal, setCreateModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Forms
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', courseId: '', filePath: '' });
  const [gradingForm, setGradingForm] = useState({ grade: '', feedback: '' });

  // Fetch teacher schedules to get courses
  const { data: schedules } = useQuery({
    queryKey: ['teacherSchedules', user.profile?.id],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/schedules', { params: { teacherId: user.profile?.id } });
      return res.data.data;
    }
  });

  const teacherCourses = schedules ? Array.from(new Map(schedules.map(s => [s.course?.id, s.course])).values()) : [];

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacherAssignments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/assignments');
      return res.data.data;
    }
  });

  // Fetch submissions for a specific assignment
  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ['assignmentSubmissions', selectedAssignment?.id],
    enabled: !!selectedAssignment,
    queryFn: async () => {
      const res = await axiosInstance.get(`/assignments/submissions/${selectedAssignment.id}`);
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherAssignments']);
      setCreateModal(false);
      setNewAssignment({ title: '', description: '', deadline: '', courseId: '', filePath: '' });
    }
  });

  const gradeMutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/assignments/submissions/${selectedSubmission.id}/grade`, data),
    onSuccess: () => {
      refetchSubmissions();
      setGradeModal(false);
      setGradingForm({ grade: '', feedback: '' });
      setSelectedSubmission(null);
    }
  });

  const handleOpenSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleOpenGrade = (sub) => {
    setSelectedSubmission(sub);
    setGradingForm({ grade: sub.grade || '', feedback: sub.feedback || '' });
    setGradeModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Assignment Grading</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Publish assignments, track student uploads, and log grades.</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Publish Assignment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Assignments List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg">Active Assignments</h3>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : assignments?.length > 0 ? (
            assignments.map(ass => (
              <div
                key={ass.id}
                onClick={() => handleOpenSubmissions(ass)}
                className={`p-4 rounded-2xl glass-panel cursor-pointer hover:border-brand-500/40 transition-all ${
                  selectedAssignment?.id === ass.id ? 'border-brand-500/50 bg-brand-500/5' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full font-bold">
                    {ass.course?.code}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Due: {new Date(ass.deadline).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-sm truncate">{ass.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ass.description}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No assignments posted.</p>
          )}
        </div>

        {/* Right: Submissions details list */}
        <div className="lg:col-span-2 glass-card min-h-[400px] flex flex-col">
          {selectedAssignment ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                <h3 className="font-bold text-lg">Submissions: {selectedAssignment.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedAssignment.description}</p>
              </div>

              {submissions?.length > 0 ? (
                <div className="overflow-x-auto flex-1">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Roll Number</th>
                        <th>Submitted At</th>
                        <th>Grade</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                          <td className="font-semibold">{sub.student?.name}</td>
                          <td>{sub.student?.rollNumber}</td>
                          <td className="text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className={`font-bold ${sub.grade ? 'text-brand-500' : 'text-slate-500'}`}>
                            {sub.grade || 'Not Graded'}
                          </td>
                          <td className="text-right px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={sub.filePath}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:text-brand-500 text-slate-500"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                              <button onClick={() => handleOpenGrade(sub)} className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 font-semibold">
                                <Check className="h-3 w-3" /> Grade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-sm flex-1 flex items-center justify-center">
                  No student solutions submitted for this assignment yet.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-sm flex-1 flex items-center justify-center">
              Select an assignment on the left to review student submissions.
            </div>
          )}
        </div>

      </div>

      {/* Publish Assignment Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand-500" /> Publish Assignment
              </h3>
              <button onClick={() => setCreateModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Class Course</label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                  className="glass-input text-xs py-2"
                >
                  <option value="">Select course</option>
                  {teacherCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Assignment Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="DBMS Lab Task 3"
                  className="glass-input text-xs py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Instructions / Description</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Design Normal Form structures..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs outline-none text-white focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Deadline Date</label>
                  <input
                    type="date"
                    value={newAssignment.deadline}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, deadline: e.target.value }))}
                    className="glass-input text-xs py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Mock PDF File Link</label>
                  <input
                    type="text"
                    value={newAssignment.filePath}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, filePath: e.target.value }))}
                    placeholder="Cloudinary Link"
                    className="glass-input text-xs py-2"
                  />
                </div>
              </div>
              <button
                onClick={() => createMutation.mutate(newAssignment)}
                className="w-full btn-primary text-xs py-2.5"
              >
                Publish Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-500" /> Grade Submission
              </h3>
              <button onClick={() => setGradeModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Grade submission for student <strong>{selectedSubmission?.student?.name}</strong>.</p>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Letter Grade</label>
                <select
                  value={gradingForm.grade}
                  onChange={(e) => setGradingForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="glass-input text-xs py-2"
                >
                  <option value="">Select Grade</option>
                  {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Constructive Feedback</label>
                <textarea
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Add feedback notes..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs outline-none text-white focus:border-brand-500"
                />
              </div>

              <button
                onClick={() => gradeMutation.mutate(gradingForm)}
                className="w-full btn-primary text-xs py-2.5"
              >
                Submit Grade & Comments
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
