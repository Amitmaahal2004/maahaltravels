"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SafeUser } from "@/types/auth.types";
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
  Building,
  Shield,
  KeyRound,
  FileSpreadsheet,
  Receipt,
  Plus,
  CheckSquare,
  CalendarOff,
  UserCheck,
  MapPin,
  Truck,
  Globe,
  BarChart3,
  Settings,
  RefreshCw,
  Activity,
  Layers,
  ChevronRight,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardMetrics } from "@/services/dashboard.service";

interface DashboardClientProps {
  user?: SafeUser;
  initialData?: DashboardMetrics;
}

export default function DashboardClient({ user, initialData }: DashboardClientProps) {
  const [data, setData] = useState<DashboardMetrics | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dynamic RBAC Evaluator
  const isSuperAdmin = user?.role?.slug === "super-admin";
  const isAdmin = user?.role?.slug === "admin";
  const isExecutive = isSuperAdmin || isAdmin;

  // Widget Authorization Check (Enforces Super Admin Control)
  const canWidget = (widgetId: string): boolean => {
    if (!user) return true;
    if (isSuperAdmin) return true;
    return data?.authorizedWidgets?.includes(widgetId) ?? false;
  };

  const hasAction = (moduleId: string, action: string) => {
    if (!user) return true;
    if (isExecutive) return true;
    return user.permissions?.some(
      (p) => p.module === moduleId && (p.action === action || p.action === "manage")
    );
  };

  const hasModule = (moduleId: string) => {
    if (!user) return true;
    if (isExecutive) return true;
    return user.permissions?.some(
      (p) => p.module === moduleId && (p.action === "view" || p.action === "manage")
    );
  };

  const refreshData = () => {
    setLoading(true);
    setFetchError(null);
    fetch("/api/crm/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          setFetchError(res.error || "Failed to load dashboard metrics");
        }
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || "Network error loading dashboard");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!initialData) {
      refreshData();
    }
  }, [initialData]);

  if (loading && !data) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-xs min-h-[360px]">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-600">Loading authorized CRM telemetry from MongoDB Atlas...</span>
      </div>
    );
  }

  if (fetchError && !data) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-rose-200 shadow-xs space-y-4 max-w-lg mx-auto my-12">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Dashboard Synchronization Error</h3>
          <p className="text-xs text-slate-500 mt-1">{fetchError}</p>
        </div>
        <button
          onClick={refreshData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Fallback defaults to guarantee zero rendering exceptions
  const safeData: DashboardMetrics = data || {
    stats: {
      totalRevenue: null,
      totalExpenses: null,
      netProfit: null,
      pendingPayments: null,
      totalBookings: 0,
      totalCustomers: 0,
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalQuotations: 0,
      acceptedQuotations: 0,
      activePackages: 0,
      pendingBookingsCount: 0,
      upcomingTripsCount: 0,
      activeOperationsCount: 0,
      totalEmployees: 0,
      presentTodayCount: 0,
      pendingLeavesCount: 0,
      myAttendanceStatus: "Active",
      totalTasks: 0,
      pendingTasksCount: 0,
    },
    chartData: [],
    recentBookings: [],
    recentLeads: [],
    topPackages: [],
    upcomingTrips: [],
    recentTasks: [],
    recentActivities: [],
    departmentPerformance: [],
    authorizedWidgets: [],
    authorizedModules: [],
    userScope: "assigned",
  };

  const { stats, chartData, recentBookings, recentLeads, topPackages, upcomingTrips, recentTasks, recentActivities, userScope } = safeData;

  // Check if any financial widget is authorized
  const showFinances =
    canWidget("total_revenue") ||
    canWidget("net_profit") ||
    canWidget("total_expenses") ||
    canWidget("outstanding_receivables");

  // Check if any sales widget is authorized
  const showSales =
    canWidget("total_leads") ||
    canWidget("bookings_overview") ||
    canWidget("quotations_overview") ||
    canWidget("sales_performance") ||
    canWidget("total_customers");

  // Check if any operations widget is authorized
  const showOperations =
    canWidget("upcoming_trips") ||
    canWidget("active_bookings") ||
    canWidget("trip_status");

  // Check if any HR widget is authorized
  const showHR =
    canWidget("total_employees") ||
    canWidget("attendance_overview") ||
    canWidget("leave_overview");

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. TOP BANNER WITH ROLE-AWARE CONTEXT & QUICK ACTIONS */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>MongoDB Atlas Synchronized</span>
              </span>

              {user?.role && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                  <KeyRound className="h-3 w-3" />
                  <span>Role: {user.role.name}</span>
                </span>
              )}

              {user?.department && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                  <Building className="h-3 w-3" />
                  <span>{user.department.name}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono capitalize">
                Scope: {userScope.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {user ? `Welcome, ${user.name}` : "Operations Dashboard"}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              {isSuperAdmin
                ? "Full executive oversight: company revenue, net profit margin, reservations pipeline, and ground execution."
                : `Role-tailored workspace for ${user?.role?.name || "Staff Member"}. Displaying only authorized metrics according to Super Admin widget permissions.`}
            </p>
          </div>

          {/* Quick Action Buttons dynamically matching user permissions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {hasAction("leads", "create") && (
              <Link
                href="/crm/leads"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Lead</span>
              </Link>
            )}

            {hasAction("quotations", "create") && (
              <Link
                href="/crm/quotations"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                <span>New Quote</span>
              </Link>
            )}

            {hasAction("bookings", "create") && (
              <Link
                href="/crm/bookings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>New Booking</span>
              </Link>
            )}

            {hasAction("invoices", "create") && (
              <Link
                href="/crm/invoices"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <Receipt className="h-3.5 w-3.5 text-amber-600" />
                <span>Issue Invoice</span>
              </Link>
            )}

            {hasAction("tasks", "create") && (
              <Link
                href="/crm/tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                <span>New Task</span>
              </Link>
            )}

            {hasAction("leaves", "create") && (
              <Link
                href="/crm/leaves"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <CalendarOff className="h-3.5 w-3.5 text-purple-600" />
                <span>Apply Leave</span>
              </Link>
            )}

            {hasModule("attendance") && (
              <Link
                href="/crm/attendance"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Attendance</span>
              </Link>
            )}
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. DYNAMIC KPI CARDS (STRICTLY GATED BY SUPER ADMIN WIDGET PERMISSIONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* FINANCIAL CARDS: STRICTLY GUARDED */}
        {canWidget("total_revenue") && stats.totalRevenue !== null && (
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
                <span>Received via verified payments</span>
              </p>
            </div>
          </div>
        )}

        {canWidget("net_profit") && stats.netProfit !== null && (
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
                Net operational profitability
              </p>
            </div>
          </div>
        )}

        {canWidget("total_expenses") && stats.totalExpenses !== null && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Direct tour and agency costs
              </p>
            </div>
          </div>
        )}

        {canWidget("outstanding_receivables") && stats.pendingPayments !== null && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Receivables</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{formatCurrency(stats.pendingPayments)}</p>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting customer balance clearance</p>
            </div>
          </div>
        )}

        {/* SALES & BOOKINGS CARDS */}
        {canWidget("bookings_overview") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {userScope === "assigned" ? "My Bookings" : "Total Bookings"}
              </span>
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
        )}

        {canWidget("total_leads") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {userScope === "assigned" ? "My Sales Leads" : "Total Leads"}
              </span>
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
        )}

        {canWidget("quotations_overview") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotations Sent</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalQuotations}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {stats.acceptedQuotations} accepted proposals
              </p>
            </div>
          </div>
        )}

        {canWidget("total_customers") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {userScope === "assigned" ? "My Clients" : "Active Customers"}
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalCustomers}</p>
              <p className="text-[11px] text-slate-500 mt-1">Registered traveler client profiles</p>
            </div>
          </div>
        )}

        {/* OPERATIONS CARDS */}
        {canWidget("upcoming_trips") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Trips</span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <PlaneTakeoff className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.upcomingTripsCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Scheduled vehicle & driver dispatches</p>
            </div>
          </div>
        )}

        {canWidget("active_bookings") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Operations</span>
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                <Compass className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.activeOperationsCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Tours currently in transit</p>
            </div>
          </div>
        )}

        {/* HR & ATTENDANCE CARDS */}
        {canWidget("total_employees") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{stats.totalEmployees}</p>
              <p className="text-[11px] text-slate-500 mt-1">Registered staff with active logins</p>
            </div>
          </div>
        )}

        {canWidget("attendance_overview") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isExecutive ? "Today's Attendance" : "My Attendance"}
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold capitalize text-slate-900">{stats.myAttendanceStatus || "Active"}</p>
              <p className="text-[11px] text-slate-500 mt-1">Today&apos;s shift record</p>
            </div>
          </div>
        )}

        {canWidget("leave_overview") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <CalendarOff className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.pendingLeavesCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Applications awaiting approval</p>
            </div>
          </div>
        )}

        {/* TASKS CARD */}
        {canWidget("upcoming_tasks") && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {userScope === "assigned" ? "My Pending Tasks" : "Agency Tasks"}
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.totalTasks}</p>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {stats.pendingTasksCount} pending action items
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. FINANCIAL VELOCITY CHART (STRICTLY GUARDED: ONLY IF AUTHORIZED) */}
      {canWidget("financial_analytics") && chartData.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Cashflow Trend & Net Margin
              </h2>
              <p className="text-xs text-slate-500">
                Month-by-month financial velocity computed from verified payment transactions and costs.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. TWO-COLUMN GRID: RECENT BOOKINGS & INQUIRIES PIPELINE */}
      {(canWidget("bookings_overview") || canWidget("total_leads")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          {canWidget("bookings_overview") && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {userScope === "assigned" ? "My Recent Bookings" : "Recent Confirmed Bookings"}
                  </h3>
                  <p className="text-xs text-slate-500">Latest reservations recorded in the database</p>
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
                  <p className="text-xs text-slate-500 py-6 text-center">No bookings recorded yet.</p>
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
                            className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold border ${
                              b.paymentStatus === "paid"
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
          )}

          {/* Recent Inquiries & Leads */}
          {canWidget("total_leads") && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {userScope === "assigned" ? "My Inquiries & Leads" : "Recent Inquiries & Leads"}
                  </h3>
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
                  <p className="text-xs text-slate-500 py-6 text-center">No active leads found.</p>
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
                          className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold block border ${
                            l.status === "new"
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
          )}
        </div>
      )}

      {/* 5. TWO-COLUMN GRID: GROUND OPERATIONS & TOP PACKAGES */}
      {(canWidget("upcoming_trips") || canWidget("sales_performance")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Ground Logistics */}
          {canWidget("upcoming_trips") && (
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
                  <p className="text-xs text-slate-500 py-6 text-center">No active trips scheduled.</p>
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
                          <span className="text-slate-800 font-medium">
                            {op.vehicleNumber || "Assigned"} ({op.driverName || "Driver"})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Top Tour Packages */}
          {canWidget("sales_performance") && (
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
                  <p className="text-xs text-slate-500 py-6 text-center">No package booking records yet.</p>
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
          )}
        </div>
      )}

      {/* 6. TWO-COLUMN GRID: ASSIGNED TASKS & RECENT ACTIVITIES */}
      {(canWidget("upcoming_tasks") || canWidget("recent_activities")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks & To-Dos */}
          {canWidget("upcoming_tasks") && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {userScope === "assigned" ? "My Assigned Tasks" : "Agency Action Items"}
                  </h3>
                  <p className="text-xs text-slate-500">Deadlines, operational deliverables, and delegations</p>
                </div>
                <Link
                  href="/crm/tasks"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                >
                  Task Board &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {recentTasks && recentTasks.length > 0 ? (
                  recentTasks.map((t) => (
                    <div
                      key={t._id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                            t.priority === "urgent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : t.priority === "high"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 line-clamp-1">{t.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span className="capitalize">{t.status?.replace("_", " ")}</span>
                        <Link href="/crm/tasks" className="text-blue-600 hover:underline">
                          View details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                    <CheckSquare className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-xs text-slate-700">All caught up!</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No pending tasks currently assigned to your profile.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activities Feed */}
          {canWidget("recent_activities") && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Recent Activities</h3>
                  <p className="text-xs text-slate-500">Live feed of agency events, bookings, and milestones</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No recent activities recorded.</p>
                ) : (
                  recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{act.subtitle}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. AUTHORIZED WORKSPACE MODULES DIRECTORY (Guarantees every role has an active, rich launchpad) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Authorized Workspace Modules</h3>
            <p className="text-xs text-slate-500">Quick-launch directory for CRM tools matching your permissions</p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium w-fit">
            Role: {user?.role?.name || "Staff"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {hasModule("leads") && (
            <Link
              href="/crm/leads"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-105 transition">
                <Filter className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Leads Pipeline</span>
            </Link>
          )}

          {hasModule("bookings") && (
            <Link
              href="/crm/bookings"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Bookings</span>
            </Link>
          )}

          {hasModule("quotations") && (
            <Link
              href="/crm/quotations"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Quotations</span>
            </Link>
          )}

          {hasModule("packages") && (
            <Link
              href="/crm/packages"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-105 transition">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Tour Packages</span>
            </Link>
          )}

          {hasModule("destinations") && (
            <Link
              href="/crm/destinations"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Destinations</span>
            </Link>
          )}

          {hasModule("operations") && (
            <Link
              href="/crm/operations"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition">
                <PlaneTakeoff className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Ground Ops</span>
            </Link>
          )}

          {hasModule("invoices") && (
            <Link
              href="/crm/invoices"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Invoices</span>
            </Link>
          )}

          {hasModule("payments") && (
            <Link
              href="/crm/payments"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Payments</span>
            </Link>
          )}

          {hasModule("expenses") && (
            <Link
              href="/crm/expenses"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Expenses</span>
            </Link>
          )}

          {hasModule("vendors") && (
            <Link
              href="/crm/vendors"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:scale-105 transition">
                <Truck className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Vendors</span>
            </Link>
          )}

          {hasModule("employees") && (
            <Link
              href="/crm/employees"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Employees</span>
            </Link>
          )}

          {hasModule("departments") && (
            <Link
              href="/crm/departments"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition">
                <Building className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Departments</span>
            </Link>
          )}

          {hasModule("attendance") && (
            <Link
              href="/crm/attendance"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Attendance</span>
            </Link>
          )}

          {hasModule("leaves") && (
            <Link
              href="/crm/leaves"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition">
                <CalendarOff className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Leaves</span>
            </Link>
          )}

          {hasModule("tasks") && (
            <Link
              href="/crm/tasks"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition">
                <CheckSquare className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Tasks Board</span>
            </Link>
          )}

          {hasModule("reports") && (
            <Link
              href="/crm/reports"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Reports</span>
            </Link>
          )}

          {hasModule("website_cms") && (
            <Link
              href="/crm/website_cms"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 group-hover:scale-105 transition">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Website CMS</span>
            </Link>
          )}

          {hasModule("settings") && (
            <Link
              href="/crm/settings"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-105 transition">
                <Settings className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Settings</span>
            </Link>
          )}

          {hasModule("roles") && (
            <Link
              href="/crm/admin/roles"
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition group flex flex-col items-center text-center gap-2"
            >
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Roles & RBAC</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
