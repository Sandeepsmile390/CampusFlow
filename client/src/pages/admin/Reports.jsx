import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { FileSpreadsheet, Download, Printer, Search, Loader2 } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('attendance'); // attendance, marks, fees, placements
  const [semester, setSemester] = useState('3');
  
  // Fetch report data based on selections
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['adminReports', reportType, semester],
    queryFn: async () => {
      // Fetch matching data depending on type
      if (reportType === 'attendance') {
        const res = await axiosInstance.get('/students', {
          params: { semester, limit: 200 }
        });
        // Fetch performance for each student to map attendance percentage
        const reportsList = [];
        for (const s of res.data.data) {
          const perf = await axiosInstance.get(`/students/${s.id}/performance`);
          reportsList.push({
            rollNumber: s.rollNumber,
            name: s.name,
            department: s.department?.code,
            semester: s.semester,
            attendance: `${perf.data.data.attendancePercentage}%`,
            status: parseFloat(perf.data.data.attendancePercentage) >= 75 ? 'ELIGIBLE' : 'DEBARRED'
          });
        }
        return reportsList;
      }
      
      if (reportType === 'marks') {
        const res = await axiosInstance.get('/students', {
          params: { semester, limit: 200 }
        });
        const reportsList = [];
        for (const s of res.data.data) {
          const perf = await axiosInstance.get(`/students/${s.id}/performance`);
          reportsList.push({
            rollNumber: s.rollNumber,
            name: s.name,
            department: s.department?.code,
            semester: s.semester,
            cgpa: perf.data.data.cgpa,
            gradedSubmissions: perf.data.data.gradedSubmissionsCount
          });
        }
        return reportsList;
      }

      if (reportType === 'fees') {
        const res = await axiosInstance.get('/fees');
        // Filter fee records by target student semester
        const filteredFees = res.data.data.filter(
          f => !semester || f.student?.semester?.toString() === semester.toString()
        );
        return filteredFees.map(f => ({
          rollNumber: f.student?.rollNumber,
          name: f.student?.name,
          amount: `₹${f.amount}`,
          dueDate: new Date(f.dueDate).toLocaleDateString(),
          status: f.status,
          paidAt: f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'N/A'
        }));
      }

      if (reportType === 'placements') {
        const res = await axiosInstance.get('/placements');
        // Retrieve details
        const list = [];
        for (const job of res.data.data) {
          const apps = await axiosInstance.get(`/placements/applications/${job.id}`);
          list.push({
            company: job.company,
            role: job.role,
            package: job.salaryPackage,
            applicationsCount: apps.data.data.length,
            placedCount: apps.data.data.filter(a => a.status === 'PLACED').length
          });
        }
        return list;
      }

      return [];
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(r => headers.map(h => r[h]));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Institutional Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Download official registers, performance analyses and collection lists.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} disabled={!reportData} className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={handlePrint} disabled={!reportData} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* Select Report Filter bar */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-4 print:hidden">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <FileSpreadsheet className="h-5 w-5 text-slate-400" />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="glass-select text-xs w-full py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="attendance" className="glass-select-option">Class Attendance Register</option>
            <option value="marks" className="glass-select-option">Marks Registry (CGPA)</option>
            <option value="fees" className="glass-select-option">Fee billing invoices status</option>
            <option value="placements" className="glass-select-option">Placements applications metrics</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400">Target Semester</span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="glass-select text-xs py-2 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s.toString()} className="glass-select-option">Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table printable viewport */}
      <div className="glass-card overflow-hidden border-glow print:shadow-none print:border-none print:bg-white print:text-black">
        {/* Printable Title Block */}
        <div className="hidden print:block text-center py-6 border-b-2 border-black space-y-2">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider">Aegis University ERP system</h2>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-600">Official Institutional Report: {reportType.toUpperCase()}</p>
          <p className="text-xs text-slate-400">Generated: {new Date().toLocaleString()} | Semester: {semester}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : reportData?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table print:text-black">
              <thead>
                <tr>
                  {Object.keys(reportData[0]).map((header) => (
                    <th key={header} className="capitalize print:text-black print:border-black font-bold">
                      {header.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20 print:hover:bg-transparent">
                    {Object.keys(row).map((key) => {
                      const val = row[key];
                      return (
                        <td key={key} className={`print:text-black print:border-black ${
                          val === 'PAID' || val === 'ELIGIBLE' ? 'text-emerald-500 font-semibold' : ''
                        } ${
                          val === 'OVERDUE' || val === 'DEBARRED' ? 'text-red-500 font-semibold' : ''
                        } ${
                          val === 'PENDING' ? 'text-yellow-500 font-semibold' : ''
                        }`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">No report records found.</div>
        )}
      </div>

    </div>
  );
}
