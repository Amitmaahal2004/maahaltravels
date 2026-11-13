"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Star,
  Users,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Tag,
  Package,
  Share2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import DirectShareBrochureModal from "@/components/crm/packages/DirectShareBrochureModal";

interface CustomerItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  customerType: "individual" | "corporate" | "family" | "vip";
  source: string;
  tags: string[];
  notes?: string;
  status: "active" | "archived";
  totalSpent: number;
  bookingsCount: number;
  createdAt: string;
}

export default function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    vipCustomers: 0,
    corporateCustomers: 0,
    totalSpentSum: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [viewCustomer, setViewCustomer] = useState<{
    customer: CustomerItem;
    bookings: any[];
  } | null>(null);
  const [sharingCustomer, setSharingCustomer] = useState<{ name: string; phone: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    customerType: "individual",
    source: "website",
    tags: "",
    notes: "",
    status: "active",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/crm/customers/${editingCustomer._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setEditingCustomer(null);
          setShowAddModal(false);
          resetForm();
          fetchCustomers();
        } else {
          alert(data.error || "Failed to update customer");
        }
      } else {
        const res = await fetch("/api/crm/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchCustomers();
        } else {
          alert(data.error || "Failed to create customer");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer record?")) return;
    try {
      const res = await fetch(`/api/crm/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setViewCustomer(data.data);
      }
    } catch (err) {
      console.error("Error viewing customer:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      customerType: "individual",
      source: "website",
      tags: "",
      notes: "",
      status: "active",
    });
  };

  const openEditModal = (c: CustomerItem) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      whatsapp: c.whatsapp || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "India",
      customerType: c.customerType || "individual",
      source: c.source || "website",
      tags: c.tags ? c.tags.join(", ") : "",
      notes: c.notes || "",
      status: c.status || "active",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage client profiles, booking history, lifetime travel value, and custom CRM segmentation.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add New Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Active Clients</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalCustomers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">VIP Clients</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.vipCustomers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Corporate Accounts</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{summary.corporateCustomers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Lifetime Value</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalSpentSum)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone, city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
            <option value="family">Family</option>
            <option value="vip">VIP</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table of Customers */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Customer Records from MongoDB Atlas...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <UserCheck className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No customers found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your first customer or convert an existing inquiry from the Leads Pipeline.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">Bookings</th>
                <th className="p-3.5">Total Spent</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[10px] text-slate-500">Joined {formatDate(c.createdAt)}</p>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div>{c.email}</div>
                    <div className="text-slate-500 text-[11px]">{c.phone}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    {c.city ? `${c.city}, ${c.state || c.country || ""}` : c.country || "India"}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase border ${
                        c.customerType === "vip"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : c.customerType === "corporate"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {c.customerType}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {c.tags && c.tags.length > 0 ? (
                        c.tags.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-blue-600">{c.bookingsCount || 0}</td>
                  <td className="p-3.5 font-semibold text-emerald-600">
                    {formatCurrency(c.totalSpent || 0)}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleViewCustomer(c._id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Profile & Bookings"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSharingCustomer({ name: c.name, phone: c.phone || c.whatsapp || "" })}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Share Tour Brochure on WhatsApp"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit Customer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Customer"
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

      {/* Customer Detail Drawer / Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewCustomer.customer.name}</h2>
                <p className="text-xs text-slate-500">Customer ID: {viewCustomer.customer._id}</p>
              </div>
              <button onClick={() => setViewCustomer(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500">Email</span>
                  <p className="text-slate-900 font-medium mt-0.5">{viewCustomer.customer.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Phone</span>
                  <p className="text-slate-900 font-medium mt-0.5">{viewCustomer.customer.phone}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type</span>
                  <p className="text-blue-600 font-bold uppercase mt-0.5">
                    {viewCustomer.customer.customerType}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Lifetime Spent</span>
                  <p className="text-emerald-600 font-bold mt-0.5">
                    {formatCurrency(viewCustomer.customer.totalSpent || 0)}
                  </p>
                </div>
              </div>

              {viewCustomer.customer.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-semibold block mb-1">CRM Notes:</span>
                  <p className="text-slate-600">{viewCustomer.customer.notes}</p>
                </div>
              )}

              {/* Bookings associated */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Booking History ({viewCustomer.bookings.length})
                </h3>

                {viewCustomer.bookings.length === 0 ? (
                  <p className="text-slate-500 p-4 text-center rounded-xl bg-slate-50 border border-slate-200">
                    No bookings created for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {viewCustomer.bookings.map((b: any) => (
                      <div
                        key={b._id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{b.packageName}</p>
                          <p className="text-[10px] text-slate-500">Ref: {b.bookingRef}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{formatCurrency(b.totalAmount)}</p>
                          <span className="text-[10px] uppercase font-semibold text-blue-600">
                            {b.bookingStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewCustomer(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCustomer ? "Edit Customer Record" : "Add New Customer"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Vikram Malhotra"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. vikram@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. +91 9811223344"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Category</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                    <option value="family">Family</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="website">Website</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Delhi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. Trekking, Luxury, Kashmir, Frequent Flyer"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special preferences or notes..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
                >
                  {editingCustomer ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Direct WhatsApp Share Modal */}
      {sharingCustomer && (
        <DirectShareBrochureModal
          isOpen={Boolean(sharingCustomer)}
          onClose={() => setSharingCustomer(null)}
          recipientName={sharingCustomer.name}
          recipientPhone={sharingCustomer.phone}
          sourceType="customer"
        />
      )}
    </div>
  );
}

