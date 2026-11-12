"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  Smartphone,
  Building,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentItem {
  _id: string;
  paymentId: string;
  bookingRef: string;
  customerName: string;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "razorpay" | "cash" | "card" | "other";
  transactionRef: string;
  paymentDate: string;
  status: "completed" | "pending" | "failed" | "refunded";
  notes?: string;
}

export default function PaymentsClient() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalCollected: 0,
    upiCollected: 0,
    bankTransferCollected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    bookingRef: "",
    customerName: "",
    amount: 15000,
    paymentMethod: "upi",
    transactionRef: "",
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (methodFilter !== "all") params.append("method", methodFilter);

      const res = await fetch(`/api/crm/payments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, methodFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          bookingRef: "",
          customerName: "",
          amount: 15000,
          paymentMethod: "upi",
          transactionRef: "",
          notes: "",
        });
        fetchPayments();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording payment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch(`/api/crm/payments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchPayments();
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
              <CreditCard className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Transactions</h1>
          </div>
          <p className="text-sm text-slate-500">
            Audit inbound traveler funds, UPI transactions, NEFT/RTGS transfers, and automated ledger settlements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalTransactions}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalCollected)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">UPI Payments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.upiCollected)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Bank Transfers</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(summary.bankTransferCollected)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment ID, booking ref, guest name, or UTR/Txn ref..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
        >
          <option value="all">All Payment Channels</option>
          <option value="upi">UPI / QR Code</option>
          <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
          <option value="razorpay">Razorpay Gateway</option>
          <option value="cash">Cash Counter</option>
          <option value="card">Credit / Debit Card</option>
        </select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Payments from MongoDB Atlas...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <CreditCard className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No payment receipts logged</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Record Payment&quot; to clear booking balances and issue digital receipt slips.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Booking Ref</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">UTR / Txn Ref</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-blue-600">{p.paymentId}</td>
                  <td className="p-3.5 font-medium text-slate-700">{p.bookingRef}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{p.customerName}</td>
                  <td className="p-3.5 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase font-semibold">
                      {p.paymentMethod.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{p.transactionRef}</td>
                  <td className="p-3.5 text-slate-700">{formatDate(p.paymentDate)}</td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Record"
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

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Record Inbound Payment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Booking Reference *</label>
                <input
                  type="text"
                  required
                  value={formData.bookingRef}
                  onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. BK-2026-0001"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Sunil Verma"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="razorpay">Razorpay Gateway</option>
                  <option value="cash">Cash Counter</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Bank UTR / Transaction ID</label>
                <input
                  type="text"
                  value={formData.transactionRef}
                  onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. 334589021948"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

