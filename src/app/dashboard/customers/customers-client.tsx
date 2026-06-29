"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer, deleteCustomer } from "@/app/actions/customer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/lib/validation";
import { Search, Plus, Edit2, Trash2, X, Loader2, AlertCircle, Users } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/ImageUpload";

interface CustomerData {
  id: string;
  name: string;
  mobile: string;
  village: string;
  image?: string | null;
  address?: string | null;
  notes?: string | null;
  totalWork: number;
  totalPaid: number;
  remaining: number;
}

interface CustomersClientProps {
  initialCustomers: CustomerData[];
  isAdmin: boolean;
}

export function CustomersClient({ initialCustomers, isAdmin }: CustomersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      village: "",
      address: "",
      notes: "",
      imageBase64: "",
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    router.replace(`/dashboard/customers?q=${val}`);
  };

  const handleOpenNew = () => {
    setEditingCustomer(null);
    reset({
      name: "",
      mobile: "",
      village: "",
      address: "",
      notes: "",
      imageBase64: "",
    });
    setFormError(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (c: CustomerData) => {
    setEditingCustomer(c);
    reset({
      name: c.name,
      mobile: c.mobile,
      village: c.village,
      address: c.address || "",
      notes: c.notes || "",
      imageBase64: "",
    });
    setFormError(null);
    setIsOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    setFormError(null);
    let res;
    if (editingCustomer) {
      res = await updateCustomer(editingCustomer.id, data);
    } else {
      res = await createCustomer(data);
    }

    if (res.success) {
      setIsOpen(false);
      reset();
      router.refresh();
    } else {
      setFormError(res.error || "Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer? This will remove all their work history permanently!")) {
      startTransition(async () => {
        const res = await deleteCustomer(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to delete customer");
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Customer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-8 glass-panel relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-600/10 blur-[40px]" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-lg">Manage customer profiles and review complete billing ledgers.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, mobile, or village..."
          className="w-full rounded-2xl border border-zinc-900/50 bg-zinc-900/30 py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500 glass-panel shadow-sm"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-6 glass-panel shadow-lg overflow-x-auto">
        {initialCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30">
            <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
              <Users className="h-10 w-10 text-zinc-500" />
            </div>
            <p className="text-base text-zinc-300 font-semibold">No customers found.</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm">Create profiles to start recording tractor and JCB work entries.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-4 px-4 w-12">Pic</th>
                <th className="pb-4 px-4">Name</th>
                <th className="pb-4 px-4">Village</th>
                <th className="pb-4 px-4">Mobile</th>
                <th className="pb-4 px-4 text-right">Total Work</th>
                <th className="pb-4 px-4 text-right">Total Paid</th>
                <th className="pb-4 px-4 text-right">Outstanding</th>
                <th className="pb-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {initialCustomers.map((c) => (
                <tr key={c.id} className="text-zinc-300 transition-colors hover:bg-zinc-800/30 group">
                  <td className="py-4 px-4 rounded-l-xl">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="h-8 w-8 rounded-full object-cover border border-zinc-700" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-[10px] uppercase border border-violet-500/30">
                        {c.name.substring(0, 2)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-bold text-white hover:text-violet-400 transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-zinc-400">{c.village}</td>
                  <td className="py-4 px-4 text-zinc-500 font-mono text-xs">{c.mobile}</td>
                  <td className="py-4 px-4 text-right font-semibold">₹{c.totalWork.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-emerald-500 font-medium">₹{c.totalPaid.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-bold text-amber-500">₹{c.remaining.toLocaleString()}</td>
                  <td className="py-4 px-4 text-center rounded-r-xl">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800/60 bg-zinc-950/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] glass-panel relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-600/10 blur-[64px] pointer-events-none" />
            
            <div className="flex items-center justify-between pb-4 mb-6">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {editingCustomer ? "Edit Customer Details" : "Register New Customer"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 relative z-10">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ImageUpload
                    entityType="CUSTOMER"
                    currentImage={editingCustomer?.image}
                    onUploadSuccess={(val) => setValue("imageBase64", val)}
                    className="mb-3 shadow-lg border-2 border-zinc-800 relative z-10"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Customer Photo</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                  placeholder="e.g. Ramesh Patel"
                />
                {errors.name && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.name.message as string}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Mobile (10 digits)</label>
                  <input
                    type="text"
                    {...register("mobile")}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 font-mono"
                    placeholder="9876543210"
                  />
                  {errors.mobile && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.mobile.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Village</label>
                  <input
                    type="text"
                    {...register("village")}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                    placeholder="e.g. Rampur"
                  />
                  {errors.village && <p className="mt-1.5 text-xs font-medium text-red-400">{errors.village.message as string}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Address <span className="text-zinc-600 font-normal lowercase tracking-normal">(optional)</span></label>
                <input
                  type="text"
                  {...register("address")}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                  placeholder="Street details, landmarks"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Notes <span className="text-zinc-600 font-normal lowercase tracking-normal">(optional)</span></label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 resize-none"
                  placeholder="Add details on field locations, credits..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-8">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-zinc-700 bg-zinc-800/50 px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
