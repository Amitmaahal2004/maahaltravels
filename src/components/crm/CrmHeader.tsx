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
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-10">
      {/* Search Bar / Quick Action */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            readOnly
            placeholder="Search bookings, travelers, leads (Ctrl + K)..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            onClick={() => alert("Global Search will be fully wired in Phase 8.")}
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
            <Command className="h-2.5 w-2.5" /> K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Environment Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[11px] text-emerald-300 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MongoDB Atlas Connected</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          onClick={() => alert("Centralized Notification Center activates in Phase 8.")}
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-500" />
        </button>

        <div className="h-6 w-px bg-slate-800" />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-sky-400 leading-tight">{user.role.name}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-800 text-xs">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sky-400">
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
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  My Profile & Credentials
                </button>
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 transition"
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

