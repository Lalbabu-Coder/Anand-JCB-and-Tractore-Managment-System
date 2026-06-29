"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const onSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPass = () => {
    if (!forgotEmail) {
      setError("Please fill in your email address first.");
      return;
    }
    setError(null);
    setIsLoading(true);
    // Mock sending reset SMS token
    setTimeout(() => {
      setIsLoading(false);
      setForgotMsg(`A secure reset token has been dispatched via SMS to the mobile number registered with ${forgotEmail}.`);
    }, 1500);
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-zinc-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="z-10 w-full max-w-md rounded-2xl border border-white/5 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Anand JCB & Tractor</h1>
          <p className="mt-2 text-sm text-zinc-400">JCB & Tractor Management System</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {forgotMsg && (
          <div className="mb-6 rounded-lg border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-200">
            <p>{forgotMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
            <div className="relative mt-2">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                {...register("email")}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="admin@anandjcb.com"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-600 outline-none ring-offset-zinc-900 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <button
                type="button"
                onClick={handleForgotPass}
                className="text-xs text-violet-400 hover:text-violet-300 hover:underline outline-none"
              >
                Forgot?
              </button>
            </div>
            <div className="relative mt-2">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-600 outline-none ring-offset-zinc-900 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <span className="text-zinc-500">Don&apos;t have an account? </span>
          <Link href="/register" className="text-violet-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>

        {/* Demo accounts quick-links */}
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <p className="text-center text-xs font-medium text-zinc-500">Quick Login (Demo Accounts)</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => fillCredentials("admin@anandjcb.com", "admin123")}
              className="rounded bg-zinc-950 py-1.5 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800/80"
            >
              Admin
            </button>
            <button
              onClick={() => fillCredentials("accountant@anandjcb.com", "accountant123")}
              className="rounded bg-zinc-950 py-1.5 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800/80"
            >
              Accountant
            </button>
            <button
              onClick={() => fillCredentials("operator@anandjcb.com", "operator123")}
              className="rounded bg-zinc-950 py-1.5 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800/80"
            >
              Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
