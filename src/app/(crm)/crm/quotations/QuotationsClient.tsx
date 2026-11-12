"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Send,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Printer,
  Sparkles,
  Plane,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface QuotationItem {
  _id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  packageName: string;
  destination: string;
  departureDate?: string;
  durationDays: number;
  travellersCount: number;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  validUntil: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  notes?: string;
  createdAt: string;
}

export default function QuotationsClient() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [summary, setSummary] = useState({
    totalQuotations: 0,
    acceptedCount: 0,
    pendingCount: 0,
    totalQuotedValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<QuotationItem | null>(null);

  // Form builder state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    destination: "",
    packageName: "",
    departureDate: "",
    durationDays: 5,
    travellersCount: 2,
    discount: 0,
    gstRate: 5,
    notes: "Includes hotel accommodation, daily breakfast, private sightseeing, and transfers.",
    terms: "25% advance to confirm booking. Balance payable 15 days prior to departure.",
    lineItems: [
      { description: "Hotel Accommodation (3-Star Deluxe)", quantity: 4, rate: 3500, total: 14000 },
      { description: "Private AC Vehicle Transfers & Sightseeing", quantity: 5, rate: 2800, total: 14000 },
      { description: "Guided Activity & Entry Permits", quantity: 2, rate: 2500, total: 5000 },
    ],
  });

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/quotations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [search, statusFilter]);

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        { description: "Additional Tour Service", quantity: 1, rate: 1000, total: 1000 },
      ],
    });
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = formData.lineItems.filter((_, idx) => idx !== index);
    setFormData({ ...formData, lineItems: updated });
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.lineItems];
    const item = { ...updated[index], [field]: value };
    item.total = Number(item.quantity) * Number(item.rate);
    updated[index] = item;
    setFormData({ ...formData, lineItems: updated });
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const taxable = Math.max(0, sub - (Number(formData.discount) || 0));
    const gst = Math.round((taxable * Number(formData.gstRate || 5)) / 100);
    return taxable + gst;
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to create quotation");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving quotation");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchQuotations();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleConvertToBooking = async (id: string) => {
    if (!confirm("Convert this quotation to an active booking in the ledger?")) return;
    try {
      const res = await fetch(`/api/crm/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert_to_booking" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Booking ${data.booking.bookingRef} generated successfully!`);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to convert quotation");
      }
    } catch (err) {
      console.error("Error converting quotation:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/crm/quotations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchQuotations();
    } catch (err) {
      console.error("Error deleting quotation:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Quotations & Proposals</h1>
          </div>
          <p className="text-sm text-slate-400">
            Generate formal customized tour pricing proposals with automatic GST breakdown and one-click booking conversion.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Quotation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Quotations</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalQuotations}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Accepted Proposals</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.acceptedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Pending Follow-up</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Quoted Value</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{formatCurrency(summary.totalQuotedValue)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quotation #, customer, package, or destination..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Quotations Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Quotations from MongoDB Atlas...</span>
        </div>
      ) : quotations.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <FileSpreadsheet className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No quotations found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Build your first custom quotation with live line-item and GST calculations.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-3.5">Quotation Ref</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Tour Details</th>
                <th className="p-3.5">Subtotal</th>
                <th className="p-3.5">GST (5%)</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {quotations.map((q) => (
                <tr key={q._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-sky-400">{q.quotationNumber}</p>
                    <p className="text-[10px] text-slate-500">Issued {formatDate(q.createdAt)}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-white">{q.customerName}</p>
                    <p className="text-[10px] text-slate-400">{q.customerEmail}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-medium text-slate-200">{q.packageName}</p>
                    <p className="text-[10px] text-slate-400">
                      {q.destination} &bull; {q.durationDays} Days &bull; {q.travellersCount} Guests
                    </p>
                  </td>
                  <td className="p-3.5 text-slate-300">{formatCurrency(q.subtotal)}</td>
                  <td className="p-3.5 text-slate-400">{formatCurrency(q.gstAmount)}</td>
                  <td className="p-3.5 font-bold text-emerald-400">{formatCurrency(q.totalAmount)}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        q.status === "accepted"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : q.status === "sent"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : q.status === "draft"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setPreviewQuote(q)}
                      className="p-1.5 text-sky-400 hover:bg-sky-950/40 rounded-lg transition"
                      title="View Quotation"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {q.status !== "accepted" && (
                      <button
                        onClick={() => handleConvertToBooking(q._id)}
                        className="px-2 py-1 text-[10px] rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold transition"
                        title="Convert to Booking"
                      >
                        Convert
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Quotation"
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

      {/* Quotation Preview Modal */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Quotation #{previewQuote.quotationNumber}</h2>
                <p className="text-xs text-sky-400 font-semibold">{previewQuote.packageName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Print Quotation"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => setPreviewQuote(null)} className="text-slate-400 hover:text-white text-lg">
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-slate-500">Prepared For</p>
                  <p className="font-bold text-white text-sm mt-0.5">{previewQuote.customerName}</p>
                  <p className="text-slate-400">{previewQuote.customerEmail}</p>
                  <p className="text-slate-400">{previewQuote.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Destination & Duration</p>
                  <p className="font-bold text-white text-sm mt-0.5">{previewQuote.destination}</p>
                  <p className="text-slate-400">{previewQuote.durationDays} Days / {previewQuote.travellersCount} Guests</p>
                  <p className="text-slate-400">Valid Until: {formatDate(previewQuote.validUntil)}</p>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {previewQuote.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-white">{item.description}</td>
                        <td className="p-3 text-center text-slate-300">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-300">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-right font-medium text-white">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-xs ml-auto text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white font-medium">{formatCurrency(previewQuote.subtotal)}</span>
                </div>
                {previewQuote.discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span>-{formatCurrency(previewQuote.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>GST ({previewQuote.gstRate}%):</span>
                  <span className="text-white font-medium">{formatCurrency(previewQuote.gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-emerald-400">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(previewQuote.totalAmount)}</span>
                </div>
              </div>

              {previewQuote.notes && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-slate-400 font-semibold mb-1">Notes & Inclusions:</p>
                  <p className="text-slate-300 leading-relaxed">{previewQuote.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(previewQuote._id, "sent")}
                  className="px-3 py-1.5 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 hover:bg-sky-600/30 font-semibold"
                >
                  Mark as Sent
                </button>
                <button
                  onClick={() => handleStatusChange(previewQuote._id, "accepted")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 font-semibold"
                >
                  Mark as Accepted
                </button>
              </div>
              <button
                onClick={() => setPreviewQuote(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Custom Quotation</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Ananya Sen"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. ananya@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Manali, Ladakh, Kashmir"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Package Title</label>
                  <input
                    type="text"
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. 6D5N Himalayan Wonder"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Quotation Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/20"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                        className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-16 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-center"
                      />
                      <input
                        type="number"
                        placeholder="Rate (₹)"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(idx, "rate", Number(e.target.value))}
                        className="w-24 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-right"
                      />
                      <span className="w-24 text-right font-semibold text-emerald-400">
                        {formatCurrency(item.total)}
                      </span>
                      {formData.lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-2 text-rose-400 hover:text-rose-300"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & GST Summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div>
                  <span className="text-slate-400">Subtotal</span>
                  <p className="font-bold text-white text-base mt-0.5">{formatCurrency(calculateSubtotal())}</p>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Estimated Total</span>
                  <p className="font-extrabold text-emerald-400 text-lg mt-0.5">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20"
                >
                  Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

