"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function ReportsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/reports")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Month", "Revenue (INR)", "Expenses (INR)", "Net Profit (INR)"],
      ...data.monthlyFinancials.map((m: any) => [m.month, m.revenue, m.expenses, m.profit]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Himalayan_Vistas_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Aggregating Enterprise Analytics from MongoDB Atlas...</span>
      </div>
    );
  }

  const { summary, monthlyFinancials, expenseBreakdown } = data;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Reports & Analytics</h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time business intelligence, profit & loss analysis, and customer conversion funnels.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          Export Financial CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Gross Operating Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Operating Expenses</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Net Operating Profit</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(summary.netProfit)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Profit Margin Rate</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{summary.marginRate}%</p>
        </div>
      </div>

      {/* Monthly Revenue vs Expense Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-400" />
            Monthly Revenue vs Expenses (Last 6 Months)
          </h2>
          <span className="text-xs text-slate-400">Values in INR (₹)</span>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [formatCurrency(Number(val)), ""]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="revenue" name="Revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <PieIcon className="h-5 w-5 text-indigo-400" />
          Expense Distribution by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseBreakdown.map((item: any, idx: number) => {
            const percent = summary.totalExpenses > 0 ? Math.round((item.amount / summary.totalExpenses) * 100) : 0;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">{item.category}</span>
                  <span className="text-rose-400">{formatCurrency(item.amount)} ({percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
