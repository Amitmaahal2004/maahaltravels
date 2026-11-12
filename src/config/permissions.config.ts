export const SYSTEM_MODULES = [
  { id: "packages", label: "Travel Packages", description: "Manage tour packages, categories, and pricing" },
  { id: "destinations", label: "Destinations", description: "Manage travel destinations, galleries, and attractions" },
  { id: "customers", label: "Customers", description: "Client profiles, booking history, and communications" },
  { id: "leads", label: "Leads & Inquiries", description: "Sales pipeline, follow-ups, and lead conversion" },
  { id: "bookings", label: "Bookings", description: "Reservations, passenger lists, and status tracking" },
  { id: "quotations", label: "Quotations", description: "Price quotes, itineraries, and proposals" },
  { id: "invoices", label: "Invoices", description: "GST billing, tax invoices, and receipts" },
  { id: "payments", label: "Payments", description: "Cash, UPI, Bank, and Razorpay transactions" },
  { id: "expenses", label: "Expenses & Profit", description: "Direct tour costs, operational expenses, and margins" },
  { id: "vendors", label: "Vendors & Suppliers", description: "Hotels, transport providers, guides, and partners" },
  { id: "employees", label: "Employees", description: "Staff directories, designations, and profiles" },
  { id: "departments", label: "Departments", description: "Organizational structure and department heads" },
  { id: "attendance", label: "Attendance", description: "Check-in/out records, working hours, and corrections" },
  { id: "leaves", label: "Leave Management", description: "Leave applications, balances, and approvals" },
  { id: "tasks", label: "Tasks & Projects", description: "Task delegation, deadlines, and progress" },
  { id: "operations", label: "Trip Operations", description: "Vehicles, drivers, hotel rooms, and departure calendars" },
  { id: "reports", label: "Reports & Analytics", description: "Financial, sales, and operational analytics" },
  { id: "notifications", label: "Notifications", description: "System alerts and automated messaging" },
  { id: "website_cms", label: "Website CMS", description: "Public homepage, testimonials, blogs, and banners" },
  { id: "settings", label: "System Settings", description: "Global agency configuration and credentials" },
  { id: "roles", label: "Roles & Permissions", description: "Dynamic RBAC role and permission matrix" },
] as const;

export type SystemModuleId = (typeof SYSTEM_MODULES)[number]["id"];

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "reject",
  "assign",
  "export",
  "import",
  "publish",
  "manage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const RECORD_SCOPES = [
  "all",
  "department",
  "assigned",
  "own",
] as const;

export type RecordScope = (typeof RECORD_SCOPES)[number];

export const DEFAULT_ROLES = [
  {
    name: "Super Admin",
    slug: "super-admin",
    description: "Unrestricted, top-level system authority across all modules and settings.",
    isSystem: true,
  },
  {
    name: "Admin",
    slug: "admin",
    description: "Full administrative control over operational, sales, and staff management.",
    isSystem: true,
  },
  {
    name: "HR Manager",
    slug: "hr-manager",
    description: "Manages staff profiles, departments, attendance, and leave workflows.",
    isSystem: true,
  },
  {
    name: "Operations Manager",
    slug: "operations-manager",
    description: "Oversees ground execution, vehicles, drivers, hotels, and trip checklists.",
    isSystem: true,
  },
  {
    name: "Sales Manager",
    slug: "sales-manager",
    description: "Leads sales reps, oversees quotations, bookings, and customer pipeline.",
    isSystem: true,
  },
  {
    name: "Sales Executive",
    slug: "sales-executive",
    description: "Engages leads, builds quotations, and coordinates bookings for assigned clients.",
    isSystem: true,
  },
  {
    name: "Accountant",
    slug: "accountant",
    description: "Handles invoices, payment receipts, expenses, vendor balances, and tax filings.",
    isSystem: true,
  },
  {
    name: "Employee",
    slug: "employee",
    description: "Base staff role with access to own attendance, tasks, and assigned items.",
    isSystem: true,
  },
] as const;

