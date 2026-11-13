import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Package from "@/models/Package";
import Expense from "@/models/Expense";
import Payment from "@/models/Payment";
import TripOperation from "@/models/TripOperation";
import Task from "@/models/Task";
import Attendance from "@/models/Attendance";
import LeaveRequest from "@/models/LeaveRequest";
import Department from "@/models/Department";
import Quotation from "@/models/Quotation";
import { SafeUser } from "@/types/auth.types";
import { Types } from "mongoose";
import { ALL_WIDGET_IDS, getDefaultWidgetsForRole } from "@/config/widgets.config";

export interface DashboardMetrics {
  stats: {
    // Financial (Confidential)
    totalRevenue: number | null;
    totalExpenses: number | null;
    netProfit: number | null;
    pendingPayments: number | null;

    // Sales
    totalBookings: number;
    totalCustomers: number;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalQuotations: number;
    acceptedQuotations: number;

    // Operations
    activePackages: number;
    pendingBookingsCount: number;
    upcomingTripsCount: number;
    activeOperationsCount: number;

    // HR
    totalEmployees: number;
    presentTodayCount: number;
    pendingLeavesCount: number;
    myAttendanceStatus: string;

    // Tasks & To-Dos
    totalTasks: number;
    pendingTasksCount: number;
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
  recentTasks: any[];
  recentActivities: any[];
  departmentPerformance: any[];
  authorizedWidgets: string[];
  authorizedModules: string[];
  userScope: string;
}

export async function getDashboardData(user: SafeUser): Promise<DashboardMetrics> {
  await connectToDatabase();

  const isSuperAdmin = user.role.slug === "super-admin";
  const isAdmin = user.role.slug === "admin";
  const isExecutive = isSuperAdmin || isAdmin;

  // 1. Resolve authorized dashboard widgets
  const roleWidgets = user.role.dashboardWidgets && user.role.dashboardWidgets.length > 0
    ? user.role.dashboardWidgets
    : getDefaultWidgetsForRole(user.role.slug);

  const allowedWidgetSet = new Set(isSuperAdmin ? ALL_WIDGET_IDS : roleWidgets);
  const canWidget = (id: string) => isSuperAdmin || allowedWidgetSet.has(id);

  // 2. Resolve Module Permissions
  const hasPerm = (module: string) => {
    if (isExecutive) return true;
    return user.permissions?.some(
      (p) => p.module === module && (p.action === "view" || p.action === "manage")
    );
  };

  // 3. Resolve Record Scoping
  const scope = isExecutive ? "all" : user.role.defaultRecordScope || "assigned";
  const userObjId = Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : null;
  const deptObjId = user.department?.id && Types.ObjectId.isValid(user.department.id)
    ? new Types.ObjectId(user.department.id)
    : null;

  // Construct filters respecting record access scope
  // A. Bookings Filter
  let bookingFilter: any = {};
  if (scope === "department" && deptObjId) {
    bookingFilter = {};
  } else if (scope === "assigned" && userObjId) {
    const assignedBookingsCount = await Booking.countDocuments({ assignedStaff: userObjId }).catch(() => 0);
    if (assignedBookingsCount > 0) {
      bookingFilter = { assignedStaff: userObjId };
    }
  }

  // B. Leads Filter
  let leadFilter: any = {};
  if (scope === "assigned" && userObjId) {
    const assignedLeadsCount = await Lead.countDocuments({ assignedTo: userObjId }).catch(() => 0);
    if (assignedLeadsCount > 0) {
      leadFilter = { assignedTo: userObjId };
    }
  }

  // C. Quotations Filter
  let quoteFilter: any = {};
  if (scope === "assigned" && userObjId) {
    quoteFilter = { createdBy: userObjId };
  }

  // D. Tasks Filter
  let taskFilter: any = {};
  if (!isExecutive && userObjId) {
    taskFilter = { assignedTo: userObjId };
  }

  // 4. CRITICAL FINANCIAL SECURITY GUARD
  // If user lacks ALL financial widgets, do NOT query financial collections at all!
  const allowFinancialQueries =
    canWidget("total_revenue") ||
    canWidget("net_profit") ||
    canWidget("total_expenses") ||
    canWidget("outstanding_receivables") ||
    canWidget("pending_payments") ||
    canWidget("financial_analytics");

  const todayStr = new Date().toISOString().split("T")[0];

  // Execute database calls concurrently with robust error isolation
  const [
    // Bookings
    totalBookings,
    pendingBookingsCount,
    bookingsList,

    // Customers
    totalCustomers,

    // Leads
    totalLeads,
    convertedLeads,
    recentLeads,

    // Quotations
    totalQuotations,
    acceptedQuotations,

    // Tour Packages
    activePackages,

    // Trip Operations
    upcomingTrips,
    activeOperationsCount,

    // Employees & Departments
    totalEmployees,
    departmentsList,

    // Tasks
    totalTasks,
    pendingTasksCount,
    recentTasksList,

    // Attendance & Leaves
    todayAttendance,
    pendingLeavesCount,

    // Payments & Expenses (Strictly guarded)
    paymentsList,
    expensesList,
  ] = await Promise.all([
    // Bookings
    canWidget("bookings_overview") || hasPerm("bookings")
      ? Booking.countDocuments(bookingFilter).catch(() => 0)
      : Promise.resolve(0),
    canWidget("bookings_overview") || hasPerm("bookings")
      ? Booking.countDocuments({ ...bookingFilter, bookingStatus: { $in: ["new", "pending_confirmation"] } }).catch(() => 0)
      : Promise.resolve(0),
    canWidget("bookings_overview") || hasPerm("bookings")
      ? Booking.find(bookingFilter).sort({ createdAt: -1 }).limit(10).lean().catch(() => [])
      : Promise.resolve([]),

    // Customers
    canWidget("total_customers") || hasPerm("customers")
      ? Customer.countDocuments(scope === "assigned" && userObjId ? { assignedTo: userObjId } : { status: "active" }).catch(() => 0)
      : Promise.resolve(0),

    // Leads
    canWidget("total_leads") || hasPerm("leads")
      ? Lead.countDocuments(leadFilter).catch(() => 0)
      : Promise.resolve(0),
    canWidget("converted_leads") || hasPerm("leads")
      ? Lead.countDocuments({ ...leadFilter, status: "converted" }).catch(() => 0)
      : Promise.resolve(0),
    canWidget("total_leads") || hasPerm("leads")
      ? Lead.find(leadFilter).sort({ createdAt: -1 }).limit(6).lean().catch(() => [])
      : Promise.resolve([]),

    // Quotations
    canWidget("quotations_overview") || hasPerm("quotations")
      ? Quotation.countDocuments(quoteFilter).catch(() => 0)
      : Promise.resolve(0),
    canWidget("quotations_overview") || hasPerm("quotations")
      ? Quotation.countDocuments({ ...quoteFilter, status: "accepted" }).catch(() => 0)
      : Promise.resolve(0),

    // Tour Packages
    hasPerm("packages")
      ? Package.countDocuments({ status: "published" }).catch(() => 0)
      : Promise.resolve(0),

    // Operations
    canWidget("upcoming_trips") || canWidget("trip_status") || hasPerm("operations")
      ? TripOperation.find({ departureDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
          .sort({ departureDate: 1 })
          .limit(6)
          .lean()
          .catch(() => [])
      : Promise.resolve([]),
    canWidget("active_bookings") || hasPerm("operations")
      ? TripOperation.countDocuments({ status: { $in: ["scheduled", "on_tour"] } }).catch(() => 0)
      : Promise.resolve(0),

    // Employees & Departments
    canWidget("total_employees") || hasPerm("employees")
      ? User.countDocuments({ status: "active" }).catch(() => 0)
      : Promise.resolve(0),
    canWidget("department_overview") || hasPerm("departments")
      ? Department.find().lean().catch(() => [])
      : Promise.resolve([]),

    // Tasks
    canWidget("upcoming_tasks") || hasPerm("tasks")
      ? Task.countDocuments(taskFilter).catch(() => 0)
      : Promise.resolve(0),
    canWidget("upcoming_tasks") || hasPerm("tasks")
      ? Task.countDocuments({ ...taskFilter, status: { $in: ["pending", "in_progress"] } }).catch(() => 0)
      : Promise.resolve(0),
    canWidget("upcoming_tasks") || hasPerm("tasks")
      ? Task.find(taskFilter).sort({ dueDate: 1, createdAt: -1 }).limit(6).lean().catch(() => [])
      : Promise.resolve([]),

    // Attendance & Leaves
    canWidget("attendance_overview") && userObjId
      ? Attendance.findOne({ userId: userObjId, date: todayStr }).lean().catch(() => null)
      : Promise.resolve(null),
    canWidget("leave_overview")
      ? LeaveRequest.countDocuments(isExecutive ? { status: "pending" } : { userId: userObjId, status: "pending" }).catch(() => 0)
      : Promise.resolve(0),

    // Financial queries: STRICTLY EXECUTED ONLY IF AUTHORIZED
    allowFinancialQueries
      ? Payment.find({ status: "completed" }).lean().catch(() => [])
      : Promise.resolve([]),
    allowFinancialQueries
      ? Expense.find({ status: "approved" }).lean().catch(() => [])
      : Promise.resolve([]),
  ]);

  // 5. Compute Financial Aggregates with Strict Masking
  let totalRevenue: number | null = null;
  let totalExpenses: number | null = null;
  let netProfit: number | null = null;
  let pendingPayments: number | null = null;
  const chartData: Array<{ month: string; revenue: number; expenses: number; profit: number }> = [];

  if (allowFinancialQueries) {
    const rawRevenue = (paymentsList as any[]).reduce((sum, p) => sum + (p.amount || 0), 0);
    const rawExpenses = (expensesList as any[]).reduce((sum, e) => sum + (e.amount || 0), 0);
    const rawProfit = rawRevenue - rawExpenses;
    const rawReceivables = (bookingsList as any[]).reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

    if (canWidget("total_revenue")) totalRevenue = rawRevenue;
    if (canWidget("total_expenses")) totalExpenses = rawExpenses;
    if (canWidget("net_profit")) netProfit = rawProfit;
    if (canWidget("outstanding_receivables") || canWidget("pending_payments")) pendingPayments = rawReceivables;

    // Compute monthly chart data only if financial_analytics widget is authorized
    if (canWidget("financial_analytics")) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = monthNames[d.getMonth()];
        const mYear = d.getFullYear();
        const nextD = new Date(mYear, d.getMonth() + 1, 1);

        const mRevenue = (paymentsList as any[])
          .filter((p) => new Date(p.paymentDate) >= d && new Date(p.paymentDate) < nextD)
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const mExpenses = (expensesList as any[])
          .filter((e) => new Date(e.date) >= d && new Date(e.date) < nextD)
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        chartData.push({
          month: `${mName} ${mYear.toString().slice(-2)}`,
          revenue: mRevenue,
          expenses: mExpenses,
          profit: mRevenue - mExpenses,
        });
      }
    }
  }

  // Conversion rate
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Top packages aggregation (for sales / executive)
  const packageCounts: Record<string, { count: number; name: string; revenue: number }> = {};
  for (const b of bookingsList as any[]) {
    if (b.packageName) {
      if (!packageCounts[b.packageName]) {
        packageCounts[b.packageName] = { count: 0, name: b.packageName, revenue: 0 };
      }
      packageCounts[b.packageName].count += 1;
      packageCounts[b.packageName].revenue += b.totalAmount || 0;
    }
  }
  const topPackages = Object.values(packageCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Department Performance (for Super Admin & Admin)
  const departmentPerformance = (departmentsList as any[]).map((dept) => ({
    id: dept._id.toString(),
    name: dept.name,
    code: dept.code,
    headcount: 0,
  }));

  // Build Recent Activity Feed (Derived from real bookings, tasks, departures)
  const recentActivities: any[] = [];
  if (canWidget("recent_activities")) {
    for (const b of (bookingsList as any[]).slice(0, 3)) {
      recentActivities.push({
        id: `act-b-${b._id}`,
        type: "booking",
        title: `Booking ${b.bookingRef} Confirmed`,
        subtitle: `${b.customerName} • ${b.packageName}`,
        timestamp: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      });
    }
    for (const l of (recentLeads as any[]).slice(0, 2)) {
      recentActivities.push({
        id: `act-l-${l._id}`,
        type: "lead",
        title: `Inquiry: ${l.name}`,
        subtitle: `Interested in ${l.destination || "Tour"}`,
        timestamp: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
      });
    }
    for (const t of (recentTasksList as any[]).slice(0, 2)) {
      recentActivities.push({
        id: `act-t-${t._id}`,
        type: "task",
        title: `Task: ${t.title}`,
        subtitle: `Status: ${t.status?.replace("_", " ")}`,
        timestamp: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      });
    }
  }

  // JSON-serializable sanitization for Next.js boundary
  const serializeList = (list: any[]) =>
    list.map((item) => {
      const obj = { ...item };
      if (obj._id) obj._id = obj._id.toString();
      if (obj.customerId) obj.customerId = obj.customerId.toString();
      if (obj.packageId) obj.packageId = obj.packageId.toString();
      if (obj.assignedTo) obj.assignedTo = obj.assignedTo.toString();
      if (obj.assignedStaff) obj.assignedStaff = obj.assignedStaff.toString();
      if (obj.createdBy) obj.createdBy = obj.createdBy.toString();
      if (obj.createdAt instanceof Date) obj.createdAt = obj.createdAt.toISOString();
      if (obj.updatedAt instanceof Date) obj.updatedAt = obj.updatedAt.toISOString();
      if (obj.departureDate instanceof Date) obj.departureDate = obj.departureDate.toISOString();
      if (obj.returnDate instanceof Date) obj.returnDate = obj.returnDate.toISOString();
      if (obj.dueDate instanceof Date) obj.dueDate = obj.dueDate.toISOString();
      return obj;
    });

  // Extract authorized modules for the sidebar and launch tiles
  const authorizedModules = isExecutive
    ? [
        "roles", "settings", "leads", "customers", "quotations", "packages",
        "destinations", "bookings", "operations", "employees", "departments",
        "attendance", "leaves", "invoices", "payments", "expenses", "vendors",
        "website_cms", "tasks", "reports"
      ]
    : user.permissions
        ?.filter((p) => p.action === "view" || p.action === "manage")
        .map((p) => p.module) || [];

  return {
    stats: {
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingPayments,
      totalBookings: canWidget("bookings_overview") ? totalBookings : 0,
      totalCustomers: canWidget("total_customers") ? totalCustomers : 0,
      totalLeads: canWidget("total_leads") ? totalLeads : 0,
      convertedLeads: canWidget("converted_leads") ? convertedLeads : 0,
      conversionRate: canWidget("conversion_rate") ? conversionRate : 0,
      totalQuotations: canWidget("quotations_overview") ? totalQuotations : 0,
      acceptedQuotations: canWidget("quotations_overview") ? acceptedQuotations : 0,
      activePackages,
      pendingBookingsCount: canWidget("bookings_overview") ? pendingBookingsCount : 0,
      upcomingTripsCount: canWidget("upcoming_trips") ? (upcomingTrips as any[]).length : 0,
      activeOperationsCount: canWidget("active_bookings") ? activeOperationsCount : 0,
      totalEmployees: canWidget("total_employees") ? totalEmployees : 0,
      presentTodayCount: todayAttendance ? 1 : 0,
      pendingLeavesCount: canWidget("leave_overview") ? pendingLeavesCount : 0,
      myAttendanceStatus: (todayAttendance as any)?.status || "Active",
      totalTasks: canWidget("upcoming_tasks") ? totalTasks : 0,
      pendingTasksCount: canWidget("upcoming_tasks") ? pendingTasksCount : 0,
    },
    chartData,
    recentBookings: canWidget("bookings_overview") ? serializeList(bookingsList as any[]).slice(0, 5) : [],
    recentLeads: canWidget("total_leads") ? serializeList(recentLeads as any[]).slice(0, 5) : [],
    topPackages: canWidget("sales_performance") || isExecutive ? topPackages : [],
    upcomingTrips: canWidget("upcoming_trips") ? serializeList(upcomingTrips as any[]).slice(0, 5) : [],
    recentTasks: canWidget("upcoming_tasks") ? serializeList(recentTasksList as any[]).slice(0, 5) : [],
    recentActivities: recentActivities.slice(0, 6),
    departmentPerformance,
    authorizedWidgets: Array.from(allowedWidgetSet),
    authorizedModules: Array.from(new Set(authorizedModules)),
    userScope: scope,
  };
}
