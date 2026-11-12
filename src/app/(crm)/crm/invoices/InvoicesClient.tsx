"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceRecord {
  _id: string;
  invoiceNumber: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "paid" | "partially_paid" | "unpaid" | "overdue" | "cancelled";
  notes?: string;
}

export default function InvoicesClient() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    paidCount: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    bookingRef: "",
    discount: 0,
    gstRate: 5,
    notes: "Payment due within 7 days. Thank you for choosing Himalayan Vistas.",
    items: [
      { description: "Himalayan Tour Package Booking", quantity: 1, rate: 45000 },
    ],
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "Additional Tour Service", quantity: 1, rate: 2000 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving invoice");
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Mark this invoice as fully cleared and settled?")) return;
    try {
      const res = await fetch(`/api/crm/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const data = await res.json();
      if (data.success) fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/crm/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchInvoices();
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
              <Receipt className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Ledger & Tax Bills</h1>
          </div>
          <p className="text-sm text-slate-400">
            Generate GST-compliant tax invoices, track payment clearances, and manage outstanding traveler receivables.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Tax Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Invoices Issued</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalInvoices}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Billed Volume</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{formatCurrency(summary.totalBilled)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Received</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(summary.totalPaid)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Outstanding Balance</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(summary.totalOutstanding)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, booking ref, or customer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Invoice Statuses</option>
          <option value="paid">Fully Settled</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="unpaid">Unpaid / Awaiting</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Invoices from MongoDB Atlas...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Receipt className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No invoices found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Invoices are auto-generated when bookings are confirmed or can be created manually above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Booking Ref</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Balance</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-sky-400">{inv.invoiceNumber}</td>
                  <td className="p-3.5 font-medium text-slate-300">{inv.bookingRef}</td>
                  <td className="p-3.5">
                    <p className="font-semibold text-white">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400">{inv.customerEmail}</p>
                  </td>
                  <td className="p-3.5 text-slate-300">{formatDate(inv.dueDate)}</td>
                  <td className="p-3.5 font-bold text-white">{formatCurrency(inv.totalAmount)}</td>
                  <td className="p-3.5 font-semibold text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                  <td className="p-3.5 font-semibold text-amber-400">{formatCurrency(inv.balanceAmount)}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        inv.status === "paid"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : inv.status === "partially_paid"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="p-1.5 text-sky-400 hover:bg-sky-950/50 rounded-lg transition"
                      title="View / Print Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {inv.status !== "paid" && (
                      <button
                        onClick={() => handleMarkPaid(inv._id)}
                        className="px-2 py-1 text-[10px] rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold transition"
                        title="Mark Paid"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(inv._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                      title="Delete Invoice"
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

      {/* Invoice Preview & Print Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Invoice #{previewInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-400">Ref: {previewInvoice.bookingRef}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Print Tax Invoice"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-white text-lg">
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-slate-500">Billed To</p>
                  <p className="font-bold text-white text-sm mt-0.5">{previewInvoice.customerName}</p>
                  <p className="text-slate-400">{previewInvoice.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Invoice Dates</p>
                  <p className="text-white mt-0.5">Issued: {formatDate(previewInvoice.issueDate)}</p>
                  <p className="text-rose-400 font-medium">Due Date: {formatDate(previewInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-3">Service Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {previewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-white">{item.description}</td>
                        <td className="p-3 text-center text-slate-300">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-300">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-right font-medium text-white">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-xs ml-auto text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white">{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({previewInvoice.gstRate}%):</span>
                  <span className="text-white">{formatCurrency(previewInvoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                  <span>Invoice Total:</span>
                  <span>{formatCurrency(previewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Paid to Date:</span>
                  <span>{formatCurrency(previewInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800 pt-1">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(previewInvoice.balanceAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Generate Manual Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Ramesh Chandra"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. ramesh@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Booking Reference</label>
                  <input
                    type="text"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="BK-2026-..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Billed Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-16 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-center"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", Number(e.target.value))}
                        className="w-24 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-right"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-400 hover:text-rose-300"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20"
                >
                  Create & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

