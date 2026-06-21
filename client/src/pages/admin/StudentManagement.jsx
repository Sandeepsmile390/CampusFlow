import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '../../utils/axios';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  X,
  Loader2,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SkeletonTable } from '../../components/Skeleton';

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  rollNumber: z.string().min(3, 'Roll number must be at least 3 characters.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().min(1, 'Please select a department.'),
  semester: z.string().transform((v) => parseInt(v, 10)),
  parentName: z.string().min(2, 'Parent name is required.'),
  parentEmail: z.string().email('Invalid email.'),
  parentPhone: z.string().min(5, 'Parent phone is required.'),
});

export default function StudentManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Fetch departments
  const { data: deptsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/departments');
      return res.data.data;
    }
  });

  // Fetch students
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ['students', page, search, departmentFilter, semesterFilter],
    queryFn: async () => {
      const res = await axiosInstance.get('/students', {
        params: {
          page,
          search,
          departmentId: departmentFilter,
          semester: semesterFilter,
          limit: 10
        }
      });
      return res.data;
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      rollNumber: '',
      phone: '',
      address: '',
      departmentId: '',
      semester: '1',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/auth/register', { ...data, role: 'STUDENT' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setModalOpen(false);
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axiosInstance.put(`/students/${editingStudent.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setModalOpen(false);
      setEditingStudent(null);
      reset();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (students) => axiosInstance.post('/students/bulk-import', { students }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setImportOpen(false);
      setCsvText('');
    }
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    reset({
      name: '',
      email: '',
      password: 'password123',
      rollNumber: '',
      phone: '',
      address: '',
      departmentId: '',
      semester: '1',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setValue('name', student.name);
    setValue('email', student.user.email);
    setValue('password', '');
    setValue('rollNumber', student.rollNumber);
    setValue('phone', student.phone || '');
    setValue('address', student.address || '');
    setValue('departmentId', student.departmentId || '');
    setValue('semester', student.semester.toString());
    setValue('parentName', student.parentName || '');
    setValue('parentEmail', student.parentEmail || '');
    setValue('parentPhone', student.parentPhone || '');
    setModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingStudent) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (!studentsRes?.data) return;
    const headers = ['Name', 'Roll Number', 'Email', 'Phone', 'Semester', 'Department', 'Parent Name', 'Parent Email'];
    const rows = studentsRes.data.map(s => [
      s.name,
      s.rollNumber,
      s.user.email,
      s.phone || '',
      s.semester,
      s.department?.code || '',
      s.parentName || '',
      s.parentEmail || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Students_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk CSV Parser
  const handleBulkImport = () => {
    if (!csvText.trim()) return;
    
    // Parse CSV simple parser
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const parsedStudents = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      
      const student = {};
      headers.forEach((header, index) => {
        // Map header titles to field names
        let key = header;
        if (header === 'roll number' || header === 'rollnumber') key = 'rollNumber';
        if (header === 'department' || header === 'departmentcode') key = 'departmentCode';
        if (header === 'parent name') key = 'parentName';
        if (header === 'parent email') key = 'parentEmail';
        if (header === 'parent phone') key = 'parentPhone';
        
        student[key] = values[index];
      });
      parsedStudents.push(student);
    }

    bulkImportMutation.mutate(parsedStudents);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Student Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Add, update, search, and bulk import student records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={() => setImportOpen(true)} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5">
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </button>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-550">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, roll number, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/30 border border-transparent dark:border-slate-800/80 outline-none focus:border-brand-500 transition-all text-sm"
          />
        </div>
        
        {/* Sliders / Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/30 border border-transparent dark:border-slate-800 text-sm outline-none"
          >
            <option value="">All Departments</option>
            {deptsRes?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => {
              setSemesterFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/30 border border-transparent dark:border-slate-800 text-sm outline-none"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Sem {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : studentsRes?.data?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Email</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsRes.data.map(student => (
                  <tr key={student.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20 transition-all">
                    <td className="font-semibold text-brand-400">{student.rollNumber}</td>
                    <td>{student.name}</td>
                    <td>{student.department?.code}</td>
                    <td>Semester {student.semester}</td>
                    <td>{student.user.email}</td>
                    <td className="text-right flex items-center justify-end gap-2 px-6 py-4">
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 hover:text-brand-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete student ${student.name}?`)) {
                            deleteMutation.mutate(student.id);
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

            {/* Pagination Controls */}
            {studentsRes.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-900 text-sm">
                <span className="text-slate-500">Showing page {page} of {studentsRes.pagination.totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    disabled={page === studentsRes.pagination.totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, studentsRes.pagination.totalPages))}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            No students found matching your filters.
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <h2 className="text-xl font-bold">{editingStudent ? 'Edit Student Details' : 'Add New Student'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Roll No */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Roll Number</label>
                  <input type="text" {...register('rollNumber')} className="glass-input text-sm py-2" placeholder="CSE2026-042" />
                  {errors.rollNumber && <span className="text-red-400 text-[10px]">{errors.rollNumber.message}</span>}
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Full Name</label>
                  <input type="text" {...register('name')} className="glass-input text-sm py-2" placeholder="Jane Doe" />
                  {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input type="email" {...register('email')} className="glass-input text-sm py-2" placeholder="jane@university.edu" disabled={!!editingStudent} />
                  {errors.email && <span className="text-red-400 text-[10px]">{errors.email.message}</span>}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Password {!editingStudent && '(Default)'}</label>
                  <input type="password" {...register('password')} className="glass-input text-sm py-2" placeholder={editingStudent ? 'Leave blank to keep same' : 'password123'} />
                  {errors.password && <span className="text-red-400 text-[10px]">{errors.password.message}</span>}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <select {...register('departmentId')} className="glass-input text-sm py-2">
                    <option value="">Select Department</option>
                    {deptsRes?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <span className="text-red-400 text-[10px]">{errors.departmentId.message}</span>}
                </div>

                {/* Semester */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Active Semester</label>
                  <select {...register('semester')} className="glass-input text-sm py-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                  {errors.semester && <span className="text-red-400 text-[10px]">{errors.semester.message}</span>}
                </div>
              </div>

              <div className="relative my-4 text-center">
                <span className="absolute inset-x-0 top-1/2 border-t border-slate-200 dark:border-slate-800 z-0"></span>
                <span className="relative bg-slate-900 px-3 text-xs text-slate-400 z-10 font-semibold uppercase">
                  Parent / Guardian Details
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Parent Name</label>
                  <input type="text" {...register('parentName')} className="glass-input text-sm py-2" placeholder="Robert Doe" />
                  {errors.parentName && <span className="text-red-400 text-[10px]">{errors.parentName.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Parent Email</label>
                  <input type="email" {...register('parentEmail')} className="glass-input text-sm py-2" placeholder="parent.doe@gmail.com" />
                  {errors.parentEmail && <span className="text-red-400 text-[10px]">{errors.parentEmail.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Parent Phone</label>
                  <input type="text" {...register('parentPhone')} className="glass-input text-sm py-2" placeholder="9876543210" />
                  {errors.parentPhone && <span className="text-red-400 text-[10px]">{errors.parentPhone.message}</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/30 dark:border-slate-800/30">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  {(createMutation.isLoading || updateMutation.isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <h2 className="text-xl font-bold">Bulk Import CSV Data</h2>
              <button onClick={() => setImportOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              Paste comma-separated data containing: <code>email, name, rollNumber, departmentCode, semester, parentName, parentEmail, parentPhone</code>
            </p>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="email,name,rollNumber,departmentCode,semester,parentName,parentEmail,parentPhone&#10;std1@univ.edu,John Doe,CSE2026-101,CSE,3,Robert Doe,p1@gmail.com,9876543210&#10;std2@univ.edu,Jane Smith,CSE2026-102,CSE,3,David Smith,p2@gmail.com,9876543211"
              rows={8}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono outline-none text-white focus:border-brand-500"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setImportOpen(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
              <button
                onClick={handleBulkImport}
                disabled={bulkImportMutation.isLoading}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-2"
              >
                {bulkImportMutation.isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Import Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
