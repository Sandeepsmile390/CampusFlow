import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import axiosInstance from '../../utils/axios';
import { Megaphone, Calendar, AlertTriangle, Plus, Trash2, X, Bell } from 'lucide-react';

export default function NoticeBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const canPublish = user.role === 'ADMIN' || user.role === 'TEACHER';

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'GENERAL' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch notices
  const { data: noticesRes, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const res = await axiosInstance.get('/notices');
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/notices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setModalOpen(false);
      setForm({ title: '', content: '', category: 'GENERAL' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/notices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] })
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'EXAM': return 'text-red-500 bg-red-500/10 border border-red-500/20';
      case 'HOLIDAY': return 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
      case 'PLACEMENT': return 'text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/20';
      default: return 'text-[#4338CA] bg-[#4338CA]/10 border border-[#4338CA]/20 dark:text-[#38BDF8] dark:bg-[#38BDF8]/10 dark:border-[#38BDF8]/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Notice Board</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Review announcements, holiday details, exam alerts and placements.</p>
        </div>
        {canPublish && (
          <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Notice list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl col-span-2"></div>
        ) : noticesRes?.length > 0 ? (
          noticesRes.map((notice) => (
            <div key={notice.id} className="glass-card flex flex-col justify-between p-6 border-glow relative hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-1 font-bold border rounded-full tracking-wider uppercase ${getCategoryColor(notice.category)}`}>
                    {notice.category}
                  </span>
                  {(user.role === 'ADMIN' || notice.postedById === user.id) && (
                    <div className="flex items-center gap-2">
                      {deleteConfirmId === notice.id ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-xl text-[10px]">
                          <span className="text-red-500 font-bold">Delete?</span>
                          <button
                            onClick={() => {
                              deleteMutation.mutate(notice.id);
                              setDeleteConfirmId(null);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded font-bold transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(notice.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{notice.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{notice.content}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-550 font-medium">
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-[#4338CA] dark:text-[#14B8A6]" />
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
                <span className="font-semibold">By: {notice.postedBy?.email}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-20 text-slate-400">
            Notice board is empty.
          </div>
        )}
      </div>

      {/* Publish Notice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#4338CA] dark:text-[#14B8A6]" /> Publish Notice
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="glass-select text-xs w-full py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="GENERAL" className="glass-select-option">General Announcement</option>
                  <option value="EXAM" className="glass-select-option">Exam Alert</option>
                  <option value="HOLIDAY" className="glass-select-option">Holiday Announcement</option>
                  <option value="PLACEMENT" className="glass-select-option">Placement Alert</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Notice Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="End Semester Schedule"
                  className="glass-input text-xs py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Notice Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Exams will be held from Dec 10th to Dec 24th..."
                  rows={4}
                  className="glass-input text-xs"
                />
              </div>
              
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Bell className="h-4.5 w-4.5" />}
                <span>Publish Notice & Send Web Push</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
