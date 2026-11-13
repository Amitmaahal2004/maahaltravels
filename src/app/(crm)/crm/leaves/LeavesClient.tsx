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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarOff className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management & Approvals</h1>
          </div>
          <p className="text-sm text-slate-500">
            Submit vacation, medical, and casual leave requests with administrative review workflows.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Applications</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalRequests}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Awaiting Manager Approval</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Approved Leaves</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.approvedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-600 font-semibold">Filter by Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table of Leaves */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Leave Records...</span>
        </div>
      ) : leaves.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <CalendarOff className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No leave requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Date Range</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-slate-900">{l.userName}</td>
                  <td className="p-3.5 capitalize font-medium text-blue-600">{l.leaveType}</td>
                  <td className="p-3.5 text-slate-700">
                    {formatDate(l.startDate)} &rarr; {formatDate(l.endDate)}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{l.totalDays} Days</td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">{l.reason}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${l.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : l.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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
                          className="px-2 py-1 text-[10px] rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(l._id, "rejected")}
                          className="px-2 py-1 text-[10px] rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition shadow-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(l._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Leave Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick / Medical Leave</option>
                  <option value="annual">Annual Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Total Days</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why you are requesting leave..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
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

