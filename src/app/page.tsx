import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">
                Himalayan Vistas
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase block">
                Curated Expeditions & Travel OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/crm/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-white border border-slate-700/80 text-xs font-semibold shadow-sm transition"
            >
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              <span>Agency CRM Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-600/10 via-indigo-600/15 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Travel Agency ERP & CRM + Website Suite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Curated Himalayan Expeditions & Complete Agency Management
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A unified full-stack architecture combining a public-facing luxury tour booking portal with a
            high-security internal CRM powering sales, operations, billing, and staff workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/crm/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 transition transform hover:-translate-y-0.5"
            >
              <span>Access Internal CRM Suite</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/crm/admin/roles"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm shadow-sm transition"
            >
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              <span>RBAC Permission Grid</span>
            </Link>
          </div>

          {/* Quick Specifications Pill Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Architecture</span>
              <span className="text-sm font-semibold text-white mt-1 block">Next.js 14 App Router</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Database</span>
              <span className="text-sm font-semibold text-white mt-1 block">MongoDB + 36 Schemas</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Security</span>
              <span className="text-sm font-semibold text-white mt-1 block">Bcrypt & Server RBAC</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Verification</span>
              <span className="text-sm font-semibold text-emerald-400 mt-1 block">25/25 Tests Passing</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Himalayan Vistas & Beyond. Enterprise Travel Operating Suite.</p>
      </footer>
    </div>
  );
}
