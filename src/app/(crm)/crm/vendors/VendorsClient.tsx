"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  Edit2,
  Trash2,
  Tag,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface VendorItem {
  _id: string;
  name: string;
  type: "hotel" | "transport" | "guide" | "activity" | "restaurant" | "other";
  contactPerson: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  services: string[];
  balanceOwed: number;
  status: "active" | "inactive";
  notes?: string;
}

export default function VendorsClient() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [summary, setSummary] = useState({ totalVendors: 0, activeVendors: 0, totalOwed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "hotel",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    services: "Deluxe Rooms, Mountain View, Breakfast Buffet",
    balanceOwed: 0,
    status: "active",
    notes: "",
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const res = await fetch(`/api/crm/vendors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVendors(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, typeFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        const res = await fetch(`/api/crm/vendors/${editingVendor._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setEditingVendor(null);
          resetForm();
          fetchVendors();
        } else {
          alert(data.error || "Failed to update vendor");
        }
      } else {
        const res = await fetch("/api/crm/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchVendors();
        } else {
          alert(data.error || "Failed to add vendor");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving vendor");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor partner?")) return;
    try {
      const res = await fetch(`/api/crm/vendors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "hotel",
      contactPerson: "",
      phone: "",
      email: "",
      city: "",
      state: "",
      services: "Deluxe Rooms, Mountain View, Breakfast Buffet",
      balanceOwed: 0,
      status: "active",
      notes: "",
    });
  };

  const openEdit = (v: VendorItem) => {
    setEditingVendor(v);
    setFormData({
      name: v.name,
      type: v.type,
      contactPerson: v.contactPerson,
      phone: v.phone,
      email: v.email || "",
      city: v.city || "",
      state: v.state || "",
      services: v.services ? v.services.join(", ") : "",
      balanceOwed: v.balanceOwed || 0,
      status: v.status,
      notes: v.notes || "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Truck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Vendors & Supplier Directory</h1>
          </div>
          <p className="text-sm text-slate-400">
            Maintain contracts with hotels, transport fleet operators, local guides, and equipment suppliers.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingVendor(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Supplier Partner
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Suppliers Enlisted</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalVendors}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Active Supply Contracts</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.activeVendors}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Balance Owed to Vendors</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(summary.totalOwed)}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, contact person, or city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Supplier Categories</option>
          <option value="hotel">Hotels & Resorts</option>
          <option value="transport">Transport Operators</option>
          <option value="guide">Tour Guides</option>
          <option value="activity">Activities & Gear</option>
          <option value="restaurant">Restaurants & Dining</option>
        </select>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Suppliers from MongoDB Atlas...</span>
        </div>
      ) : vendors.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Truck className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No vendor partners found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Enlist hotel chains, tempo traveller fleet providers, and local mountaineering guides.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Phone & Email</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Balance Owed</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vendors.map((v) => (
                <tr key={v._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-white">{v.name}</p>
                    <p className="text-[10px] text-slate-400">{v.services?.join(", ")}</p>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-semibold">
                      {v.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-200">{v.contactPerson}</td>
                  <td className="p-3.5 text-slate-300">
                    <div>{v.phone}</div>
                    <div className="text-[10px] text-slate-400">{v.email || "-"}</div>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    {v.city ? `${v.city}, ${v.state || ""}` : "HQ"}
                  </td>
                  <td className="p-3.5 font-bold text-amber-400">{formatCurrency(v.balanceOwed)}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        v.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 text-sky-400 hover:bg-sky-950/50 rounded-lg transition"
                      title="Edit Vendor"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                      title="Delete Vendor"
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

      {/* Add / Edit Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingVendor ? "Edit Vendor Partner" : "Enlist New Vendor"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVendor(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Company / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Manali Heights Resort"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vendor Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="hotel">Hotels & Resorts</option>
                    <option value="transport">Transport Fleet</option>
                    <option value="guide">Tour Guides</option>
                    <option value="activity">Activities & Permits</option>
                    <option value="restaurant">Restaurants & Catering</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Rajesh Thakur"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="partner@..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">City / Hub</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Manali"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.balanceOwed}
                    onChange={(e) => setFormData({ ...formData, balanceOwed: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Partnership Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Services Provided (Comma separated)</label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="e.g. 4-Star Rooms, Buffet Dining, 24/7 Hot Water"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20"
                >
                  {editingVendor ? "Save Changes" : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
