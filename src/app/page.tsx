"use client";

import React from "react";
import Link from "next/link";
import { Cpu, Truck, BarChart3, Bell, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Anand JCB & Tractor
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
        {/* Glow rings */}
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600/5 blur-3xl" />

        <div className="mx-auto max-w-3xl z-10 relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
            Now Live: PWA Support & Automated Reminders
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Modern Ledger for <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">JCB & Tractor</span> Operations
          </h1>
          <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
            Eliminate paperwork. Log excavation and field ploughing work, track customer balances, generate PDF receipts, and dispatch instant SMS notifications and WhatsApp alerts.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-violet-500"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-base font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-900 py-24 bg-zinc-900/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Complete Fleet & Customer Registry</h2>
            <p className="mt-4 text-zinc-400">Everything you need to run your machinery leasing business at scale.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">JCB Work Module</h3>
              <p className="mt-2 text-sm text-zinc-400">Log excavating hours, specify operator names, diesel charges, calculate totals and pending balances instantly.</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Tractor Work Module</h3>
              <p className="mt-2 text-sm text-zinc-400">Log area-based tasks: rotavator, ploughing, seed drill. Rates adjust dynamically per bigha or acre.</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Interactive Ledger</h3>
              <p className="mt-2 text-sm text-zinc-400">Get a consolidated timeline of customer activity, logs, payments received, and export PDF summaries.</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Automated SMS</h3>
              <p className="mt-2 text-sm text-zinc-400">Sends details of task, advance paid, and remaining balance automatically. Integrates 7-day payment triggers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-zinc-900 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-zinc-400">No hidden fees. Choose a plan that suits your fleet size.</p>
          </div>

          <div className="mt-16 flex flex-col justify-center items-center gap-8 lg:flex-row">
            {/* Plan 1 */}
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/40 p-8">
              <h3 className="text-xl font-bold text-white">Single Machine</h3>
              <p className="mt-2 text-sm text-zinc-400">Perfect for single machine owners starting bookkeeping.</p>
              <p className="mt-6 text-4xl font-extrabold text-white">₹999<span className="text-sm font-medium text-zinc-500">/mo</span></p>
              <ul className="mt-8 space-y-4 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Up to 50 Customer Accounts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Standard SMS Notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> PDF Receipt Generation
                </li>
              </ul>
              <Link href="/login" className="mt-8 block w-full rounded-lg bg-zinc-950 py-3 text-center text-sm font-semibold hover:bg-zinc-800">
                Choose Plan
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="w-full max-w-sm rounded-xl border border-violet-500/20 bg-zinc-900/80 p-8 ring-2 ring-violet-500/20 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                Popular
              </span>
              <h3 className="text-xl font-bold text-white">Fleet Premium</h3>
              <p className="mt-2 text-sm text-zinc-400">For multi-operator fleets and agricultural contractors.</p>
              <p className="mt-6 text-4xl font-extrabold text-white">₹2,499<span className="text-sm font-medium text-zinc-500">/mo</span></p>
              <ul className="mt-8 space-y-4 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Unlimited Customers & Operators
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Custom SMS & WhatsApp API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Machine Expense & Diesel Logs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" /> Offline PWA Access
                </li>
              </ul>
              <Link href="/login" className="mt-8 block w-full rounded-lg bg-violet-600 py-3 text-center text-sm font-semibold text-white hover:bg-violet-500">
                Choose Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 text-zinc-600">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs">
          <p>© 2026 Anand JCB & Tractor. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="#" className="hover:text-zinc-400">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400">Terms of Service</a>
            <a href="#" className="hover:text-zinc-400">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
