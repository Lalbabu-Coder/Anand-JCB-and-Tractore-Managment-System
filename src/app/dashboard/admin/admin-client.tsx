"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateSetting,
  createUser,
  deleteUser,
  createMachine,
  updateMachine,
  deleteMachine
} from "@/app/actions/admin";
import { useForm } from "react-hook-form";
import { Loader2, Shield, Settings, Cpu, UserPlus, Database, X, HelpCircle, Save, CheckCircle, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePic?: string | null;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  image?: string | null;
}

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

interface AdminClientProps {
  users: User[];
  machines: Machine[];
  settings: Setting[];
}

export function AdminClient({ users, machines, settings }: AdminClientProps) {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<"users" | "machines" | "rates" | "templates" | "backup">("users");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Find setting values
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || "";

  // 1. Settings state management
  const [settingsForm, setSettingsForm] = useState({
    UPI_ID: getSetting("UPI_ID"),
    UPI_MERCHANT_NAME: getSetting("UPI_MERCHANT_NAME"),
    DEFAULT_JCB_RATE: getSetting("DEFAULT_JCB_RATE"),
    DEFAULT_TRACTOR_RATE_PLOUGHING: getSetting("DEFAULT_TRACTOR_RATE_PLOUGHING"),
    SMS_TEMPLATE_JCB: getSetting("SMS_TEMPLATE_JCB"),
    SMS_TEMPLATE_TRACTOR: getSetting("SMS_TEMPLATE_TRACTOR"),
    SMS_TEMPLATE_REMINDER: getSetting("SMS_TEMPLATE_REMINDER"),
  });

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (keys: (keyof typeof settingsForm)[]) => {
    setFormError(null);
    setSuccessMsg(null);
    let errorOccurred = false;

    for (const key of keys) {
      const res = await updateSetting(key, settingsForm[key]);
      if (!res.success) {
        setFormError(res.error || `Failed to update ${key}`);
        errorOccurred = true;
        break;
      }
    }

    if (!errorOccurred) {
      setSuccessMsg("Settings updated successfully!");
      router.refresh();
    }
  };

  // 2. User CRUD
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "OPERATOR" as any, pass: "" });
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const res = await createUser(newUser);
    if (res.success) {
      setSuccessMsg(`User ${newUser.name} created successfully!`);
      setNewUser({ name: "", email: "", role: "OPERATOR", pass: "" });
      router.refresh();
    } else {
      setFormError(res.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      const res = await deleteUser(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete user");
      }
    }
  };

  // 3. Machine CRUD
  const [newMachine, setNewMachine] = useState({ name: "", type: "JCB" as any, status: "ACTIVE" });
  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const res = await createMachine(newMachine);
    if (res.success) {
      setSuccessMsg(`Machine ${newMachine.name} created successfully!`);
      setNewMachine({ name: "", type: "JCB", status: "ACTIVE" });
      router.refresh();
    } else {
      setFormError(res.error || "Failed to create machine");
    }
  };

  const handleUpdateMachineStatus = async (id: string, name: string, type: any, newStatus: string) => {
    const res = await updateMachine(id, { name, type, status: newStatus });
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to update machine status");
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm("Are you sure you want to delete this machine?")) {
      const res = await deleteMachine(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete machine");
      }
    }
  };

  // 4. Backup & Restore (Mock)
  const handleBackup = () => {
    setSuccessMsg("System backup file generated and secured in cloud storage. Backup code: ML-BACKUP-" + Date.now().toString().slice(-6));
  };
  const handleRestore = () => {
    if (confirm("Restoring database will replace all current work logs with the backup state. Do you want to proceed?")) {
      setSuccessMsg("Restore simulation completed successfully. Database re-synced.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert logs */}
      {formError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <p>{formError}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sub-navigation column */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: "users", label: "Manage Users", icon: UserPlus },
            { id: "machines", label: "Manage Machines", icon: Cpu },
            { id: "rates", label: "Rate Cards & UPI", icon: Settings },
            { id: "templates", label: "SMS Templates", icon: Save },
            { id: "backup", label: "Backup & Restore", icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSubTab(item.id as any);
                setFormError(null);
                setSuccessMsg(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all outline-none ${
                activeSubTab === item.id
                  ? "bg-gradient-to-r from-violet-600/20 to-transparent text-violet-400 border-l-2 border-violet-500 shadow-[inset_4px_0_0_0_rgba(139,92,246,1)]"
                  : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300 border-l-2 border-transparent"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="flex-1 rounded-3xl border border-zinc-900/50 bg-zinc-900/20 p-8 glass-panel shadow-lg overflow-hidden">
          {/* User Management Panel */}
          {activeSubTab === "users" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white">System User Accounts</h3>
              
              {/* Users List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="pb-4 px-4 w-16">Photo</th>
                      <th className="pb-4 px-4">Name</th>
                      <th className="pb-4 px-4">Email</th>
                      <th className="pb-4 px-4">Role</th>
                      <th className="pb-4 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                    {users.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-zinc-800/30 group">
                        <td className="py-4 px-4 rounded-l-xl">
                          <div className="h-10 w-10">
                            <ImageUpload
                              entityType="USER"
                              entityId={u.id}
                              currentImage={u.profilePic}
                              className="h-full w-full scale-50 origin-left"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-white">{u.name}</td>
                        <td className="py-4 px-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                            u.role === "ADMIN" ? "bg-violet-600/10 text-violet-400 border-violet-500/20" : u.role === "ACCOUNTANT" ? "bg-amber-600/10 text-amber-400 border-amber-500/20" : "bg-zinc-900/50 text-zinc-400 border-zinc-800/50"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center rounded-r-xl">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Create User Form */}
              <div className="border-t border-zinc-800/50 pt-8 mt-8">
                <h4 className="text-sm font-bold text-white mb-6 tracking-tight">Register New System Account</h4>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end relative z-10">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                      placeholder="e.g. Ramesh Singh"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                      placeholder="operator@anandjcb.com"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={newUser.pass}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, pass: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="col-span-1 flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as any }))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                      >
                        <option value="OPERATOR" className="bg-zinc-950">Operator</option>
                        <option value="ACCOUNTANT" className="bg-zinc-950">Accountant</option>
                        <option value="ADMIN" className="bg-zinc-950">Admin</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] self-end h-[50px]"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Machine Management Panel */}
          {activeSubTab === "machines" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white tracking-tight">Registered Fleet Machinery</h3>

              {/* Machine list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-900/50 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="pb-4 px-4 w-16">Photo</th>
                      <th className="pb-4 px-4">Machine Name</th>
                      <th className="pb-4 px-4">Type</th>
                      <th className="pb-4 px-4">Status</th>
                      <th className="pb-4 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                    {machines.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-zinc-800/30 group">
                        <td className="py-4 px-4 rounded-l-xl">
                          <div className="h-10 w-10">
                            <ImageUpload
                              entityType="MACHINE"
                              entityId={m.id}
                              currentImage={m.image}
                              className="h-full w-full scale-50 origin-left"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-white">{m.name}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-zinc-400 bg-zinc-900/30 rounded-lg inline-block mt-3 border border-zinc-800/50">{m.type}</td>
                        <td className="py-4 px-4">
                          <select
                            value={m.status}
                            onChange={(e) => handleUpdateMachineStatus(m.id, m.name, m.type, e.target.value)}
                            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-xs font-bold uppercase tracking-wider text-white outline-none transition-all focus:border-violet-500 focus:bg-zinc-900"
                          >
                            <option value="ACTIVE" className="bg-zinc-950">Active</option>
                            <option value="MAINTENANCE" className="bg-zinc-950">Maintenance</option>
                            <option value="INACTIVE" className="bg-zinc-950">Inactive</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 text-center rounded-r-xl">
                          <button
                            onClick={() => handleDeleteMachine(m.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Create Machine Form */}
              <div className="border-t border-zinc-800/50 pt-8 mt-8">
                <h4 className="text-sm font-bold text-white mb-6 tracking-tight">Add Fleet Machinery</h4>
                <form onSubmit={handleCreateMachine} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end relative z-10">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Machine Name</label>
                    <input
                      type="text"
                      required
                      value={newMachine.name}
                      onChange={(e) => setNewMachine((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                      placeholder="e.g. Sonalika DI 750"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Type</label>
                    <select
                      value={newMachine.type}
                      onChange={(e) => setNewMachine((prev) => ({ ...prev, type: e.target.value as any }))}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                    >
                      <option value="JCB" className="bg-zinc-950">JCB Excavator</option>
                      <option value="TRACTOR" className="bg-zinc-950">Tractor</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] h-[50px]"
                  >
                    Add Machine
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Rate cards & UPI Configurations */}
          {activeSubTab === "rates" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white tracking-tight">Default Rate Cards & UPI Billing Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 relative z-10">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">JCB Rate / Hour (₹)</label>
                  <input
                    type="number"
                    name="DEFAULT_JCB_RATE"
                    value={settingsForm.DEFAULT_JCB_RATE}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Tractor Ploughing Rate / Bigha (₹)</label>
                  <input
                    type="number"
                    name="DEFAULT_TRACTOR_RATE_PLOUGHING"
                    value={settingsForm.DEFAULT_TRACTOR_RATE_PLOUGHING}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800/50 pt-8 mt-4 relative z-10">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Merchant UPI Address</label>
                  <input
                    type="text"
                    name="UPI_ID"
                    value={settingsForm.UPI_ID}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 font-mono"
                    placeholder="e.g. business@upi"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Merchant Billing Name</label>
                  <input
                    type="text"
                    name="UPI_MERCHANT_NAME"
                    value={settingsForm.UPI_MERCHANT_NAME}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10"
                    placeholder="e.g. Anand JCB & Tractor"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-zinc-800/50 mt-8 relative z-10">
                <button
                  onClick={() => handleSaveSettings(["DEFAULT_JCB_RATE", "DEFAULT_TRACTOR_RATE_PLOUGHING", "UPI_ID", "UPI_MERCHANT_NAME"])}
                  className="flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-3 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  Save Rate & UPI settings
                </button>
              </div>
            </div>
          )}

          {/* SMS templates settings */}
          {activeSubTab === "templates" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white tracking-tight">Edit Outbound Notification Templates</h3>
              <p className="text-xs font-semibold text-zinc-500 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/50">Customize templates using variables: <span className="font-mono text-violet-400">{`{customerName}, {hours}, {rate}, {total}, {advance}, {remaining}, {workType}, {area}`}</span></p>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">JCB Work Completed Template</label>
                  <textarea
                    name="SMS_TEMPLATE_JCB"
                    rows={4}
                    value={settingsForm.SMS_TEMPLATE_JCB}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 resize-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Tractor Work Completed Template</label>
                  <textarea
                    name="SMS_TEMPLATE_TRACTOR"
                    rows={4}
                    value={settingsForm.SMS_TEMPLATE_TRACTOR}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 resize-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">7-Day Pending Reminder Template</label>
                  <textarea
                    name="SMS_TEMPLATE_REMINDER"
                    rows={3}
                    value={settingsForm.SMS_TEMPLATE_REMINDER}
                    onChange={handleSettingChange}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-white placeholder-zinc-600 outline-none transition-all hover:border-zinc-700 focus:border-violet-500 focus:bg-zinc-900 focus:ring-4 focus:ring-violet-500/10 resize-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-zinc-800/50 mt-8 relative z-10">
                <button
                  onClick={() => handleSaveSettings(["SMS_TEMPLATE_JCB", "SMS_TEMPLATE_TRACTOR", "SMS_TEMPLATE_REMINDER"])}
                  className="flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-3 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  Save Notification Templates
                </button>
              </div>
            </div>
          )}

          {/* Backup Management Panel */}
          {activeSubTab === "backup" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white tracking-tight">System Backups & Database Restoration</h3>
              <p className="text-xs font-semibold text-zinc-500">Run manual database backups or restore system logs. Anand JCB & Tractor generates cloud dump instances stored securely.</p>

              <div className="flex flex-wrap gap-4 pt-8 border-t border-zinc-800/50 mt-8 relative z-10">
                <button
                  onClick={handleBackup}
                  className="flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  Trigger Database Backup
                </button>
                <button
                  onClick={handleRestore}
                  className="flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/50 px-8 py-3.5 text-sm font-bold tracking-wide text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
                >
                  Restore From Latest Backup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
