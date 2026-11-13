"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Filter,
  UserCheck,
  FileSpreadsheet,
  Package,
  MapPin,
  CalendarDays,
  PlaneTakeoff,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Receipt,
  CreditCard,
  TrendingDown,
  Truck,
  Globe,
  CheckSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Car,
  Hotel,
  DollarSign,
  TrendingUp,
  Database,
  Lock,
  Layers,
  Check,
  Menu,
  X,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [activeMockupTab, setActiveMockupTab] = useState<"overview" | "operations" | "pipeline" | "finance">("overview");

  // CRM 6 Functional Categories (All 21 modules)
  const categories = [
    {
      id: "access",
      title: "Access & Governance",
      tagline: "Security & Control",
      icon: ShieldCheck,
      color: "blue",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      description:
        "Centralized administrative control with dynamic Role-Based Access Control (RBAC), multi-tenant governance, and agency profile configuration.",
      modules: [
        { name: "Executive Dashboard", path: "/crm/dashboard", desc: "Centralized real-time overview of revenue, trips, and pipeline." },
        { name: "Roles & Permissions", path: "/crm/admin/roles", desc: "Granular permissions matrix for Super Admins, Managers, and Agents." },
        { name: "System Settings", path: "/crm/settings", desc: "Agency legal entity, GSTIN, currency rules, and notification defaults." },
      ],
    },
    {
      id: "sales",
      title: "Sales & Clients",
      tagline: "Revenue Growth",
      icon: Filter,
      color: "cyan",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
      description:
        "Comprehensive sales funnel management from first traveler inquiry to accepted quotation and qualified customer profile.",
      modules: [
        { name: "Leads Pipeline", path: "/crm/leads", desc: "Visual Kanban board tracking inquiries from initial contact to conversion." },
        { name: "Customers Directory", path: "/crm/customers", desc: "Complete 360° traveler records with lifetime bookings and trip history." },
        { name: "Quotations Builder", path: "/crm/quotations", desc: "Automated line-item cost estimates with dynamic GST calculation." },
      ],
    },
    {
      id: "travel",
      title: "Travel & Tours",
      tagline: "Core Operations",
      icon: PlaneTakeoff,
      color: "indigo",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      description:
        "End-to-end trip execution spanning catalog packaging, destination weather monitoring, live bookings ledger, and ground fleet dispatch.",
      modules: [
        { name: "Tour Packages", path: "/crm/packages", desc: "Curated expedition catalog with multi-day itineraries and inclusions." },
        { name: "Destinations Hub", path: "/crm/destinations", desc: "Geographic profiles, weather conditions, permits, and peak seasons." },
        { name: "Bookings Ledger", path: "/crm/bookings", desc: "Confirmed guest departures, guest counts, and balance clearance." },
        { name: "Trip Operations", path: "/crm/operations", desc: "Real-time dispatch, 4x4 vehicles, driver allocations, and checklist." },
      ],
    },
    {
      id: "staff",
      title: "Staff & Human Resources",
      tagline: "Team Efficiency",
      icon: Users,
      color: "emerald",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description:
        "Full HR suite managing internal agency operators, functional departmental divisions, biometric attendance terminal, and paid leave approvals.",
      modules: [
        { name: "Employees Directory", path: "/crm/employees", desc: "Staff records, designations, salaries, and department attachments." },
        { name: "Departments Hierarchy", path: "/crm/departments", desc: "Functional business units with live team member counter." },
        { name: "Attendance Terminal", path: "/crm/attendance", desc: "Real-time clock-in/out punch timestamps and working hours tracking." },
        { name: "Leaves & Time Off", path: "/crm/leaves", desc: "Administrative leave application, review, and approval ledger." },
      ],
    },
    {
      id: "finance",
      title: "Financial Management",
      tagline: "P&L Integrity",
      icon: Receipt,
      color: "amber",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      description:
        "Full financial clarity covering GST-compliant tax billing, multi-channel payment reconciliation, supplier settlements, and net margin audit.",
      modules: [
        { name: "Invoices Ledger", path: "/crm/invoices", desc: "GST tax invoices with automated tax itemization and print modal." },
        { name: "Payments Reconciliation", path: "/crm/payments", desc: "Inbound fund tracking across UPI, Bank Transfer, Card, and Cash." },
        { name: "Expenses & Net Margin", path: "/crm/expenses", desc: "Operational cost logging, category breakdowns, and net profit ledger." },
        { name: "Vendors & Suppliers", path: "/crm/vendors", desc: "Contracts with hotels, transport fleet providers, and local guides." },
      ],
    },
    {
      id: "marketing",
      title: "Marketing & Insights",
      tagline: "Intelligence & Scale",
      icon: BarChart3,
      color: "purple",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      description:
        "Live content syndication to the public web portal, internal task delegation checklists, and executive business analytics.",
      modules: [
        { name: "Website CMS Sync", path: "/crm/website_cms", desc: "Directly manage public homepage hero text, about story, and contact info." },
        { name: "Tasks & To-Dos", path: "/crm/tasks", desc: "Operational checklists, deadline tracking, and employee assignments." },
        { name: "Reports & Analytics", path: "/crm/reports", desc: "Monthly financial charts, revenue vs expense trends, and CSV export." },
      ],
    },
  ];

  // 8 Individual Feature Deep Dives
  const featureDeepDives = [
    {
      id: "sales-leads",
      tag: "Sales & Inquiries",
      title: "Intelligent Lead Pipeline & Opportunity Conversion",
      description:
        "Never drop a high-value traveler inquiry. Capture leads automatically, assign dedicated sales consultants, log client requirements, and monitor deal velocity through every stage from inquiry to booking.",
      bullets: [
        "Visual 5-stage Kanban board (New, Contacted, Proposal Sent, Won, Lost)",
        "Instant estimated budget and destination interest tagging",
        "Direct one-click conversion to Customer Profile and Quotation",
        "Integrated sales agent allocation with accountability tracking",
      ],
      mockupType: "leads",
    },
    {
      id: "customer-crm",
      tag: "Client Relationship Management",
      title: "Comprehensive 360° Traveler Customer Intelligence",
      description:
        "Centralize every traveler detail in one place. Maintain comprehensive contact profiles, lifetime bookings, total revenue contributed, emergency contacts, passport identifiers, and dietary requirements.",
      bullets: [
        "Unified customer history linking leads, quotations, and live bookings",
        "Lifetime traveler value (LTV) calculation and repeat customer badges",
        "Instant customer search by phone, email, or booking reference",
        "Secure document indexing with privacy protection controls",
      ],
      mockupType: "customers",
    },
    {
      id: "quotes-bookings",
      tag: "Quotation & Reservations",
      title: "Rapid Line-Item Quotations & Confirmed Bookings",
      description:
        "Build elegant customized quotes with multi-item breakdowns, automated GST percentages, and line-item pricing. Once accepted by the traveler, convert into an active departure in one click.",
      bullets: [
        "Custom itemization for transport, luxury stays, permits, and meals",
        "Configurable GST rates (5%, 12%, 18%) with instant tax calculation",
        "Accepted quotations auto-generate confirmed departure records",
        "Printable client-ready proposal modal with agency branding",
      ],
      mockupType: "quotations",
    },
    {
      id: "tour-operations",
      tag: "Field Execution",
      title: "Ground Trip Operations, Fleet & Dispatch Command",
      description:
        "Turn bookings into flawless mountain expeditions. Allocate vehicles, assign drivers with contact records, connect certified local guides, issue hotel accommodation vouchers, and track pre-departure checklists.",
      bullets: [
        "Live dispatch manifest with vehicle registration and driver phone numbers",
        "Hotel room allocations by city, check-in dates, and room types",
        "Interactive pre-departure checklist for safety and permits",
        "Live status transitions: Scheduled → On Tour → Completed",
      ],
      mockupType: "operations",
    },
    {
      id: "hr-attendance",
      tag: "Team Management",
      title: "Integrated HR Suite, Department Structure & Time Clock",
      description:
        "Run an organized travel agency with built-in workforce tools. Manage staff designations, salaries, department attachments, digital shift clock-in/out timestamps, and leave requests.",
      bullets: [
        "Digital employee directory with designation and basic salary ledger",
        "Dynamic department management with live team member counter",
        "One-click agency terminal clock-in with working hours calculation",
        "Leave request queue with administrative approval and rejection notes",
      ],
      mockupType: "hr",
    },
    {
      id: "financial-ledger",
      tag: "Accounting & Profitability",
      title: "GST Tax Invoicing, Payment Clearance & Net Margins",
      description:
        "Take complete control of agency cashflow. Issue GST-compliant tax invoices, record multi-channel payments, log operational expenses (hotels, fuel, tolls), and track true net profit margins.",
      bullets: [
        "Automated tax invoice generation with balance due tracking",
        "Multi-channel payment reconciliation (UPI, NEFT/RTGS, Card, Cash)",
        "Operational expense logging tied to specific booking references",
        "Real-time agency profit margin calculations across every fiscal cycle",
      ],
      mockupType: "finance",
    },
    {
      id: "cms-tasks",
      tag: "Marketing & Operations",
      title: "Connected Website CMS & Team Task Coordination",
      description:
        "Seamlessly connect your CRM to your public agency website. Update homepage hero banners, about narratives, and contact channels in real time while tracking internal team to-do items.",
      bullets: [
        "Live website CMS updates without code changes or redeployments",
        "Published / Draft status toggles for public web content blocks",
        "Interactive operational task checklists with priority tags (Urgent, High)",
        "Assign action items to specific staff members with due dates",
      ],
      mockupType: "cms",
    },
    {
      id: "analytics-reports",
      tag: "Business Intelligence",
      title: "Executive Reports, Revenue Analytics & CSV Export",
      description:
        "Empower agency leadership with data-driven decision making. Monitor 6-month revenue vs expense trends, category cost breakdowns, booking conversion rates, and download financial reports in one click.",
      bullets: [
        "Interactive financial charts illustrating Revenue vs Expenses vs Profit",
        "Category distribution visualizer for lodging, transport, and marketing",
        "Instant one-click CSV export of monthly financial performance",
        "Direct MongoDB aggregation pipelines computing live business KPIs",
      ],
      mockupType: "reports",
    },
  ];

  // 9-Step Connected Business Workflow
  const workflowSteps = [
    {
      step: 1,
      title: "Lead Generation",
      tag: "Capture Inquiries",
      desc: "Travelers submit trip inquiries via public website, phone, or referral campaigns.",
      detail: "All inbound interest is captured with travelers' preferred destinations, travel dates, and party sizes.",
    },
    {
      step: 2,
      title: "Lead Management",
      tag: "Sales Pipeline",
      desc: "Sales agents are assigned, follow-up calls are logged, and budget requirements are qualified.",
      detail: "Inquiries move through visual stages on the Kanban pipeline with clear stage velocity metrics.",
    },
    {
      step: 3,
      title: "Customer Creation",
      tag: "Traveler Profile",
      desc: "Qualified inquiries are converted into comprehensive customer profiles in MongoDB.",
      detail: "Stores contact details, travel preferences, emergency contacts, and previous history.",
    },
    {
      step: 4,
      title: "Quotation Generation",
      tag: "Itinerary & Costing",
      desc: "Custom multi-item estimates are created with itemized pricing, inclusions, and GST.",
      detail: "Printable quotes with company branding are shared with clients for immediate review and acceptance.",
    },
    {
      step: 5,
      title: "Booking Confirmation",
      tag: "Trip Confirmed",
      desc: "Accepted quotation automatically converts into a confirmed booking departure record.",
      detail: "Locks in travel dates, traveler count, allocated packages, and assigns a unique booking reference.",
    },
    {
      step: 6,
      title: "Invoice Generation",
      tag: "Tax Compliant",
      desc: "GST tax invoice is automatically drafted with itemized breakdowns and balance clearance schedule.",
      detail: "Complies with Indian GST tax guidelines, tracking subtotal, tax rate, and payment due dates.",
    },
    {
      step: 7,
      title: "Payment Collection",
      tag: "Fund Clearance",
      desc: "Inbound advance or full payments are logged via UPI, NEFT, IMPS, or Card gateways.",
      detail: "Updates booking payment status from Unpaid → Partially Paid → Paid in real time.",
    },
    {
      step: 8,
      title: "Trip Operations",
      tag: "Dispatch Command",
      desc: "Operations team allocates 4x4 vehicles, assigns drivers, contacts guides, and completes checklists.",
      detail: "Ground manifest tracks traveler check-ins, hotel room allocations, and pre-departure safety items.",
    },
    {
      step: 9,
      title: "Reports & Analytics",
      tag: "Net Margin Audit",
      desc: "Revenues, trip expenses, and supplier payouts are aggregated to calculate net profit margins.",
      detail: "Data flows directly into executive BI charts and financial CSV spreadsheets for accounting.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
                Explore My Packages
              </span>
              <span className="text-[11px] text-blue-600 font-semibold tracking-wider uppercase block">
                Travel OS Enterprise CRM
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#overview" className="hover:text-blue-600 transition">
              Overview
            </a>
            <a href="#modules" className="hover:text-blue-600 transition">
              All 21 Modules
            </a>
            <a href="#features" className="hover:text-blue-600 transition">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-blue-600 transition">
              Business Workflow
            </a>
            <a href="#dashboard" className="hover:text-blue-600 transition">
              Live Mockup
            </a>
            <a href="#security" className="hover:text-blue-600 transition">
              Security
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#modules"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
            >
              Explore Modules
            </a>
            <Link
              href="/crm/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition transform hover:-translate-y-0.5"
            >
              <span>Login to CRM</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/crm/login"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-6 py-4 space-y-3 shadow-lg animate-fadeIn">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Overview
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              All 21 Modules
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Business Workflow
            </a>
            <a
              href="#dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Dashboard Mockup
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Security Architecture
            </a>
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/crm/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-xs"
              >
                <span>Login to CRM Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Complete Enterprise Travel Operating System • Next.js 14 & MongoDB</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Your Entire Travel Business.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              One Powerful Platform.
            </span>
          </h1>

          {/* Supporting Description */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Manage leads, customers, quotations, bookings, trips, employees, finances and business operations from one centralized Travel Management CRM.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="#modules"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition transform hover:-translate-y-0.5"
            >
              <span>Explore Features</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/crm/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-xs transition"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Login to CRM</span>
            </Link>
          </div>

          {/* Trust Metric Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Architecture</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">21 Active Modules</span>
              <span className="text-[11px] text-emerald-600 font-medium">Fully database-driven</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Database</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">MongoDB Atlas</span>
              <span className="text-[11px] text-blue-600 font-medium">Cached connection pool</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Security</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">Role-Based RBAC</span>
              <span className="text-[11px] text-indigo-600 font-medium">Bcrypt session guard</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Compliance</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">GST Invoicing</span>
              <span className="text-[11px] text-amber-600 font-medium">Tax itemized ledger</span>
            </div>
          </div>

          {/* Realistic Dashboard Mockup Preview */}
          <div className="pt-10 max-w-6xl mx-auto">
            <div className="rounded-3xl bg-white border border-slate-300 shadow-2xl overflow-hidden p-2 sm:p-3 text-left">
              {/* Browser Window Chrome Header */}
              <div className="bg-slate-100/80 px-4 py-3 rounded-2xl border border-slate-200 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:inline-block">
                    https://app.explorepackages.com/crm/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Production Live • Light Theme</span>
                </div>
              </div>

              {/* Inside CRM Mockup Body */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 space-y-6 border border-slate-200">
                {/* Mockup CRM Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      Executive Overview
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Explore My Packages &bull; Operations Desk</h3>
                    <p className="text-xs text-slate-500">Live operational ledger across 21 interconnected departments</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
                      FY 2026-27
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs">
                      Synchronized
                    </span>
                  </div>
                </div>

                {/* 4 Mockup KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Revenue</span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900">₹48,50,000</p>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +24.8% growth
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Bookings</span>
                    <p className="text-xl sm:text-2xl font-black text-blue-600">148 Confirmed</p>
                    <span className="text-[11px] text-slate-500 font-medium">98.4% on schedule</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Travelers</span>
                    <p className="text-xl sm:text-2xl font-black text-indigo-600">320 Guests</p>
                    <span className="text-[11px] text-emerald-600 font-semibold">100% verified KYC</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Net Profit Margin</span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">₹18,40,000</p>
                    <span className="text-[11px] text-blue-600 font-semibold">37.9% net margin</span>
                  </div>
                </div>

                {/* Mockup Graph & Mini Operations manifest */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Chart Preview */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Monthly Revenue vs Net Profit Trend</span>
                      <span className="text-[11px] text-slate-400">Values in ₹ Lakhs</span>
                    </div>
                    {/* Simulated SVG Graph */}
                    <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
                      {[
                        { m: "Jan", r: 40, p: 18 },
                        { m: "Feb", r: 55, p: 24 },
                        { m: "Mar", r: 70, p: 32 },
                        { m: "Apr", r: 85, p: 38 },
                        { m: "May", r: 95, p: 44 },
                        { m: "Jun", r: 100, p: 48 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-32">
                            <div
                              style={{ height: `${item.r}%` }}
                              className="w-1/2 bg-blue-600 rounded-t-md transition-all hover:bg-blue-700"
                              title={`Revenue: ₹${item.r}L`}
                            />
                            <div
                              style={{ height: `${item.p}%` }}
                              className="w-1/2 bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                              title={`Profit: ₹${item.p}L`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.m}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Billed Revenue
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Net Profit Margin
                      </span>
                    </div>
                  </div>

                  {/* Right Live Operations Preview */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <span className="text-xs font-bold text-slate-900 block">Live Ground Dispatch</span>
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-600 text-[11px]">BK-2026-0042</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px]">
                            ON TOUR
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">Spiti Valley High Altitude 7D6N</p>
                        <p className="text-[10px] text-slate-500">Innova Crysta (HP 01 A 4589) &bull; Ramesh Negi</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-600 text-[11px]">BK-2026-0043</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[9px]">
                            SCHEDULED
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">Leh Ladakh Monasteries & Lakes</p>
                        <p className="text-[10px] text-slate-500">Tempo Traveller 4x4 &bull; Tenzin Dorje</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-[11px]">
                        <span className="text-blue-700 font-semibold">Active Fleet: 18 Vehicles</span>
                        <span className="text-slate-500 font-medium">100% Insured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPLETE CRM OVERVIEW (All 6 Pillars & 21 Modules) */}
      <section id="modules" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Comprehensive Architectural Scope
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              21 Modules Across 6 Enterprise Pillars
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Explore My Packages eliminates fragmented software tools. Every operational aspect of your travel agency functions as one synchronized database system.
            </p>
          </div>

          {/* 6 Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header with Icon and Tag */}
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${cat.badgeClass}`}>
                        {cat.tagline}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cat.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{cat.description}</p>
                    </div>

                    {/* Modules Checklist */}
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included Active Modules
                      </span>
                      {cat.modules.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-0.5 hover:border-blue-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-blue-600">Active</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug pl-5">{m.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{cat.modules.length} Connected Modules</span>
                    <Link
                      href="/crm/login"
                      className="text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 transition"
                    >
                      <span>Access in CRM</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. INDIVIDUAL FEATURE DEEP-DIVES */}
      <section id="features" className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Deep Operational Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Built Specifically for Travel Agency Workflows
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Generic CRMs fail to address multi-day itineraries, fleet dispatches, guide vouchers, and GST line-items. Explore My Packages solves travel business realities.
            </p>
          </div>

          {/* Interactive Feature Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center">
            {featureDeepDives.map((feat, idx) => (
              <button
                key={feat.id}
                onClick={() => setActiveFeatureTab(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs ${
                  activeFeatureTab === idx
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {feat.tag}
              </button>
            ))}
          </div>

          {/* Active Feature Showcase Card */}
          {(() => {
            const current = featureDeepDives[activeFeatureTab];
            return (
              <div className="rounded-3xl bg-white border border-slate-200 shadow-md p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Left Description Column */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{current.tag}</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {current.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {current.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    {current.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                        <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <Link
                      href="/crm/login"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <span>Launch This Module in CRM</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Interactive Mockup Container */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-blue-600" />
                      Live CRM Component Preview
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Atlas Synchronized
                    </span>
                  </div>

                  {/* Dynamic Mockup Card Content based on feature */}
                  {current.mockupType === "leads" && (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div>
                          <p className="font-bold text-slate-900">Dr. Alok Nath & Family (5 Guests)</p>
                          <p className="text-[10px] text-slate-500">Destination: Ladakh Khardungla Expedition</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                          PROPOSAL SENT
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div>
                          <p className="font-bold text-slate-900">Meera Kapoor & Friends (3 Guests)</p>
                          <p className="text-[10px] text-slate-500">Destination: Spiti Valley Snow Safari</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          CONVERTED (WON)
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] flex justify-between">
                        <span>Lead Score: 94/100 (High Probability)</span>
                        <span className="font-bold text-blue-600">Est. Budget: ₹1,85,000</span>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "customers" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-900 text-sm">Sunil Verma (VIP Traveler)</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            ACTIVE CLIENT
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Email: sunil.v@enterprise.com &bull; Phone: +91 98765 43210</p>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Total Lifetime Trips:</span>
                            <span className="font-bold text-slate-800">4 Completed Tours</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Total Revenue Contributed:</span>
                            <span className="font-bold text-emerald-600">₹4,20,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "quotations" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-blue-600">QUO-2026-0089</span>
                          <span className="text-slate-400 font-mono">Issued: 14 Nov 2026</span>
                        </div>
                        <p className="font-semibold text-slate-800">Manali - Rohtang - Solang Premium Winter Tour</p>
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-600">
                            <span>Base Tour & Hotel Package:</span>
                            <span>₹68,000</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>4x4 Snow Cabs & Permits:</span>
                            <span>₹14,000</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>GST (5% Tax):</span>
                            <span>₹4,100</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                            <span>Total Payable Amount:</span>
                            <span className="text-emerald-600">₹86,100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "operations" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">Manifest: OP-2026-0034</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            FLEET DISPATCHED
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Vehicle Registration:</span>
                            <span className="font-semibold text-slate-800">HP 01 A 4589 (Innova Crysta)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Assigned Driver:</span>
                            <span className="font-semibold text-slate-800">Ramesh Negi (+91 98...)</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-700">
                          Checklist: Oxygen Kit Verified &bull; Rohtang Pass Acquired &bull; Hotel Vouchers Issued
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "hr" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">Today&apos;s Time Clock Attendance</span>
                          <span className="text-emerald-600 font-bold text-[11px]">18 / 18 Present</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-[11px]">
                          <div>
                            <p className="font-bold text-slate-800">Priya Sharma</p>
                            <p className="text-slate-500">Sales Department &bull; Tour Specialist</p>
                          </div>
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-semibold">
                            Punched 09:14 AM
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-[11px]">
                          <div>
                            <p className="font-bold text-slate-800">Vikram Thakur</p>
                            <p className="text-slate-500">Ground Operations &bull; Dispatch Lead</p>
                          </div>
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-semibold">
                            Punched 08:48 AM
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "finance" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900">Invoice #INV-2026-0112</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            FULLY SETTLED
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Billed to: Rajesh Gupta (8 Guests)</span>
                          <span className="font-bold text-slate-900">₹1,45,000</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex justify-between">
                          <span>UPI Ref: 449201948102 (HDFC)</span>
                          <span className="font-bold">Verified Clearance</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "cms" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">Website CMS Section: Homepage Hero</span>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            PUBLISHED LIVE
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">&quot;Unveil the Majesty of the Himalayas - Custom-curated treks & expeditions.&quot;</p>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex justify-between">
                          <span>Public Portal Sync:</span>
                          <span className="text-emerald-600 font-bold">Online & Responsive</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.mockupType === "reports" && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">Executive P&L Summary</span>
                          <span className="text-blue-600 font-mono text-[10px]">Q2 Fiscal Export</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                            <span className="font-bold text-slate-900">₹48.5L</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Expenses</span>
                            <span className="font-bold text-rose-600">₹30.1L</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Net Profit</span>
                            <span className="font-bold text-emerald-600">₹18.4L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 5. CONNECTED BUSINESS WORKFLOW (The 9-Step Lifecycle) */}
      <section id="workflow" className="py-20 md:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Complete Business Lifecycle
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              One Flow. Zero Disconnected Spreadsheets.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Observe how a single traveler inquiry flows seamlessly across all 21 modules without ever copying or retyping data.
            </p>
          </div>

          {/* 9-Step Interactive / Animated Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 relative">
            {workflowSteps.map((wf, idx) => {
              const isSelected = activeWorkflowStep === idx;
              return (
                <div
                  key={wf.step}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all text-left space-y-3 relative ${
                    isSelected
                      ? "bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                      {wf.step}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {wf.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{wf.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{wf.desc}</p>
                  <p className="text-[11px] text-blue-700 font-medium pt-1 border-t border-slate-100">
                    {wf.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Workflow Bottom Summary Banner */}
          <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center max-w-4xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
              Automated Data Pipeline
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">
              When a lead is converted, the Customer Record is automatically created. When a Quotation is accepted, the Booking is drafted. When a Booking is locked, the GST Invoice is issued, the Payment clearance is logged, and the Trip Dispatch manifest is prepared. All inside one centralized platform.
            </p>
          </div>
        </div>
      </section>

      {/* 6. LARGE INTERACTIVE DASHBOARD PREVIEW */}
      <section id="dashboard" className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Executive Management Interface
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Designed for Speed, Clarity & Elegance
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              A premium light interface engineered for busy travel operators. Zero eye fatigue, instantaneous load times, and high information density.
            </p>
          </div>

          {/* Interactive Screen Selector Tabs */}
          <div className="flex items-center justify-center gap-3">
            {[
              { id: "overview", label: "Executive Overview" },
              { id: "operations", label: "Field Operations Manifest" },
              { id: "pipeline", label: "Leads & Bookings Funnel" },
              { id: "finance", label: "P&L Ledger & Invoicing" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMockupTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  activeMockupTab === tab.id
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* High Fidelity Screen Display */}
          <div className="rounded-3xl bg-white border border-slate-300 p-6 sm:p-8 shadow-xl max-w-5xl mx-auto">
            {activeMockupTab === "overview" && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Master Operations Dashboard</h3>
                    <p className="text-xs text-slate-500">Live MongoDB Aggregation: All Time Financials</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Live System Synchronized
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Bookings</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">148</p>
                    <span className="text-[11px] text-emerald-600 font-semibold">+18 this week</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Traveler Guests</span>
                    <p className="text-2xl font-black text-blue-600 mt-1">320</p>
                    <span className="text-[11px] text-slate-500">Across 14 destinations</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Collected Funds</span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">₹42,30,000</p>
                    <span className="text-[11px] text-emerald-600">87.2% cleared</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Pending Balance</span>
                    <p className="text-2xl font-black text-amber-600 mt-1">₹6,20,000</p>
                    <span className="text-[11px] text-amber-600">Due before departures</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Recent Confirmed Departures</span>
                  <div className="divide-y divide-slate-200 text-xs">
                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-blue-600">BK-2026-0042</span> &bull; Sunil Verma &bull; Spiti Valley Winter Expedition (4 Guests)
                      </div>
                      <span className="font-bold text-slate-900">₹72,000</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-blue-600">BK-2026-0041</span> &bull; Rohit Sharma &bull; Ladakh Monasteries & Pangong Lake (2 Guests)
                      </div>
                      <span className="font-bold text-slate-900">₹58,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMockupTab === "operations" && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Trip Operations & Dispatch Command</h3>
                    <p className="text-xs text-slate-500">Fleet Allocations & Local Ground Guides</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    Active Ground Fleet
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600">OP-2026-0034</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">ON TOUR</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Spiti Valley High Altitude 7D6N</p>
                    <p className="text-xs text-slate-600">Guest: Dr. Meera Kapoor (4 Travelers)</p>
                    <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                      <p><strong>Vehicle:</strong> HP 01 A 4589 (Innova Crysta)</p>
                      <p><strong>Driver:</strong> Ramesh Negi (+91 98160 12345)</p>
                      <p><strong>Guide:</strong> Tenzin Norbu (Manali Alpine Guide)</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-600">OP-2026-0035</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">SCHEDULED</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">Leh Ladakh Monasteries Circuit</p>
                    <p className="text-xs text-slate-600">Guest: Arvind Khurana (6 Travelers)</p>
                    <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                      <p><strong>Vehicle:</strong> JK 10 B 7789 (Tempo Traveller 4x4)</p>
                      <p><strong>Driver:</strong> Stanzin Dorje (+91 94191 56789)</p>
                      <p><strong>Hotel:</strong> Grand Dragon Leh (3 Deluxe Rooms)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMockupTab === "pipeline" && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Leads Pipeline & Quotations Funnel</h3>
                    <p className="text-xs text-slate-500">Visual Sales Velocity & Conversion Tracking</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-200">
                    Lead Scoring Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Stage: New Inquiry (6)</span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                      <p className="text-xs font-bold text-slate-900">Nikhil Chawla</p>
                      <p className="text-[11px] text-slate-500">Chandrataal Trek &bull; 2 Guests</p>
                      <span className="text-[10px] font-bold text-blue-600 block">Est: ₹35,000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Stage: Proposal Sent (4)</span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                      <p className="text-xs font-bold text-slate-900">Alok & Reema Sharma</p>
                      <p className="text-[11px] text-slate-500">Kashmir Great Lakes &bull; 4 Guests</p>
                      <span className="text-[10px] font-bold text-indigo-600 block">Quote: ₹1,10,000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Stage: Won & Converted (12)</span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                      <p className="text-xs font-bold text-slate-900">Deepak Verma Group</p>
                      <p className="text-[11px] text-slate-500">Manali Winter Special &bull; 8 Guests</p>
                      <span className="text-[10px] font-bold text-emerald-600 block">Booked: ₹1,85,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMockupTab === "finance" && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">GST Invoices, Payments & Net Margin</h3>
                    <p className="text-xs text-slate-500">Real-Time Financial Settlement Ledger</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Tax Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block">Tax Invoice: INV-2026-0042</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Billed Amount (GST 5%):</span>
                      <span className="font-bold text-slate-900">₹72,000</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Advance Received via UPI:</span>
                      <span className="font-bold">₹30,000</span>
                    </div>
                    <div className="flex justify-between text-amber-600 border-t border-slate-200 pt-1 font-bold">
                      <span>Balance Outstanding:</span>
                      <span>₹42,000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block">Operational Payouts & Net Margin</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Booking Price:</span>
                      <span>₹72,000</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Hotel + Transport Cost:</span>
                      <span>-₹44,500</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 border-t border-slate-200 pt-1 font-bold">
                      <span>Net Operational Margin:</span>
                      <span>+₹27,500 (38.2%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. SECURITY & TECHNOLOGY ARCHITECTURE */}
      <section id="security" className="py-20 md:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Under The Hood
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Enterprise Technology & Security
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Built on Next.js 14 App Router and MongoDB Atlas with production-grade session security and strict role governance.
            </p>
          </div>

          {/* 6 Tech Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">MongoDB Atlas Database</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persistent cloud cluster with cached connection pooling, schema validations, and high-performance indexing across all 21 agency modules.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic permission matrix allowing granular module-level authorization (Read, Write, Delete) for Super Admins, Managers, and Staff.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Server-Side Authorization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict Next.js server route guards (`requireAuth`) ensuring protected CRM views and sensitive financial API endpoints cannot be breached.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Next.js 14 App Router</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lightning-fast server components, automatic code splitting, optimized rendering, and isolated layout route grouping.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">GST Compliant Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configurable Indian GST calculations (5%, 12%, 18%), HSN/SAC service categories, legal invoice numbering, and print templates.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Unified Web & CRM Architecture</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Single codebase powering both the public-facing promotional website and the high-security internal operations operating system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION (CTA) BANNER */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-14 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Explore My Packages OS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to Modernize Your Travel Agency Operations?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Sign in to your administrative dashboard, manage client departures, monitor financial margins, and coordinate ground dispatch in real time.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/crm/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-700 font-extrabold text-sm shadow-lg hover:bg-slate-100 transition transform hover:-translate-y-0.5"
                >
                  <span>Login to Explore My Packages CRM</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-blue-700/50 hover:bg-blue-700 text-white border border-white/20 text-sm font-semibold transition"
                >
                  Review All 21 Modules
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. COMPREHENSIVE FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Footer Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-lg text-slate-900 block leading-tight">
                    Explore My Packages
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase block">
                    Travel OS Enterprise
                  </span>
                </div>
              </Link>
              <p className="text-slate-500 leading-relaxed max-w-sm">
                A unified Travel Agency Management CRM and operations platform. Built with Next.js 14 and MongoDB Atlas to streamline departures, billing, and traveler relationships.
              </p>
              <div className="space-y-1 text-slate-500 pt-2">
                <p className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  The Mall Road, Manali, Himachal Pradesh 175131
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  +91 98765 43210 &bull; 24/7 Operations Desk
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  bookings@himalayanvistas.com
                </p>
              </div>
            </div>

            {/* Col 2: Core Modules */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">Sales & Tours</span>
              <ul className="space-y-2">
                <li><Link href="/crm/leads" className="hover:text-blue-600 transition">Leads Pipeline</Link></li>
                <li><Link href="/crm/customers" className="hover:text-blue-600 transition">Customers 360</Link></li>
                <li><Link href="/crm/quotations" className="hover:text-blue-600 transition">Quotations Builder</Link></li>
                <li><Link href="/crm/packages" className="hover:text-blue-600 transition">Tour Packages</Link></li>
                <li><Link href="/crm/destinations" className="hover:text-blue-600 transition">Destinations</Link></li>
                <li><Link href="/crm/bookings" className="hover:text-blue-600 transition">Bookings Ledger</Link></li>
                <li><Link href="/crm/operations" className="hover:text-blue-600 transition">Trip Operations</Link></li>
              </ul>
            </div>

            {/* Col 3: HR & Finance */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">HR & Financials</span>
              <ul className="space-y-2">
                <li><Link href="/crm/employees" className="hover:text-blue-600 transition">Staff Directory</Link></li>
                <li><Link href="/crm/departments" className="hover:text-blue-600 transition">Departments</Link></li>
                <li><Link href="/crm/attendance" className="hover:text-blue-600 transition">Attendance Terminal</Link></li>
                <li><Link href="/crm/leaves" className="hover:text-blue-600 transition">Leave Approvals</Link></li>
                <li><Link href="/crm/invoices" className="hover:text-blue-600 transition">GST Invoices</Link></li>
                <li><Link href="/crm/payments" className="hover:text-blue-600 transition">Payment Receipts</Link></li>
                <li><Link href="/crm/expenses" className="hover:text-blue-600 transition">Expenses & Profit</Link></li>
                <li><Link href="/crm/vendors" className="hover:text-blue-600 transition">Vendors & Fleet</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform & Portal */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider block">Portal & Access</span>
              <ul className="space-y-2">
                <li><Link href="/crm/dashboard" className="hover:text-blue-600 transition">CRM Dashboard</Link></li>
                <li><Link href="/crm/admin/roles" className="hover:text-blue-600 transition">Roles & RBAC</Link></li>
                <li><Link href="/crm/settings" className="hover:text-blue-600 transition">System Settings</Link></li>
                <li><Link href="/crm/website_cms" className="hover:text-blue-600 transition">Website CMS</Link></li>
                <li><Link href="/crm/tasks" className="hover:text-blue-600 transition">Tasks & To-Dos</Link></li>
                <li><Link href="/crm/reports" className="hover:text-blue-600 transition">Reports & Analytics</Link></li>
                <li className="pt-2">
                  <Link
                    href="/crm/login"
                    className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>Staff Login &rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Security Badges */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} Explore My Packages. Enterprise Travel Agency Management Suite. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                MongoDB Atlas Connected
              </span>
              <span>&bull;</span>
              <span>Next.js 14 App Router</span>
              <span>&bull;</span>
              <span>Bcrypt Secured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

