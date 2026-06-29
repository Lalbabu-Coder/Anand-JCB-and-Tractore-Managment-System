"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema } from "@/lib/validation";
import { createPayment, deletePayment } from "@/app/actions/payment";
import { Loader2, Wallet, AlertCircle, CheckCircle } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  village: string;
  remaining: number;
}

interface PaymentLog {
  id: string;
  amount: number;
  method: string;
  referenceId: string | null;
  notes: string | null;
  date: string;
  customer: { name: string; village: string };
}

interface PaymentsClientProps {
  customers: Customer[];
  recentPayments: PaymentLog[];
  isAdmin: boolean;
}

export function PaymentsClient({ customers, recentPayments, isAdmin }: PaymentsClientProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: "",
      amount: 0,
      method: "CASH",
      referenceId: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchCustomerId = watch("customerId");
  const watchAmount = watch("amount");

  const [previousBalance, setPreviousBalance] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  // Update balances when customer or input amount shifts
  useEffect(() => {
    const selected = customers.find((c) => c.id === watchCustomerId);
    const balance = selected ? selected.remaining : 0;
    setPreviousBalance(balance);
    setRemainingBalance(Math.max(0, balance - (Number(watchAmount) || 0)));
  }, [watchCustomerId, watchAmount, customers]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setFormError(null);
    setSuccessMsg(null);

    // format date correctly
    if (data.date) {
      data.date = `${data.date}T12:00:00.000Z`;
    }

    const res = await createPayment(data);

    if (res.success) {
      setSuccessMsg(`Payment of ₹${data.amount} recorded successfully! Balance updated.`);
      reset({
        customerId: "",
        amount: 0,
        method: "CASH",
        referenceId: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      router.refresh();
    } else {
      setFormError(res.error || "Failed to record payment");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment record? This will increase the customer's outstanding balance!")) {
      setIsDeleting(id);
      const res = await deletePayment(id);
      setIsDeleting(null);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete payment");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Log Entry */}
      <div className="lg:col-span-1 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-8 glass-panel shadow-lg h-fit relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-emerald-600/10 blur-[40px] pointer-events-none" />
        <h3 className="text-lg font-bold text-white mb-6 relative z-10 tracking-tight">Record Customer Payment</h3>

        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 relative z-10 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{formError}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-400 relative z-10 shadow-sm">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Select Customer</label>
            <select
              {...register("customerId")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="" disabled className="bg-zinc-950">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950">
                  {c.name} (Due: ₹{c.remaining.toLocaleString()})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Received Amount (₹)</label>
              <input
                type="number"
                {...register("amount")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
              />
              {errors.amount && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Method</label>
              <select
                {...register("method")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="CASH" className="bg-zinc-950">Cash</option>
                <option value="UPI" className="bg-zinc-950">UPI Transfer</option>
                <option value="BANK" className="bg-zinc-950">Bank Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Reference ID</label>
              <input
                type="text"
                {...register("referenceId")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="UPI txn or bank reference"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Payment Date</label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Notes / Remarks</label>
            <input
              type="text"
              {...register("notes")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="e.g. Paid in full for JCB Rampur task"
            />
          </div>

          {/* Balance Adjustment Visualizer */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-5 space-y-3 mt-8 shadow-inner">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Previous Balance</span>
              <span className="text-zinc-300">₹{previousBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Received Amount</span>
              <span className="text-emerald-400">- ₹{(Number(watchAmount) || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold uppercase tracking-wider border-t border-zinc-800/50 pt-3">
              <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">Remaining Balance</span>
              <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">₹{remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:hover:scale-100 mt-8"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Record Payment & Clear Ledger"}
          </button>
        </form>
      </div>

      {/* Payment History Logs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-8 glass-panel shadow-lg overflow-x-auto">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Payment Receipts Registry</h3>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30">
              <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
                <Wallet className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-base text-zinc-300 font-semibold">No payments logged yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-4 px-4">Customer</th>
                  <th className="pb-4 px-4">Date</th>
                  <th className="pb-4 px-4">Method</th>
                  <th className="pb-4 px-4">Reference ID</th>
                  <th className="pb-4 px-4 text-right">Received Amount</th>
                  {isAdmin && <th className="pb-4 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                {recentPayments.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-zinc-800/30 group">
                    <td className="py-4 px-4 rounded-l-xl">
                      <span className="font-bold text-white">{log.customer.name}</span>
                      <p className="text-[10px] text-zinc-500 font-medium">{log.customer.village}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-zinc-400">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <span className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-300 shadow-sm">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-zinc-500 font-mono">{log.referenceId || "—"}</td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-400">₹{log.amount.toLocaleString()}</td>
                    {isAdmin && (
                      <td className="py-4 px-4 text-center rounded-r-xl">
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={isDeleting === log.id}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          {isDeleting === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
