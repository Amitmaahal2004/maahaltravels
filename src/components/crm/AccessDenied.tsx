"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock, KeyRound } from "lucide-react";
import { SafeUser } from "@/types/auth.types";

interface AccessDeniedProps {
  moduleName: string;
  user: SafeUser;
  requiredAction?: string;
  reason?: string;
}

export default function AccessDenied({
  moduleName,
  user,
  requiredAction = "view",
  reason,
}: AccessDeniedProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6">
        {/* Shield Icon */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <Lock className="h-3 w-3" />
            <span>403 Forbidden &bull; Restricted Area</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Access Denied
          </h2>
          <p className="text-sm text-slate-500">
            You do not have permission to access the{" "}
            <span className="font-semibold text-slate-800">{moduleName}</span> module.
          </p>
        </div>

        {/* Role & Context Box */}
        <div className="text-left bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Authenticated Staff:</span>
            <span className="font-semibold text-slate-800">{user.name}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Assigned Role:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              <KeyRound className="h-3 w-3" />
              {user.role.name}
            </span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Required Permission:</span>
            <code className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
              {moduleName.toLowerCase().replace(/\s+/g, "_")}:{requiredAction}
            </code>
          </div>
          {reason && (
            <p className="text-slate-600 text-[11px] pt-1 italic">
              &quot;{reason}&quot;
            </p>
          )}
        </div>

        {/* Guidance */}
        <p className="text-xs text-slate-500 leading-relaxed">
          Access to this section is strictly governed by Role-Based Access Control (RBAC).
          If you require access to perform your duties, please request your Super Administrator
          to grant this permission in the <strong>Roles & Permissions</strong> module.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/crm/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-xs transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

