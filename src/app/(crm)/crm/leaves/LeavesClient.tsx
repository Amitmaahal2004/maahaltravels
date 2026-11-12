"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LeaveItem {
  _id: string;
  userName: string;
  leaveType: "casual" | "sick" | "annual" | "unpaid";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function LeavesClient() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [summary, setSummary] = useState({ totalRequests: 0, pendingCount: 0, approvedCount: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    totalDays: 1,
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/leaves?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowApplyModal(false);
        setFormData({ leaveType: "casual", startDate: "", endDate: "", totalDays: 1, reason: "" });
        fetchLeaves();
      } else {
        alert(data.error || "Failed to submit leave request");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    }
  };

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    const rejectionReason = status === "rejected" ? prompt("Enter reason for rejection:") || "Rejected by manager" : undefined;
    try {
      const res = await fetch(`/api/crm/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leave record?")) return;
    try {
      const res = await fetch(`/api/crm/leaves/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <CalendarOff className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leave Management & Approvals</h1>
          </div>
          <p className="text-sm text-slate-400">
            Submit vacation, medical, and casual leave requests with administrative review workflows.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Applications</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalRequests}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Awaiting Manager Approval</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Approved Leaves</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.approvedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold">Filter by Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table of Leaves */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Leave Records...</span>
        </div>
      ) : leaves.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <CalendarOff className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No leave requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Date Range</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{l.userName}</td>
                  <td className="p-3.5 capitalize font-medium text-sky-400">{l.leaveType}</td>
                  <td className="p-3.5 text-slate-300">
                    {formatDate(l.startDate)} &rarr; {formatDate(l.endDate)}
                  </td>
                  <td className="p-3.5 font-bold text-slate-200">{l.totalDays} Days</td>
                  <td className="p-3.5 text-slate-300 max-w-xs truncate">{l.reason}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        l.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : l.status === "pending"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {l.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleDecision(l._id, "approved")}
                          className="px-2 py-1 text-[10px] rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-semibold border border-emerald-500/30 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(l._id, "rejected")}
                          className="px-2 py-1 text-[10px] rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 font-semibold border border-rose-500/30 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(l._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                      title="Delete Request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Apply for Leave</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Leave Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick / Medical Leave</option>
                  <option value="annual">Annual Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Days</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why you are requesting leave..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

