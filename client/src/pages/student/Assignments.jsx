import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { BookOpen, FileText, Upload, Calendar, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function Assignments() {
  const queryClient = useQueryClient();
  const [submitModal, setSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [fileUrl, setFileUrl] = useState('');

  // Fetch student assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/assignments');
      return res.data.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/assignments/${selectedAssignment.id}/submit`, { filePath: data.filePath }),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentAssignments']);
      setSubmitModal(false);
      setFileUrl('');
      setSelectedAssignment(null);
    }
  });

  const handleOpenSubmit = (ass) => {
    setSelectedAssignment(ass);
    setSubmitModal(true);
  };

  const handlePostSubmission = (e) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;
    submitMutation.mutate({ filePath: fileUrl });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Active Assignments</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Download prompts, submit solutions, and review faculty feedback.</p>
      </div>

      {/* Grid of assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl col-span-2"></div>
        ) : assignments?.length > 0 ? (
          assignments.map((ass) => {
            const hasSubmitted = ass.submissions?.length > 0;
            const sub = hasSubmitted ? ass.submissions[0] : null;
            const isGraded = !!sub?.grade;

            return (
              <div key={ass.id} className="glass-card flex flex-col justify-between p-6 relative hover:scale-[1.02] transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 bg-brand-50/10 dark:bg-[#14B8A6]/10 text-[#4338CA] dark:text-[#14B8A6] border border-[#4338CA]/20 dark:border-[#14B8A6]/20 rounded-full font-bold uppercase">
                      {ass.course?.code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isGraded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (
                        hasSubmitted ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      )
                    }`}>
                      {isGraded ? `Graded: ${sub.grade}` : (hasSubmitted ? 'Submitted' : 'Pending')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ass.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{ass.description}</p>
                  </div>

                  {/* Submission Info / Feedback */}
                  {sub && (
                    <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">My Solution File Link</p>
                      <a href={sub.filePath} target="_blank" rel="noreferrer" className="text-xs text-[#4338CA] dark:text-[#14B8A6] hover:underline font-mono truncate block">
                        {sub.filePath}
                      </a>
                      
                      {isGraded && (
                        <div className="pt-2 mt-2 border-t border-slate-200/20 dark:border-slate-800/40 space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feedback Comments</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{sub.feedback}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                    <Calendar className="h-3.5 w-3.5" /> Due: {new Date(ass.deadline).toLocaleDateString()}
                  </span>
                  
                  {!isGraded && (
                    <button
                      onClick={() => handleOpenSubmit(ass)}
                      className="btn-secondary text-[11px] px-3.5 py-1.5 flex items-center gap-1.5 font-bold"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{hasSubmitted ? 'Resubmit' : 'Submit Solution'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-20 text-slate-400">
            No assignments listed for this semester.
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-brand-500" /> Submit Solution
              </h3>
              <button onClick={() => setSubmitModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handlePostSubmission} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Mock Solution Link / Cloudinary PDF URL</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/demo/image/upload/solution.pdf"
                  required
                  className="glass-input text-xs font-mono"
                />
              </div>
              
              <button
                type="submit"
                disabled={submitMutation.isLoading}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
              >
                {submitMutation.isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                <span>Upload solution</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
