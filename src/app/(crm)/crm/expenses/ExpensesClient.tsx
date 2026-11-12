"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Tag,
  Building,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseItem {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  bookingRef?: string;
  vendorName?: string;
  status: "approved" | "pending" | "rejected";
  notes?: string;
}

export default function ExpensesClient() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "hotels",
    amount: 12000,
    date: new Date().toISOString().split("T")[0],
    bookingRef: "",
    vendorName: "",
    notes: "",
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/crm/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data);
        if (data.vendors) setVendors(data.vendors);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          title: "",
          category: "hotels",
          amount: 12000,
          date: new Date().toISOString().split("T")[0],
          bookingRef: "",
          vendorName: "",
          notes: "",
        });
        fetchExpenses();
      } else {
        alert(data.error || "Failed to log expense");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(`/api/crm/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchExpenses();
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
              <TrendingDown className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses & Net Margin Ledger</h1>
          </div>
          <p className="text-sm text-slate-500">
            Track operational costs, hotel payouts, transport costs, and live agency profit margins.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Log Operational Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Agency Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Incurred Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Net Operational Profit</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.netProfit)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Net Margin Efficiency</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.profitMargin}%</p>
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
            placeholder="Search by title, booking reference, or vendor..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
        >
          <option value="all">All Expense Categories</option>
          <option value="hotels">Hotels & Lodging</option>
          <option value="transportation">Transportation & Cabs</option>
          <option value="fuel">Fuel & Highway Tolls</option>
          <option value="activities">Permits & Activities</option>
          <option value="marketing">Marketing & Ads</option>
          <option value="office_expenses">Office & Utilities</option>
          <option value="vendor_payments">Vendor Settlements</option>
        </select>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Expense Ledger from MongoDB Atlas...</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <TrendingDown className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No expenses recorded</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log hotel payouts, transportation fuel, and vendor balances to calculate accurate net profit.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Expense Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Linked Booking</th>
                <th className="p-3.5">Vendor / Payee</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{e.title}</p>
                    {e.notes && <p className="text-[10px] text-slate-500 truncate max-w-xs">{e.notes}</p>}
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium capitalize">
                      {e.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-blue-600">{e.bookingRef || "-"}</td>
                  <td className="p-3.5 text-slate-700">{e.vendorName || "-"}</td>
                  <td className="p-3.5 text-slate-500">{formatDate(e.date)}</td>
                  <td className="p-3.5 font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(e._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Expense"
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

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Log Operational Expense</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Manali Hotel 3 Nights Payout"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Expense Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                >
                  <option value="hotels">Hotels & Lodging</option>
                  <option value="transportation">Transportation & Cabs</option>
                  <option value="fuel">Fuel & Toll Charges</option>
                  <option value="activities">Trek Guides & Permits</option>
                  <option value="marketing">Marketing & Meta Ads</option>
                  <option value="office_expenses">Office & Administration</option>
                  <option value="vendor_payments">Vendor Settlements</option>
                  <option value="other">Other Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Amount (₹) *</label>
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
                <label className="block text-slate-700 font-medium mb-1">Linked Booking Reference (Optional)</label>
                <input
                  type="text"
                  value={formData.bookingRef}
                  onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="BK-2026-..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Grand View Hotel Manali"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
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
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

