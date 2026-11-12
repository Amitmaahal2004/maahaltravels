"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  User,
  MapPin,
  Calendar,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BookingItem {
  _id: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  travellersCount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: "unpaid" | "partially_paid" | "paid" | "refunded";
  bookingStatus: "new" | "pending_confirmation" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export default function BookingsClient() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [summary, setSummary] = useState({
    totalBookings: 0,
    confirmedCount: 0,
    inProgressCount: 0,
    totalBookingValue: 0,
    totalCollected: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    packageName: "",
    departureDate: "",
    returnDate: "",
    adults: 2,
    children: 0,
    totalAmount: 45000,
    paidAmount: 15000,
    specialRequirements: "",
    bookingStatus: "confirmed",
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (bookingStatusFilter !== "all") params.append("bookingStatus", bookingStatusFilter);
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);

      const res = await fetch(`/api/crm/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, bookingStatusFilter, paymentStatusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchBookings();
      } else {
        alert(data.error || "Failed to create booking");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving booking");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this booking?")) return;
    try {
      const res = await fetch(`/api/crm/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchBookings();
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
              <CalendarDays className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Bookings Ledger</h1>
          </div>
          <p className="text-sm text-slate-500">
            Monitor confirmed departures, traveler counts, payment clearances, and linked GST invoices.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Booking
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalBookings}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Bookings Value</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.totalBookingValue)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Collected Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalCollected)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Outstanding Balance</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(summary.totalBalance)}</p>
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
            placeholder="Search by reference, traveler name, email, or tour package..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Trip Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Bookings from MongoDB Atlas...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <CalendarDays className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No bookings found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a booking or convert accepted quotations to generate live departure records.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Booking Ref</th>
                <th className="p-3.5">Traveler Name</th>
                <th className="p-3.5">Package</th>
                <th className="p-3.5">Departure Date</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Paid / Balance</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Trip Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-blue-600">{b.bookingRef}</span>
                    <span className="block text-[10px] text-slate-400">
                      Booked {formatDate(b.createdAt)}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-900">{b.customerName}</p>
                    <p className="text-[10px] text-slate-500">{b.customerEmail}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-medium text-slate-800">{b.packageName}</p>
                    <p className="text-[10px] text-slate-500">{b.travellersCount} Guests</p>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <span className="font-medium text-slate-900">{formatDate(b.departureDate)}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                  <td className="p-3.5">
                    <span className="text-emerald-600 font-medium">{formatCurrency(b.paidAmount)}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-amber-600 font-medium">{formatCurrency(b.balanceAmount)}</span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${b.paymentStatus === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : b.paymentStatus === "partially_paid"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                    >
                      {b.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={b.bookingStatus}
                      onChange={(e) => handleStatusChange(b._id, e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg text-[10px] py-1 px-1.5 text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Cancel Booking"
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

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create New Booking</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer Full Name *</label>
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
                  <label className="block text-slate-700 font-medium mb-1">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. sunil@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tour Package Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Manali Snow Expedition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Return Date</label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Total Booking Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Initial Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Special Requirements / Notes</label>
                <textarea
                  rows={2}
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                  placeholder="e.g. Vegetarian meals only, extra oxygen cylinder required for Rohtang..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
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
                  Confirm & Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

