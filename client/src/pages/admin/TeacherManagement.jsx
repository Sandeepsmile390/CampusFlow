import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '../../utils/axios';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';

const teacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email.'),
  password: z.string().min(6).optional().or(z.literal('')),
  qualifications: z.string().min(2, 'Qualifications are required.'),
  experience: z.string().transform((v) => parseInt(v, 10)),
  departmentId: z.string().min(1, 'Please select a department.'),
  phone: z.string().optional(),
});

export default function TeacherManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Fetch departments
  const { data: deptsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/departments');
      return res.data.data;
    }
  });

  // Fetch teachers
  const { data: teachersRes, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await axiosInstance.get('/teachers');
      return res.data.data;
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      qualifications: '',
      experience: '0',
      departmentId: '',
      phone: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/auth/register', { ...data, role: 'TEACHER' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      setModalOpen(false);
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axiosInstance.put(`/teachers/${editingTeacher.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      setModalOpen(false);
      setEditingTeacher(null);
      reset();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
    }
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    reset({
      name: '',
      email: '',
      password: 'password123',
      qualifications: '',
      experience: '0',
      departmentId: '',
      phone: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    setValue('name', teacher.name);
    setValue('email', teacher.user?.email || '');
    setValue('password', '');
    setValue('qualifications', teacher.qualifications);
    setValue('experience', teacher.experience.toString());
    setValue('departmentId', teacher.departmentId || '');
    setValue('phone', teacher.phone || '');
    setModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingTeacher) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Teacher Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Register faculties, map departments, and manage qualifications.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : teachersRes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Qualifications</th>
                  <th>Experience</th>
                  <th>Email</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachersRes.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20 transition-all">
                    <td className="font-semibold">{teacher.name}</td>
                    <td>{teacher.department?.name || 'Unassigned'}</td>
                    <td className="text-slate-400 text-xs truncate max-w-[200px]">{teacher.qualifications}</td>
                    <td>{teacher.experience} years</td>
                    <td>{teacher.user?.email}</td>
                    <td className="text-right flex items-center justify-end gap-2 px-6 py-4">
                      <button onClick={() => handleOpenEdit(teacher)} className="p-1.5 hover:text-brand-500 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete teacher ${teacher.name}?`)) {
                            deleteMutation.mutate(teacher.id);
                          }
                        }}
                        className="p-1.5 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">No teachers found. Register one above.</div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/30 pb-3">
              <h2 className="text-xl font-bold">{editingTeacher ? 'Update Faculty Details' : 'Register New Faculty'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input type="text" {...register('name')} className="glass-input text-xs py-2" placeholder="Dr. Alice Vance" />
                {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <input type="email" {...register('email')} className="glass-input text-xs py-2" placeholder="teacher@university.edu" disabled={!!editingTeacher} />
                {errors.email && <span className="text-red-400 text-[10px]">{errors.email.message}</span>}
              </div>

              {!editingTeacher && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Password</label>
                  <input type="password" {...register('password')} className="glass-input text-xs py-2" placeholder="password123" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <select {...register('departmentId')} className="glass-input text-xs py-2">
                    <option value="">Select Department</option>
                    {deptsRes?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <span className="text-red-400 text-[10px]">{errors.departmentId.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Experience (Years)</label>
                  <input type="number" {...register('experience')} className="glass-input text-xs py-2" placeholder="5" />
                  {errors.experience && <span className="text-red-400 text-[10px]">{errors.experience.message}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Qualifications</label>
                <input type="text" {...register('qualifications')} className="glass-input text-xs py-2" placeholder="Ph.D. in Computer Science (Stanford)" />
                {errors.qualifications && <span className="text-red-400 text-[10px]">{errors.qualifications.message}</span>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/30">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary px-4 py-2 text-xs flex items-center gap-1">
                  {(createMutation.isLoading || updateMutation.isLoading) && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
