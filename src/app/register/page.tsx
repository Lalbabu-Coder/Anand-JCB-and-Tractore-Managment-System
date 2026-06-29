"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";
import { User, Mail, Lock, Loader2, AlertCircle, CheckCircle, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "OPERATOR",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const res = await registerUser(form);
    setIsLoading(false);

    if (res.success) {
      setSuccess("Account registered successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(res.error || "Failed to create account");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      {/* Background blur rings */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-400">Join Anand JCB & Tractor Operator System</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
            <div className="relative mt-2">
              <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleInputChange}
                placeholder="e.g. Ramesh Singh"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
            <div className="relative mt-2">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleInputChange}
                placeholder="e.g. operator@anandjcb.com"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">System Role</label>
            <div className="relative mt-2">
              <Shield className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <select
                name="role"
                value={form.role}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="OPERATOR">Operator (Log hours & work)</option>
                <option value="ACCOUNTANT">Accountant (Manage bills & payments)</option>
                <option value="ADMIN">Admin (Full system credentials)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Secure Password</label>
            <div className="relative mt-2">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <span className="text-zinc-500">Already have an account? </span>
          <Link href="/login" className="text-violet-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
