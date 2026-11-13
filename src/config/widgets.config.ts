export interface DashboardWidgetDefinition {
  id: string;
  name: string;
  category: "financial" | "sales" | "operations" | "hr" | "general";
  description: string;
  defaultRoles: string[]; // Role slugs that have this widget enabled by default
}

export const DASHBOARD_WIDGET_CATEGORIES = [
  { id: "financial", label: "Financial Widgets", description: "Company revenue, margins, expenses and cashflow velocity" },
  { id: "sales", label: "Sales & Inquiries Widgets", description: "Leads pipeline, conversion efficiency and quotations" },
  { id: "operations", label: "Operations & Logistics Widgets", description: "Ground execution, fleet logistics and trip status" },
  { id: "hr", label: "Staff & Human Resources Widgets", description: "Headcount, attendance tracking, and leave management" },
  { id: "general", label: "General & Workspace Widgets", description: "Tasks, calendar schedule, and system notifications" },
] as const;

export type DashboardWidgetCategory = (typeof DASHBOARD_WIDGET_CATEGORIES)[number]["id"];

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  // 1. Financial Widgets (Strictly guarded)
  {
    id: "total_revenue",
    name: "Total Company Revenue",
    category: "financial",
    description: "Company gross revenue received via verified payments",
    defaultRoles: ["super-admin", "accountant"],
  },
  {
    id: "net_profit",
    name: "Net Profit Margin",
    category: "financial",
    description: "Net operating margin after tour costs and operational expenses",
    defaultRoles: ["super-admin", "accountant"],
  },
  {
    id: "total_expenses",
    name: "Total Operational Expenses",
    category: "financial",
    description: "Direct tour execution and operational expenditure",
    defaultRoles: ["super-admin", "accountant"],
  },
  {
    id: "outstanding_receivables",
    name: "Outstanding Receivables",
    category: "financial",
    description: "Pending customer balance awaiting collection on active bookings",
    defaultRoles: ["super-admin", "accountant"],
  },
  {
    id: "pending_payments",
    name: "Pending Invoice Clearance",
    category: "financial",
    description: "Pending supplier payments and client invoice reconciliations",
    defaultRoles: ["super-admin", "accountant"],
  },
  {
    id: "financial_analytics",
    name: "Financial Velocity Analytics",
    category: "financial",
    description: "Interactive monthly cashflow trend (Revenue vs Expenses vs Profit)",
    defaultRoles: ["super-admin", "accountant"],
  },

  // 2. Sales Widgets
  {
    id: "total_leads",
    name: "Inquiries & Leads Overview",
    category: "sales",
    description: "Total or assigned sales inquiries across the pipeline",
    defaultRoles: ["super-admin", "admin", "sales-manager", "sales-executive"],
  },
  {
    id: "converted_leads",
    name: "Converted Leads",
    category: "sales",
    description: "Volume of leads successfully converted into confirmed bookings",
    defaultRoles: ["super-admin", "admin", "sales-manager"],
  },
  {
    id: "sales_performance",
    name: "Sales Performance Leaderboard",
    category: "sales",
    description: "Sales target progress, deals closed, and representative rankings",
    defaultRoles: ["super-admin", "admin", "sales-manager", "sales-executive"],
  },
  {
    id: "conversion_rate",
    name: "Lead Conversion Rate",
    category: "sales",
    description: "Percentage efficiency of prospect-to-booking conversions",
    defaultRoles: ["super-admin", "admin", "sales-manager"],
  },
  {
    id: "quotations_overview",
    name: "Quotations Sent & Accepted",
    category: "sales",
    description: "Summary of price quotations and customer acceptance statuses",
    defaultRoles: ["super-admin", "admin", "sales-manager", "sales-executive"],
  },
  {
    id: "bookings_overview",
    name: "Confirmed Bookings Overview",
    category: "sales",
    description: "Recent client bookings, reservations, and passenger itineraries",
    defaultRoles: ["super-admin", "admin", "sales-manager", "sales-executive", "operations-manager"],
  },

  // 3. Operations Widgets
  {
    id: "upcoming_trips",
    name: "Upcoming Ground Departures",
    category: "operations",
    description: "Tour departures scheduled within the next 7 days",
    defaultRoles: ["super-admin", "admin", "operations-manager"],
  },
  {
    id: "active_bookings",
    name: "Active Operations Bookings",
    category: "operations",
    description: "Bookings in execution or awaiting final service vouchers",
    defaultRoles: ["super-admin", "admin", "operations-manager"],
  },
  {
    id: "pending_travel_arrangements",
    name: "Travel Arrangements Coordination",
    category: "operations",
    description: "Hotel bookings, permits, and activities awaiting confirmation",
    defaultRoles: ["super-admin", "admin", "operations-manager"],
  },
  {
    id: "vendor_assignments",
    name: "Vendor & Supplier Dispatches",
    category: "operations",
    description: "Transport providers, hotel partners, and local guides assigned",
    defaultRoles: ["super-admin", "admin", "operations-manager"],
  },
  {
    id: "trip_status",
    name: "Trip Operations Status Board",
    category: "operations",
    description: "Live operational status of ongoing tours and vehicles",
    defaultRoles: ["super-admin", "admin", "operations-manager"],
  },

  // 4. HR Widgets
  {
    id: "total_employees",
    name: "Total Employees / Headcount",
    category: "hr",
    description: "Active employees registered across all agency departments",
    defaultRoles: ["super-admin", "admin", "hr-manager"],
  },
  {
    id: "attendance_overview",
    name: "Attendance & Shift Status",
    category: "hr",
    description: "Today's check-in records, working hours, and shift logs",
    defaultRoles: ["super-admin", "admin", "hr-manager", "employee"],
  },
  {
    id: "leave_overview",
    name: "Leave Requests & Balances",
    category: "hr",
    description: "Pending leave requests awaiting approval and employee balances",
    defaultRoles: ["super-admin", "admin", "hr-manager", "employee"],
  },
  {
    id: "employee_performance",
    name: "Employee Productivity Overview",
    category: "hr",
    description: "Staff task completion rate and departmental output",
    defaultRoles: ["super-admin", "admin", "hr-manager"],
  },
  {
    id: "department_overview",
    name: "Department Structure Overview",
    category: "hr",
    description: "Headcount and leadership distribution across departments",
    defaultRoles: ["super-admin", "admin", "hr-manager"],
  },
  {
    id: "payroll_overview",
    name: "Salary & Payroll Overview",
    category: "hr",
    description: "Confidential salary expenditure and compensation records",
    defaultRoles: ["super-admin"],
  },

  // 5. General & Workspace Widgets
  {
    id: "total_customers",
    name: "Active Travel Customers",
    category: "general",
    description: "Registered traveler profiles and customer relationship metrics",
    defaultRoles: ["super-admin", "admin", "sales-manager", "sales-executive"],
  },
  {
    id: "recent_activities",
    name: "Recent Company Activities",
    category: "general",
    description: "Real-time feed of agency events, bookings, and updates",
    defaultRoles: ["super-admin", "admin", "sales-manager", "operations-manager", "hr-manager", "accountant", "employee"],
  },
  {
    id: "upcoming_tasks",
    name: "Assigned Tasks & To-Dos",
    category: "general",
    description: "My personal and team tasks with urgency levels and due dates",
    defaultRoles: ["super-admin", "admin", "operations-manager", "hr-manager", "employee", "sales-manager", "sales-executive"],
  },
  {
    id: "notifications_overview",
    name: "System Notifications & Alerts",
    category: "general",
    description: "Critical notifications and operational alerts",
    defaultRoles: ["super-admin", "admin", "employee", "hr-manager", "operations-manager", "sales-manager", "sales-executive", "accountant"],
  },
  {
    id: "calendar_overview",
    name: "Departure & Task Calendar",
    category: "general",
    description: "Monthly timeline of upcoming tours, deadlines, and milestones",
    defaultRoles: ["super-admin", "admin", "operations-manager", "sales-executive", "employee"],
  },
];

export const ALL_WIDGET_IDS = DASHBOARD_WIDGETS.map((w) => w.id);

export function getDefaultWidgetsForRole(roleSlug: string): string[] {
  if (roleSlug === "super-admin") {
    return ALL_WIDGET_IDS;
  }
  return DASHBOARD_WIDGETS.filter((w) => w.defaultRoles.includes(roleSlug)).map((w) => w.id);
}

