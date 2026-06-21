import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { useAuthStore } from '../../store/authStore';
import { IndianRupee, Clipboard, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Fees() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const studentId = user.profile?.id;

  // Fetch student fees
  const { data: fees, isLoading } = useQuery({
    queryKey: ['studentFees', studentId],
    queryFn: async () => {
      const res = await axiosInstance.get('/fees', { params: { studentId } });
      return res.data.data;
    }
  });

  const payMutation = useMutation({
    mutationFn: (id) => axiosInstance.post(`/fees/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentFees']);
      queryClient.invalidateQueries(['studentPerformance']);
    }
  });

  const handleDownloadReceipt = (fee) => {
    const printContent = `
      ===============================================
      UNIVERSITY ERP INVOICE PAYMENT RECEIPT
      ===============================================
      Transaction ID: ${fee.transactionId}
      Date of Payment: ${new Date(fee.paidAt).toLocaleDateString()}
      Student Name: ${user.profile?.name}
      Student Roll Number: ${user.profile?.rollNumber}
      Invoice Description: Academic Tuition Fee
      Amount Settled: ₹${fee.amount}
      Status: PAID / SUCCESS
      ===============================================
    `;
    const blob = new Blob([printContent], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Receipt_${fee.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Tuition & Invoices</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Review pending academic balances, complete payments, and print receipts.</p>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : fees?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const isPaid = fee.status === 'PAID';
                  return (
                    <tr key={fee.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                      <td className="font-semibold text-slate-100 flex items-center gap-2 py-4">
                        <IndianRupee className="h-4 w-4 text-slate-400" /> Academic Fees
                      </td>
                      <td className="font-bold">₹{fee.amount.toLocaleString()}</td>
                      <td className="text-xs text-slate-400">{new Date(fee.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`text-[10px] px-2.5 py-1 font-bold border rounded-full ${
                          isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-500">{fee.transactionId || 'Pending'}</td>
                      <td className="text-right px-6 py-4">
                        {isPaid ? (
                          <button
                            onClick={() => handleDownloadReceipt(fee)}
                            className="btn-secondary text-[10px] px-3.5 py-1.5 font-bold"
                          >
                            Download Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => payMutation.mutate(fee.id)}
                            disabled={payMutation.isLoading}
                            className="btn-primary text-[10px] px-3.5 py-1.5 font-bold flex items-center gap-1.5"
                          >
                            {payMutation.isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                            Pay Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-20 text-slate-400 text-sm">No invoices recorded for your account.</p>
        )}
      </div>

    </div>
  );
}
