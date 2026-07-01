"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { Cpu, Truck, DollarSign, Calendar, FileText, ChevronRight, HelpCircle, Phone } from "lucide-react";

interface CustomerDetailsProps {
  customer: {
    id: string;
    name: string;
    mobile: string;
    village: string;
    image?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  metrics: {
    totalWork: number;
    totalPaid: number;
    remaining: number;
  };
  jcbHistory: any[];
  tractorHistory: any[];
  paymentHistory: any[];
  upiString?: string;
}

export function CustomerDetailsClient({
  customer,
  metrics,
  jcbHistory,
  tractorHistory,
  paymentHistory,
  upiString,
}: CustomerDetailsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "jcb" | "tractor" | "payments">("all");
  const [showQrModal, setShowQrModal] = useState(false);

  // Combine work history items for unified timeline view
  const combinedHistory = [
    ...jcbHistory.map((j) => ({
      ...j,
      itemType: "JCB",
      sortDate: new Date(j.date),
    })),
    ...tractorHistory.map((t) => ({
      ...t,
      itemType: "TRACTOR",
      sortDate: new Date(t.date),
    })),
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const filteredHistory = combinedHistory.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "jcb") return item.itemType === "JCB";
    if (activeTab === "tractor") return item.itemType === "TRACTOR";
    return false;
  });

  return (
    <div className="space-y-8">
      {/* Header and Quick Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-8 glass-panel relative overflow-hidden">
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-violet-600/10 blur-[40px]" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {customer.image ? (
              <img src={customer.image} alt={customer.name} className="h-20 w-20 rounded-full object-cover border-2 border-zinc-800 shadow-xl relative z-10" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-amber-500 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-[0_0_15px_rgba(139,92,246,0.3)] relative z-10">
                {customer.name.substring(0, 2)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{customer.name}</h1>
              <span className="rounded-full bg-violet-600/20 px-3 py-1 text-[10px] font-bold tracking-widest text-violet-400 border border-violet-500/30">
                ID: {customer.id.substring(0, 6).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400 mt-2">
              <span className="flex items-center gap-1.5 font-mono">
                <Phone className="h-4 w-4 text-zinc-500" /> {customer.mobile}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5">Village: {customer.village}</span>
              {customer.address && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>Address: {customer.address}</span>
                </>
              )}
            </div>
            {customer.notes && (
              <p className="mt-3 text-xs text-zinc-500 italic bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/50 max-w-xl">
                Notes: {customer.notes}
              </p>
            )}
          </div>
        </div>

        {metrics.remaining > 0 && upiString && (
          <button
            onClick={() => setShowQrModal(true)}
            className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] whitespace-nowrap"
          >
            Show Payment QR
          </button>
        )}
      </div>

      {/* Financial Status Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-6 glass-panel transition-all hover:bg-zinc-800/30 group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
            <DollarSign className="h-32 w-32" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Work Value</span>
          <div className="mt-3 flex items-baseline gap-1 text-white">
            <span className="text-3xl font-extrabold tracking-tight">₹{metrics.totalWork.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[11px] font-medium text-zinc-500 mt-2 uppercase tracking-wider">Sum of all Tractor & JCB jobs logged.</p>
        </div>

        <div className="rounded-3xl border border-emerald-900/30 bg-zinc-900/20 p-6 glass-panel transition-all hover:bg-emerald-900/10 group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5 text-emerald-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
            <DollarSign className="h-32 w-32" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/70">Total Paid Amount</span>
          <div className="mt-3 flex items-baseline gap-1 text-emerald-400">
            <span className="text-3xl font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">₹{metrics.totalPaid.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-500/50 mt-2 uppercase tracking-wider">Sum of advances + module payments.</p>
        </div>

        <div className="rounded-3xl border border-amber-900/30 bg-zinc-900/20 p-6 glass-panel transition-all hover:bg-amber-900/10 group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5 text-amber-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
            <DollarSign className="h-32 w-32" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500/70">Outstanding Due</span>
          <div className="mt-3 flex items-baseline gap-1 text-amber-400">
            <span className="text-3xl font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">₹{metrics.remaining.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[11px] font-medium text-amber-500/50 mt-2 uppercase tracking-wider">Pending collection balance.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-900/50 pb-px gap-6 overflow-x-auto hide-scrollbar">
        {[
          { id: "all", label: "All History" },
          { id: "jcb", label: "JCB Excavation" },
          { id: "tractor", label: "Tractor Tillage" },
          { id: "payments", label: "Payments Log" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 outline-none whitespace-nowrap ${
              activeTab === tab.id
                ? "border-violet-500 text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "payments" ? (
        <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-6 glass-panel shadow-lg overflow-x-auto">
          {paymentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30">
              <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
                <DollarSign className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-base text-zinc-300 font-semibold">No payments recorded.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-4 px-4">Date</th>
                  <th className="pb-4 px-4">Method</th>
                  <th className="pb-4 px-4">Reference ID</th>
                  <th className="pb-4 px-4">Notes</th>
                  <th className="pb-4 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-800/30 group">
                    <td className="py-4 px-4 rounded-l-xl font-medium">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <span className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-300 shadow-sm">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 font-mono text-xs">{p.referenceId || "—"}</td>
                    <td className="py-4 px-4 text-zinc-400">{p.notes || "—"}</td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-500 rounded-r-xl">₹{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 glass-panel py-20 text-center">
              <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
                <Calendar className="h-10 w-10 text-zinc-600" />
              </div>
              <p className="text-lg text-white font-bold tracking-tight">No work log records found.</p>
              <p className="mt-1 text-sm text-zinc-500">Work entries will appear here once logged.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-zinc-900/50 bg-zinc-900/30 p-6 glass-panel shadow-sm transition-all hover:bg-zinc-800/40 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="flex items-start gap-5">
                  <div className={`rounded-2xl p-4 shrink-0 shadow-inner ${
                    item.itemType === "JCB" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {item.itemType === "JCB" ? <Cpu className="h-7 w-7" /> : <Truck className="h-7 w-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {item.itemType === "JCB" 
                          ? `JCB - ${
                              item.workType === "TALI_LOADING" 
                                ? "Tali Loading" 
                                : item.workType === "TRACK_LOADING" 
                                ? "Track Loading" 
                                : "Excavation"
                            }` 
                          : `Tractor - ${item.workType.replace(/_/g, " ")}`}
                      </h4>
                      <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
 
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-xs text-zinc-400">
                      <div>
                        <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Operator</span> 
                        <span className="font-medium text-zinc-300">{item.operatorName}</span>
                      </div>
                      {item.itemType === "JCB" ? (
                        <>
                          <div>
                            <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Billing</span> 
                            <span className="font-medium text-zinc-300">
                              {item.pricingMethod === "TRIP" 
                                ? `${item.tripCount || 0} Trips` 
                                : `${(item.totalHours || 0).toFixed(1)} hrs`}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Rate</span> 
                            <span className="font-medium text-zinc-300">
                              ₹{item.pricingMethod === "TRIP" 
                                ? (item.ratePerTrip || 0) 
                                : (item.ratePerHour || 0)}
                              {item.pricingMethod === "TRIP" ? " / Trip" : " / hr"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Area</span> 
                            <span className="font-medium text-zinc-300">{item.area?.toFixed(1)} {item.landUnit}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Rate</span> 
                            <span className="font-medium text-zinc-300">₹{item.ratePerArea}</span>
                          </div>
                        </>
                      )}
                      {item.notes && (
                        <div className="col-span-2">
                          <span className="text-zinc-600 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Notes</span> 
                          <span className="font-medium text-zinc-300">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center md:items-end justify-between md:flex-col gap-3 pt-5 md:pt-0 border-t border-zinc-900/50 md:border-0 pl-0 md:pl-6 md:border-l">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total Amount</span>
                    <span className="text-xl font-extrabold text-white">₹{item.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/receipts?id=${item.id}&type=${item.itemType}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-500/20 transition-colors"
                    >
                      <FileText className="h-4 w-4" /> View PDF
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl text-center">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-900">
              <h3 className="text-sm font-bold text-white">Quick UPI Payment</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Close
              </button>
            </div>
            
            <p className="text-xs text-zinc-400 mb-6">
              Scan this QR code using any UPI app (GPay, PhonePe, Paytm) to transfer the remaining due balance of{" "}
              <span className="font-bold text-white">₹{metrics.remaining.toLocaleString()}</span>.
            </p>

            <div className="mx-auto rounded-xl border border-zinc-900 bg-white p-4 inline-block shadow-inner">
              <QRCode value={upiString || ""} size={180} />
            </div>

            <p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{customer.name}</p>
            <p className="text-[10px] text-zinc-600 mt-1 font-mono">{upiString?.split("&")[0]?.split("=")[1] || ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}
