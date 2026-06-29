"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface ChartData {
  name: string;
  income: number;
  expense: number;
  profit: number;
}

interface MachineData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  monthlyTrends: ChartData[];
  machineProfits: MachineData[];
  dieselData: { name: string; cost: number }[];
}

export function DashboardCharts({ monthlyTrends, machineProfits, dieselData }: DashboardChartsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Monthly Income/Expense Trend (Area Chart) */}
      <div className="lg:col-span-2 rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Monthly Income & Profit Analytics</h3>
        <p className="text-xs text-zinc-600 mt-1">Shows earnings trend, fuel expense, and net revenue.</p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Area type="monotone" dataKey="income" name="Gross Income (₹)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" name="Net Profit (₹)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Wise Revenue breakdown (Pie Chart) */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Machine Profit Share</h3>
        <p className="text-xs text-zinc-600 mt-1">Breakdown of gross earnings by machine.</p>
        <div className="mt-6 h-80 flex flex-col justify-center items-center">
          {machineProfits.length === 0 ? (
            <div className="text-zinc-600 text-xs py-8">No data logs yet</div>
          ) : (
            <div className="w-full h-full relative">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={machineProfits}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {machineProfits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {machineProfits.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-zinc-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diesel expense breakdown (Bar Chart) */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Diesel Expenses</h3>
        <p className="text-xs text-zinc-600 mt-1">Fuel cost aggregation by operator.</p>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dieselData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }}
              />
              <Bar dataKey="cost" name="Diesel Cost (₹)" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
