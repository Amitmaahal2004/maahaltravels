"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Mail, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; resetToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to process request. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessInfo({
        message: data.message,
        resetToken: data.resetToken,
      });
      setIsLoading(false);
    } catch (_err) {
      setErrorMessage("Network error. Could not connect to authentication service.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/20 via-sky-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 border border-white/10">
            <Compass className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          Reset Password
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Enter your registered work email to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-300">Request Processed</p>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {successInfo.message}
                  </p>
                </div>
              </div>

              {successInfo.resetToken && (
                <div className="p-4 rounded-xl bg-sky-950/70 border border-sky-800/80 text-sky-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-300">
                    <KeyRound className="h-4 w-4" />
                    <span>Development Environment Mode</span>
                  </div>
                  <p className="text-slate-300">
                    A single-use token was generated. In production this is delivered via secure email.
                  </p>
                  <Link
                    href={`/crm/reset-password?token=${encodeURIComponent(successInfo.resetToken)}`}
                    className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition mt-1"
                  >
                    Click to Continue with Token &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/crm/login"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >
                  Work Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@travelagency.com"
                    className="block w-full px-4 py-3 pl-11 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm transition"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Sending Request...
                  </>
                ) : (
                  "Generate Recovery Link"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/crm/login"
                  className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

