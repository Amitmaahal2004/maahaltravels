import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block">
                Explore My Packages
              </span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase block">
                Curated Expeditions & Travel OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/crm/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-300 text-xs font-semibold shadow-xs transition"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Agency CRM Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-purple-100/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Travel Agency ERP & CRM + Website Suite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Curated Himalayan Expeditions & Complete Agency Management
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A unified full-stack architecture combining a public-facing luxury tour booking portal with a
            high-security internal CRM powering sales, operations, billing, and staff workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/crm/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition transform hover:-translate-y-0.5"
            >
              <span>Access Internal CRM Suite</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/crm/admin/roles"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-xs transition"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>RBAC Permission Grid</span>
            </Link>
          </div>

          {/* Quick Specifications Pill Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Architecture</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">Next.js 14 App Router</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Database</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">MongoDB Atlas Live</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Security</span>
              <span className="text-sm font-semibold text-slate-900 mt-1 block">Bcrypt & Server RBAC</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Verification</span>
              <span className="text-sm font-semibold text-emerald-600 mt-1 block">All Modules Active</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>© 2026 Explore My Packages & Beyond. Enterprise Travel Operating Suite.</p>
      </footer>
    </div>
  );
}
