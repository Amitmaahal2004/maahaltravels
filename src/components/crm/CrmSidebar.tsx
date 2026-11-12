"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SafeUser } from "@/types/auth.types";
import {
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  UserCheck,
  Filter,
  FileSpreadsheet,
  Package,
  MapPin,
  CalendarDays,
  PlaneTakeoff,
  Receipt,
  CreditCard,
  TrendingDown,
  Truck,
  Globe,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CrmSidebarProps {
  user: SafeUser;
}

export default function CrmSidebar({ user }: CrmSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isSuperAdmin = user.role.slug === "super-admin";
  const hasModule = (moduleId: string) => {
    if (isSuperAdmin) return true;
    return user.permissions.some((p) => p.module === moduleId);
  };

  const navGroups = [
    {
      title: "Workspace",
      items: [
        {
          label: "Dashboard",
          href: "/crm/dashboard",
          icon: LayoutDashboard,
          visible: true,
        },
      ],
    },
    {
      title: "Access & Governance",
      items: [
        {
          label: "Roles & Permissions",
          href: "/crm/admin/roles",
          icon: ShieldCheck,
          visible: hasModule("roles"),
        },
        {
          label: "System Settings",
          href: "/crm/settings",
          icon: Settings,
          visible: hasModule("settings"),
        },
      ],
    },
    {
      title: "Sales & Clients",
      items: [
        {
          label: "Leads Pipeline",
          href: "/crm/leads",
          icon: Filter,
          visible: hasModule("leads"),
        },
        {
          label: "Customers",
          href: "/crm/customers",
          icon: UserCheck,
          visible: hasModule("customers"),
        },
        {
          label: "Quotations",
          href: "/crm/quotations",
          icon: FileSpreadsheet,
          visible: hasModule("quotations"),
        },
      ],
    },
    {
      title: "Travel & Tours",
      items: [
        {
          label: "Tour Packages",
          href: "/crm/packages",
          icon: Package,
          visible: hasModule("packages"),
        },
        {
          label: "Destinations",
          href: "/crm/destinations",
          icon: MapPin,
          visible: hasModule("destinations"),
        },
        {
          label: "Bookings",
          href: "/crm/bookings",
          icon: CalendarDays,
          visible: hasModule("bookings"),
        },
        {
          label: "Trip Operations",
          href: "/crm/operations",
          icon: PlaneTakeoff,
          visible: hasModule("operations"),
        },
      ],
    },
    {
      title: "Staff & Human Resources",
      items: [
        {
          label: "Employees",
          href: "/crm/employees",
          icon: Users,
          visible: hasModule("employees"),
        },
        {
          label: "Departments",
          href: "/crm/departments",
          icon: Building2,
          visible: hasModule("departments"),
        },
        {
          label: "Attendance",
          href: "/crm/attendance",
          icon: CalendarCheck,
          visible: hasModule("attendance"),
        },
        {
          label: "Leaves",
          href: "/crm/leaves",
          icon: CalendarOff,
          visible: hasModule("leaves"),
        },
      ],
    },
    {
      title: "Financial Ledger",
      items: [
        {
          label: "Invoices",
          href: "/crm/invoices",
          icon: Receipt,
          visible: hasModule("invoices"),
        },
        {
          label: "Payments",
          href: "/crm/payments",
          icon: CreditCard,
          visible: hasModule("payments"),
        },
        {
          label: "Expenses & Profit",
          href: "/crm/expenses",
          icon: TrendingDown,
          visible: hasModule("expenses"),
        },
        {
          label: "Vendors & Suppliers",
          href: "/crm/vendors",
          icon: Truck,
          visible: hasModule("vendors"),
        },
      ],
    },
    {
      title: "Marketing & Insights",
      items: [
        {
          label: "Website CMS",
          href: "/crm/website_cms",
          icon: Globe,
          visible: hasModule("website_cms"),
        },
        {
          label: "Tasks & To-Dos",
          href: "/crm/tasks",
          icon: CheckSquare,
          visible: hasModule("tasks"),
        },
        {
          label: "Reports & Analytics",
          href: "/crm/reports",
          icon: BarChart3,
          visible: hasModule("reports"),
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 text-slate-700 select-none shadow-sm ${collapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
        <Link href="/crm/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Compass className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-bold text-slate-900 text-base tracking-tight block">
                Explore My Packages
              </span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase block">
                Travel OS Enterprise
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((i) => i.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item, iIdx) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${isActive
                        ? "bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Info Capsule */}
      <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50/80">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-9 w-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-blue-700 truncate bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                  {user.role.name}
                </span>
                {user.department && (
                  <span className="text-[10px] text-slate-500 truncate">
                    • {user.department.code}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

