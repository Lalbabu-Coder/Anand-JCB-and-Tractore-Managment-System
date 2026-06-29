"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jcbWorkSchema } from "@/lib/validation";
import { createJcbWork, deleteJcbWork } from "@/app/actions/jcb";
import { Loader2, Calendar, AlertCircle, FileText, CheckCircle } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  village: string;
}

interface Machine {
  id: string;
  name: string;
}

interface JCBWorkLog {
  id: string;
  date: string;
  totalHours: number;
  ratePerHour: number;
  totalAmount: number;
  advancePaid: number;
  remainingBalance: number;
  operatorName: string;
  customer: { name: string; village: string };
  machine: { name: string };
  pdfUrl?: string | null;
}

interface JCBClientProps {
  customers: Customer[];
  machines: Machine[];
  recentLogs: JCBWorkLog[];
  defaultRate: number;
  currentUserName: string;
  isAdmin: boolean;
}

export function JCBClient({
  customers,
  machines,
  recentLogs,
  defaultRate,
  currentUserName,
  isAdmin,
}: JCBClientProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ workId: string; smsSent: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jcbWorkSchema),
    defaultValues: {
      customerId: "",
      machineId: machines[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      ratePerHour: defaultRate,
      dieselCost: 0,
      operatorName: currentUserName,
      advancePaid: 0,
      notes: "",
    },
  });

  const watchStartTime = watch("startTime");
  const watchEndTime = watch("endTime");
  const watchRate = watch("ratePerHour");
  const watchAdvance = watch("advancePaid");

  const [hours, setHours] = useState(0);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);

  // Auto-update calculations on form inputs
  useEffect(() => {
    if (watchStartTime && watchEndTime) {
      const start = new Date(`2000-01-01T${watchStartTime}`);
      const end = new Date(`2000-01-01T${watchEndTime}`);
      let diffMs = end.getTime() - start.getTime();

      // Handle overnight shift if endTime is earlier than startTime
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }

      const calculatedHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      setHours(calculatedHours);

      const calculatedTotal = Math.round(calculatedHours * (Number(watchRate) || 0));
      setTotal(calculatedTotal);

      setBalance(Math.max(0, calculatedTotal - (Number(watchAdvance) || 0)));
    } else {
      setHours(0);
      setTotal(0);
      setBalance(0);
    }
  }, [watchStartTime, watchEndTime, watchRate, watchAdvance]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (data: any) => {
    setFormError(null);
    setSuccessInfo(null);

    // Parse specific date into start/end times
    const dateStr = data.date;
    data.startTime = `${dateStr}T${data.startTime}:00`;
    
    // Check if end time spans into next day
    const isOvernight = data.endTime < watch("startTime");
    let endDate = dateStr;
    if (isOvernight) {
      const tomorrow = new Date(dateStr);
      tomorrow.setDate(tomorrow.getDate() + 1);
      endDate = tomorrow.toISOString().split("T")[0];
    }
    data.endTime = `${endDate}T${data.endTime}:00`;

    const res = await createJcbWork(data);

    if (res.success) {
      setSuccessInfo({
        workId: res.work?.id || "",
        smsSent: res.notifications?.smsSent || false,
      });
      reset({
        customerId: "",
        machineId: machines[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        ratePerHour: defaultRate,
        dieselCost: 0,
        operatorName: currentUserName,
        advancePaid: 0,
        notes: "",
      });
      router.refresh();
    } else {
      setFormError(res.error || "Failed to log JCB entry");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm("Are you sure you want to delete this JCB work log?")) {
      setIsDeleting(id);
      const res = await deleteJcbWork(id);
      setIsDeleting(null);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete log");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Work Entry Form */}
      <div className="lg:col-span-1 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-5 lg:p-8 glass-panel shadow-lg h-fit relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-600/10 blur-[40px] pointer-events-none" />
        <h3 className="text-lg font-bold text-white mb-6 relative z-10 tracking-tight">Log JCB Excavator Work</h3>

        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 relative z-10 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{formError}</p>
          </div>
        )}

        {successInfo && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-200 relative z-10 shadow-sm">
            <div className="flex items-center gap-2 mb-3 font-bold text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span>Work logged successfully!</span>
            </div>
            <p className="mb-4 text-xs font-medium">
              {successInfo.smsSent
                ? "Outbound receipt SMS/WhatsApp alerts have been sent to the customer."
                : "Failed to dispatch SMS (Twilio configured/sandbox settings might limit this)."}
            </p>
            {successInfo.workId && (
              <a
                href={`/api/receipts?id=${successInfo.workId}&type=JCB`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 font-bold text-emerald-400 hover:bg-emerald-500/30 text-xs transition-colors shadow-sm"
              >
                <FileText className="h-4 w-4" /> Open PDF Receipt
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Select Customer</label>
            <select
              {...register("customerId")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="" disabled className="bg-zinc-950">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950">
                  {c.name} ({c.village})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Machine</label>
              <select
                {...register("machineId")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-950">{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Work Date</label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Start Time</label>
              <input
                type="time"
                {...register("startTime")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
              {errors.startTime && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">End Time</label>
              <input
                type="time"
                {...register("endTime")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
              {errors.endTime && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Rate / Hour</label>
              <input
                type="number"
                {...register("ratePerHour")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
              {errors.ratePerHour && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.ratePerHour.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Diesel Cost (₹)</label>
              <input
                type="number"
                {...register("dieselCost")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
              {errors.dieselCost && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.dieselCost.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Operator</label>
              <input
                type="text"
                {...register("operatorName")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
              {errors.operatorName && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.operatorName.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Advance Paid (₹)</label>
              <input
                type="number"
                {...register("advancePaid")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Notes <span className="text-zinc-600 font-normal lowercase tracking-normal">(optional)</span></label>
            <input
              type="text"
              {...register("notes")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
              placeholder="e.g. Tank excavation Rampur field"
            />
          </div>

          {/* Real-time Summary breakdown card */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-5 space-y-3 mt-8 shadow-inner">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Calculated Hours</span>
              <span className="text-zinc-300">{hours} hrs</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Total Amount</span>
              <span className="text-zinc-300">₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold uppercase tracking-wider border-t border-zinc-800/50 pt-3">
              <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">Remaining Balance</span>
              <span className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">₹{balance.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 py-4 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:hover:scale-100 mt-8"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Generate Invoice"}
          </button>
        </form>
      </div>

      {/* JCB Logs Table */}
      <div className="lg:col-span-2 space-y-6 w-full">
        <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-5 lg:p-8 glass-panel shadow-lg overflow-x-auto w-full">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Recent JCB Work Registry</h3>
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30">
              <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
                <Calendar className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-base text-zinc-300 font-semibold">No JCB records logged.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-4 px-4">Customer</th>
                  <th className="pb-4 px-4">Date</th>
                  <th className="pb-4 px-4">Hours</th>
                  <th className="pb-4 px-4 text-right">Total (₹)</th>
                  <th className="pb-4 px-4 text-right">Advance (₹)</th>
                  <th className="pb-4 px-4 text-right">Balance (₹)</th>
                  <th className="pb-4 px-4 text-center">Receipt</th>
                  {isAdmin && <th className="pb-4 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-zinc-800/30 group">
                    <td className="py-4 px-4 rounded-l-xl">
                      <span className="font-bold text-white">{log.customer.name}</span>
                      <p className="text-[10px] text-zinc-500 font-medium">{log.customer.village}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-zinc-400">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-xs font-bold text-violet-400">{log.totalHours.toFixed(1)} hrs</td>
                    <td className="py-4 px-4 text-right font-bold text-white">₹{log.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-medium text-emerald-500">₹{log.advancePaid.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-bold text-amber-500">₹{log.remainingBalance.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <a
                        href={`/api/receipts?id=${log.id}&type=JCB`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:bg-violet-500/20 transition-colors"
                      >
                        <FileText className="h-3 w-3" /> PDF
                      </a>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4 text-center rounded-r-xl">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
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
