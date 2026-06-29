"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tractorWorkSchema } from "@/lib/validation";
import { createTractorWork, deleteTractorWork } from "@/app/actions/tractor";
import { Loader2, Calendar, AlertCircle, FileText, CheckCircle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  village: string;
}

interface Machine {
  id: string;
  name: string;
}

interface TractorOperation {
  workType: string;
  area: number | null;
  ratePerArea: number | null;
  tripCount: number | null;
  ratePerTrip: number | null;
  landUnit: string | null;
  numberOfPasses: number | null;
}

interface TractorWorkLog {
  id: string;
  date: string;
  totalAmount: number;
  advancePaid: number;
  remainingBalance: number;
  operatorName: string;
  customer: { name: string; village: string };
  machine: { name: string };
  pdfUrl?: string | null;
  operations: TractorOperation[];
}

interface TractorClientProps {
  customers: Customer[];
  machines: Machine[];
  recentLogs: TractorWorkLog[];
  defaultRatePloughing: number;
  currentUserName: string;
  isAdmin: boolean;
}

const TRACTOR_WORK_TYPES = [
  // Agricultural
  { id: "ROTAVATOR", label: "Rotavator (Rotary)" },
  { id: "HAL_JOTAI", label: "Hal Jotai (Plough)" },
  { id: "TAWA_JOTAI", label: "Tawa Jotai" },
  { id: "CULTIVATOR", label: "Cultivator" },
  { id: "SEED_DRILL", label: "Seed Drill" },
  { id: "HARROW", label: "Harrow" },
  { id: "PUDDLING", label: "Puddling" },
  { id: "LEVELER", label: "Leveling" },
  { id: "PLOUGHING", label: "Ploughing (General)" },
  // Transport
  { id: "TROLLEY_TRANSPORT", label: "Trolley Transport" },
  { id: "SOIL_FILLING", label: "Soil/Mitti Filling" },
  { id: "SAND_TRANSPORT", label: "Sand Transport" },
  { id: "BRICK_TRANSPORT", label: "Brick Transport" },
  { id: "FERTILIZER_SPREADING", label: "Fertilizer Spreading" },
  { id: "WATER_TANK_SUPPLY", label: "Water Tank Supply" },
  { id: "OTHERS", label: "Other" },
];

const TRANSPORT_TYPES = ["SOIL_FILLING", "SAND_TRANSPORT", "BRICK_TRANSPORT", "WATER_TANK_SUPPLY", "TROLLEY_TRANSPORT", "TROLLEY"];
const LAND_UNITS = ["Bigha", "Katha", "Acre", "Hectare"];

export function TractorClient({
  customers,
  machines,
  recentLogs,
  defaultRatePloughing,
  currentUserName,
  isAdmin,
}: TractorClientProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ workId: string; smsSent: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showExtraCharges, setShowExtraCharges] = useState(false);

  const defaultOperation = {
    workType: "ROTAVATOR" as any,
    pricingMethod: "RATE_PER_UNIT" as const,
    area: 0,
    ratePerArea: defaultRatePloughing,
    landUnit: "Bigha",
    numberOfPasses: 1,
    tripCount: 0,
    ratePerTrip: 0,
    fixedTotalAmount: 0,
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tractorWorkSchema),
    defaultValues: {
      customerId: "",
      machineId: machines[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      operations: [defaultOperation],
      driverCharge: 0,
      helperCharge: 0,
      foodExpense: 0,
      otherExpense: 0,
      dieselCost: 0,
      operatorName: currentUserName,
      advancePaid: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "operations",
  });

  const watchOperations = watch("operations");
  const watchAdvance = watch("advancePaid");
  
  const driverCharge = watch("driverCharge");
  const helperCharge = watch("helperCharge");
  const foodExpense = watch("foodExpense");
  const otherExpense = watch("otherExpense");

  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // Update totals
  useEffect(() => {
    let baseAmount = 0;
    
    watchOperations?.forEach((op) => {
      const isTransport = TRANSPORT_TYPES.includes(op.workType as string);
      if (op.pricingMethod === "FIXED_TOTAL") {
        baseAmount += Number(op.fixedTotalAmount) || 0;
      } else {
        if (isTransport) {
          baseAmount += (Number(op.tripCount) || 0) * (Number(op.ratePerTrip) || 0);
        } else {
          baseAmount += (Number(op.area) || 0) * (Number(op.ratePerArea) || 0);
        }
      }
    });

    const extraCharges = (Number(driverCharge) || 0) + (Number(helperCharge) || 0) + (Number(foodExpense) || 0) + (Number(otherExpense) || 0);
    
    const calculatedTotal = Math.round(baseAmount + extraCharges);
    setTotal(calculatedTotal);
    setBalance(Math.max(0, calculatedTotal - (Number(watchAdvance) || 0)));
  }, [watchOperations, watchAdvance, driverCharge, helperCharge, foodExpense, otherExpense]);

  const handleFormSubmit = async (data: any) => {
    setFormError(null);
    setSuccessInfo(null);
    data.date = `${data.date}T12:00:00.000Z`;

    const res = await createTractorWork(data);

    if (res.success) {
      setSuccessInfo({
        workId: res.work?.id || "",
        smsSent: res.notifications?.smsSent || false,
      });
      reset({
        customerId: "",
        machineId: machines[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        operations: [defaultOperation],
        driverCharge: 0,
        helperCharge: 0,
        foodExpense: 0,
        otherExpense: 0,
        dieselCost: 0,
        operatorName: currentUserName,
        advancePaid: 0,
        notes: "",
      });
      router.refresh();
    } else {
      setFormError(res.error || "Failed to log tractor work");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm("Are you sure you want to delete this Tractor work log?")) {
      setIsDeleting(id);
      const res = await deleteTractorWork(id);
      setIsDeleting(null);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete record");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-5 lg:p-8 glass-panel shadow-lg h-fit relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-600/10 blur-[40px] pointer-events-none" />
        <h3 className="text-lg font-bold text-white mb-6 relative z-10 tracking-tight">Log Tractor Work Entry</h3>
        
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
            {successInfo.workId && (
              <a href={`/api/receipts?id=${successInfo.workId}&type=TRACTOR`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 font-bold text-emerald-400 hover:bg-emerald-500/30 text-xs transition-colors shadow-sm">
                <FileText className="h-4 w-4" /> Open PDF Receipt
              </a>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Select Customer</label>
            <select {...register("customerId")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10">
              <option value="" disabled className="bg-zinc-950">-- Select Customer --</option>
              {customers.map((c) => <option key={c.id} value={c.id} className="bg-zinc-950">{c.name} ({c.village})</option>)}
            </select>
            {errors.customerId && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.customerId.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Machine</label>
              <select {...register("machineId")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10">
                {machines.map((m) => <option key={m.id} value={m.id} className="bg-zinc-950">{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Date</label>
              <input type="date" {...register("date")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10" />
            </div>
          </div>

          {/* Operations Array */}
          <div className="space-y-4">
            {fields.map((field, index) => {
              const opWorkType = watchOperations?.[index]?.workType || "ROTAVATOR";
              const opPricingMethod = watchOperations?.[index]?.pricingMethod || "RATE_PER_UNIT";
              const isTransport = TRANSPORT_TYPES.includes(opWorkType);

              return (
                <div key={field.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-4 relative">
                  {fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove Operation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className={fields.length > 1 ? "pr-8" : ""}>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Work Type {index + 1}</label>
                    <select {...register(`operations.${index}.workType`)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-white outline-none transition-all focus:border-violet-500">
                      {TRACTOR_WORK_TYPES.map((t) => <option key={t.id} value={t.id} className="bg-zinc-950">{t.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Pricing Method</label>
                    <select {...register(`operations.${index}.pricingMethod`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500">
                      <option value="RATE_PER_UNIT">Calculate by Rate</option>
                      <option value="FIXED_TOTAL">Fixed Total Amount</option>
                    </select>
                  </div>

                  {opPricingMethod === "RATE_PER_UNIT" && (
                    <>
                      {isTransport ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Trip Count</label>
                            <input type="number" step="1" {...register(`operations.${index}.tripCount`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Rate / Trip (₹)</label>
                            <input type="number" step="0.1" {...register(`operations.${index}.ratePerTrip`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Land Unit</label>
                              <select {...register(`operations.${index}.landUnit`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500">
                                {LAND_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Qty / Area</label>
                              <input type="number" step="0.1" {...register(`operations.${index}.area`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Rate / Unit (₹)</label>
                              <input type="number" step="0.1" {...register(`operations.${index}.ratePerArea`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">No. of Passes</label>
                              <input type="number" step="1" {...register(`operations.${index}.numberOfPasses`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {opPricingMethod === "FIXED_TOTAL" && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Fixed Total Amount (₹)</label>
                      <input type="number" step="1" {...register(`operations.${index}.fixedTotalAmount`)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                    </div>
                  )}
                </div>
              );
            })}
            
            <button 
              type="button" 
              onClick={() => append(defaultOperation)}
              className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-violet-500 hover:bg-violet-500/10 transition-colors text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Another Work Type
            </button>
          </div>

          <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-zinc-950/30">
            <button
              type="button"
              onClick={() => setShowExtraCharges(!showExtraCharges)}
              className="w-full flex items-center justify-between p-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:bg-zinc-900/60 transition-colors"
            >
              Extra Charges (Optional)
              {showExtraCharges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showExtraCharges && (
              <div className="p-4 grid grid-cols-2 gap-5 bg-zinc-900/20 border-t border-zinc-800/50">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Driver Charge</label>
                  <input type="number" {...register("driverCharge")} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Helper Charge</label>
                  <input type="number" {...register("helperCharge")} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Food Expense</label>
                  <input type="number" {...register("foodExpense")} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Other Expense</label>
                  <input type="number" {...register("otherExpense")} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-white outline-none focus:border-violet-500" />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Operator</label>
              <input type="text" {...register("operatorName")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Advance Paid (₹)</label>
              <input type="number" {...register("advancePaid")} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Notes <span className="text-zinc-600 font-normal lowercase tracking-normal">(optional)</span></label>
            <textarea {...register("notes")} rows={2} className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10" placeholder="e.g. Farmer requested two-pass rotavator..."></textarea>
          </div>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-5 space-y-3 mt-8 shadow-inner">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Operations ({fields.length})</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span>Total Amount</span>
              <span className="text-zinc-300">₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold uppercase tracking-wider border-t border-zinc-800/50 pt-3">
              <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">Remaining Balance</span>
              <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">₹{balance.toLocaleString()}</span>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 py-4 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:hover:scale-100 mt-8">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Generate Invoice"}
          </button>
        </form>
      </div>

      {/* Tractor Logs Table */}
      <div className="lg:col-span-2 space-y-6 w-full">
        <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-5 lg:p-8 glass-panel shadow-lg overflow-x-auto w-full">
          <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Recent Tractor Operations Registry</h3>
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30">
              <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
                <Calendar className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-base text-zinc-300 font-semibold">No tractor logs recorded.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-4 px-4">Customer</th>
                  <th className="pb-4 px-4">Work Details</th>
                  <th className="pb-4 px-4 text-right">Total (₹)</th>
                  <th className="pb-4 px-4 text-right">Advance (₹)</th>
                  <th className="pb-4 px-4 text-right">Balance (₹)</th>
                  <th className="pb-4 px-4 text-center">Receipt</th>
                  {isAdmin && <th className="pb-4 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                {recentLogs.map((log) => {
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-zinc-800/30 group">
                      <td className="py-4 px-4 rounded-l-xl align-top">
                        <span className="font-bold text-white">{log.customer.name}</span>
                        <p className="text-[10px] text-zinc-500 font-medium">{log.customer.village}</p>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          {log.operations?.map((op, idx) => {
                            const isLogTransport = TRANSPORT_TYPES.includes(op.workType);
                            const label = TRACTOR_WORK_TYPES.find(t => t.id === op.workType)?.label || op.workType.replace(/_/g, " ");
                            return (
                              <div key={idx} className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-300">{label}</span>
                                <span className="text-[11px] font-medium text-violet-400">
                                  {isLogTransport 
                                    ? `${op.tripCount || 0} Trips` 
                                    : `${op.area || 0} ${op.landUnit || "Bigha"}`}
                                  {op.numberOfPasses && op.numberOfPasses > 1 ? ` • ${op.numberOfPasses} Passes` : ''}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white align-top">₹{log.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-medium text-emerald-500 align-top">₹{log.advancePaid.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-bold text-amber-500 align-top">₹{log.remainingBalance.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center align-top">
                        <a href={`/api/receipts?id=${log.id}&type=TRACTOR`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 hover:bg-violet-500/20 transition-colors">
                          <FileText className="h-3 w-3" /> PDF
                        </a>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4 text-center rounded-r-xl align-top">
                          <button onClick={() => handleDeleteLog(log.id)} disabled={isDeleting === log.id} className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                            {isDeleting === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
