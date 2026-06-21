import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { Briefcase, FileText, Upload, Calendar, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

export default function Placements() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const studentId = user.profile?.id;

  const [applyModal, setApplyModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');

  // Fetch placements
  const { data: placements, isLoading: placementsLoading } = useQuery({
    queryKey: ['studentPlacements'],
    queryFn: async () => {
      const res = await axiosInstance.get('/placements');
      return res.data.data;
    }
  });

  // Fetch student performance to check CGPA eligibility
  const { data: perfRes } = useQuery({
    queryKey: ['studentPerformance', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/students/${studentId}/performance`);
      return res.data.data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/placements/${selectedPlacement.id}/apply`, { resumeUrl: data.resumeUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentPlacements']);
      setApplyModal(false);
      setResumeUrl('');
      setSelectedPlacement(null);
    }
  });

  const handleOpenApply = (job) => {
    setSelectedPlacement(job);
    setApplyModal(true);
  };

  const handlePostApplication = (e) => {
    e.preventDefault();
    if (!resumeUrl.trim()) return;
    applyMutation.mutate({ resumeUrl });
  };

  // Compare CGPA eligibility
  const checkEligibility = (criteriaString) => {
    if (!perfRes) return false;
    const match = criteriaString.match(/CGPA\s*>=\s*([0-9.]+)/i);
    if (!match) return true; // default eligible if no pattern matched

    const threshold = parseFloat(match[1]);
    const studentCgpa = parseFloat(perfRes.cgpa);
    return studentCgpa >= threshold;
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Placement Cell</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Browse recruitments drives, check candidate eligibility, and upload resumes.</p>
      </div>

      {/* Placement jobs listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {placementsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 flex flex-col justify-between h-48 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4 mt-2" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))
        ) : placements?.length > 0 ? (
          placements.map((job) => {
            const hasApplied = job.applications?.length > 0;
            const app = hasApplied ? job.applications[0] : null;
            const eligible = checkEligibility(job.eligibilityCriteria);

            return (
              <div key={job.id} className="glass-card flex flex-col justify-between p-6 relative hover:scale-[1.02] transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#4338CA] dark:text-[#14B8A6]" /> {job.company}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 font-bold border rounded-full uppercase ${
                      app?.status === 'PLACED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (
                        hasApplied ? 'bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20 dark:bg-brand-teal/10 dark:text-brand-teal' : (
                          eligible ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        )
                      )
                    }`}>
                      {hasApplied ? `Applied: ${app.status}` : (eligible ? 'Eligible' : 'Not Eligible')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{job.role}</h3>
                    <p className="text-sm font-semibold text-[#14B8A6]">{job.salaryPackage}</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <p><strong className="text-slate-700 dark:text-slate-300">Requirements:</strong> {job.requirements}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Eligibility:</strong> {job.eligibilityCriteria}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Portal Closes: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                  
                  {!hasApplied && eligible && (
                    <button
                      onClick={() => handleOpenApply(job)}
                      className="btn-primary text-[11px] px-4 py-2 flex items-center gap-1 font-bold"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Apply Now</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-20 text-slate-400">
            No active placement drives currently open.
          </div>
        )}
      </div>

      {/* Apply Placement Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-brand-500" /> Apply Recruitment
              </h3>
              <button onClick={() => setApplyModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handlePostApplication} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Mock Resume Link / Cloudinary PDF URL</label>
                <input
                  type="text"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/demo/image/upload/resume.pdf"
                  required
                  className="glass-input text-xs font-mono"
                />
              </div>
              
              <button
                type="submit"
                disabled={applyMutation.isLoading}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
              >
                {applyMutation.isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                <span>Send Application</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
