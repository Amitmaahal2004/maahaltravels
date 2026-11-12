"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "@/types/auth.types";
import {
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  Command,
} from "lucide-react";

interface CrmHeaderProps {
  user: SafeUser;
}

export default function CrmHeader({ user }: CrmHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout network error:", err);
    } finally {
      router.push("/crm/login");
      router.refresh();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
      {/* Search Bar / Quick Action */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            readOnly
            placeholder="Search bookings, travelers, leads (Ctrl + K)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
            onClick={() => alert("Global Search will be fully wired in Phase 8.")}
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            <Command className="h-2.5 w-2.5" /> K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Environment Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>MongoDB Atlas Connected</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          onClick={() => alert("Centralized Notification Center activates in Phase 8.")}
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-blue-600 font-medium leading-tight">{user.role.name}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                  <Shield className="h-3 w-3" />
                  <span>{user.role.name}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/crm/dashboard");
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  My Profile & Credentials
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

