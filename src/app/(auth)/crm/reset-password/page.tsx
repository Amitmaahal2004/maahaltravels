"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Password reset token is required.");
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      setErrorMessage("Please fulfill all password security requirements.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Password reset failed.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (_err) {
      setErrorMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-5 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Complete</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Your credentials have been securely updated. Prior active sessions have been invalidated.
            </p>
          </div>
          <Link
            href="/crm/login"
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
          >
            Sign In with New Password
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!searchParams.get("token") && (
            <div>
              <label
                htmlFor="token"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Reset Authorization Token
              </label>
              <input
                id="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token here"
                className="block w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-mono transition shadow-xs"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
            >
              New Secure Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm pr-11 transition shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition shadow-xs"
            />
          </div>

          {/* Complexity Indicators */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <p className="text-slate-700 font-semibold mb-1">Password Requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className={hasMinLength ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {hasMinLength ? "✓" : "○"} 8+ characters
              </span>
              <span className={hasUpper ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {hasUpper ? "✓" : "○"} Uppercase letter
              </span>
              <span className={hasLower ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {hasLower ? "✓" : "○"} Lowercase letter
              </span>
              <span className={hasNumber ? "text-emerald-600 font-medium" : "text-slate-400"}>
                {hasNumber ? "✓" : "○"} At least 1 number
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Updating Password...
              </>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-indigo-50/40 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white">
            <Compass className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Create New Password
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Enter and confirm your new high-entropy password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={<div className="text-center py-8 text-slate-400">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

