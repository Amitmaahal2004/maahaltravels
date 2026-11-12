"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  CreditCard,
  CalendarCheck,
  Users,
  Compass,
  DollarSign,
  Package,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Filter,
  PlaneTakeoff,
  Clock,
  Sparkles,
  Phone,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingPayments: number;
    totalBookings: number;
    totalCustomers: number;
    totalLeads: number;
    totalEmployees: number;
    activePackages: number;
    pendingBookingsCount: number;
    conversionRate: number;
    upcomingTripsCount: number;
  };
  chartData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  recentBookings: any[];
  recentLeads: any[];
  topPackages: any[];
  upcomingTrips: any[];
}

export default function DashboardClient({ initialData }: { initialData?: DashboardData }) {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [timeFilter, setTimeFilter] = useState("all_time");
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetch("/api/crm/dashboard")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setData(res);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [initialData]);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading dynamic CRM metrics from MongoDB Atlas...</span>
      </div>
    );
  }

  const { stats, chartData, recentBookings, recentLeads, topPackages, upcomingTrips } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with Filter */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Database Synchronized • Explore My Packages OS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Agency Operations Overview
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Real-time revenue, bookings pipeline, active departures, and financial margin ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
            >
              <option value="all_time">All Time Overview</option>
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_year">This Fiscal Year</option>
            </select>

            <Link
              href="/crm/bookings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>View Bookings</span>
            </Link>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 8 Primary Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Received in full via verified payments</span>
            </p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.totalBookings}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="text-amber-600 font-semibold">{stats.pendingBookingsCount} pending</span> confirmation
            </p>
          </div>
        </div>

        {/* Net Agency Profit */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Margin (Profit)</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600">{formatCurrency(stats.netProfit)}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              After {formatCurrency(stats.totalExpenses)} operational costs
            </p>
          </div>
        </div>

        {/* Pending Balance Receivables */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Receivables</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">{formatCurrency(stats.pendingPayments)}</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting customer clearance</p>
          </div>
        </div>

        {/* Customers */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.totalCustomers}</p>
            <p className="text-[11px] text-slate-500 mt-1">Registered travel client profiles</p>
          </div>
        </div>

        {/* Leads Pipeline */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inquiries & Leads</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Filter className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.totalLeads}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              {stats.conversionRate}% conversion efficiency
            </p>
          </div>
        </div>

        {/* Active Tour Packages */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Tours</span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.activePackages}</p>
            <p className="text-[11px] text-slate-500 mt-1">Active on public website catalog</p>
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Trips</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <PlaneTakeoff className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.upcomingTripsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ground logistics scheduled</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Chart: Revenue vs Expenses vs Net Profit */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Financial Velocity: Revenue vs Operational Expenses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly breakdown calculated from real MongoDB booking payments and direct expenses.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>Expenses</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Net Profit</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(val: any) => [formatCurrency(Number(val)), ""]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Grid: Recent Bookings & Leads Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Confirmed Bookings</h3>
              <p className="text-xs text-slate-500">Latest client reservations in the agency</p>
            </div>
            <Link
              href="/crm/bookings"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              All Bookings &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No bookings recorded yet.</p>
            ) : (
              recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 font-semibold">{b.bookingRef}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold border ${b.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : b.paymentStatus === "partially_paid"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                      >
                        {b.paymentStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 truncate">{b.customerName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{b.packageName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatCurrency(b.totalAmount)}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(b.departureDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inquiries & Leads */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">New Inquiries & Leads</h3>
              <p className="text-xs text-slate-500">Prospects in the sales conversion pipeline</p>
            </div>
            <Link
              href="/crm/leads"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              Leads Pipeline &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active leads found.</p>
            ) : (
              recentLeads.map((l) => (
                <div
                  key={l._id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{l.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono border border-slate-200">
                        {l.leadSource}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-600 truncate">Interested in: {l.destination}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {l.phone}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold block border ${l.status === "new"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : l.status === "contacted"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                    >
                      {l.status.replace("_", " ")}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Budget: {l.budget ? formatCurrency(l.budget) : "Flexible"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Upcoming Ground Departures & Top Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Ground Logistics */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Ground Operations</h3>
              <p className="text-xs text-slate-500">Scheduled departures with drivers & vehicles</p>
            </div>
            <Link
              href="/crm/operations"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              Operations Desk &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingTrips.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active trips scheduled.</p>
            ) : (
              upcomingTrips.map((op) => (
                <div
                  key={op._id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-blue-600 font-semibold">{op.operationId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {op.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900">{op.packageName}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block">Lead Guest:</span>
                      <span className="text-slate-800 font-medium">{op.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Vehicle & Driver:</span>
                      <span className="text-slate-800 font-medium">{op.vehicleNumber || "Assigned"} ({op.driverName || "Driver"})</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Packages */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Top Performing Tour Packages</h3>
              <p className="text-xs text-slate-500">Ranked by volume of verified bookings</p>
            </div>
            <Link
              href="/crm/packages"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              Tour Catalog &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {topPackages.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No package booking records yet.</p>
            ) : (
              topPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="h-7 w-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate">{pkg.name}</p>
                      <p className="text-[11px] text-slate-500">{pkg.count} confirmed booking(s)</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">{formatCurrency(pkg.revenue)}</span>
                    <span className="block text-[10px] text-emerald-600 font-medium">Total Sales</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

