"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Mountain,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PackageItem {
  _id: string;
  name: string;
  code: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  startingPrice: number;
  sellingPrice: number;
  internalCost: number;
  category: string;
  difficulty: "easy" | "moderate" | "challenging" | "demanding";
  shortDescription: string;
  inclusions: string[];
  exclusions: string[];
  status: "published" | "draft" | "archived";
  isFeatured: boolean;
}

export default function PackagesClient() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [summary, setSummary] = useState({
    totalPackages: 0,
    publishedCount: 0,
    draftCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    durationDays: 5,
    durationNights: 4,
    startingPrice: 25000,
    sellingPrice: 32000,
    internalCost: 20000,
    category: "Himalayan Treks",
    difficulty: "moderate",
    shortDescription: "",
    inclusions: "Hotel Accommodation, Daily Breakfast & Dinner, AC Transport, Permits",
    exclusions: "Flights, Personal Expenses, Travel Insurance",
    status: "published",
    isFeatured: true,
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/packages?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [search, categoryFilter, statusFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPkg) {
        const res = await fetch(`/api/crm/packages/${editingPkg._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setEditingPkg(null);
          resetForm();
          fetchPackages();
        } else {
          alert(data.error || "Failed to update package");
        }
      } else {
        const res = await fetch("/api/crm/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchPackages();
        } else {
          alert(data.error || "Failed to create package");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving package");
    }
  };

  const handleToggleStatus = async (pkg: PackageItem) => {
    const nextStatus = pkg.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/crm/packages/${pkg._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) fetchPackages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tour package?")) return;
    try {
      const res = await fetch(`/api/crm/packages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchPackages();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      destination: "",
      durationDays: 5,
      durationNights: 4,
      startingPrice: 25000,
      sellingPrice: 32000,
      internalCost: 20000,
      category: "Himalayan Treks",
      difficulty: "moderate",
      shortDescription: "",
      inclusions: "Hotel Accommodation, Daily Breakfast & Dinner, AC Transport, Permits",
      exclusions: "Flights, Personal Expenses, Travel Insurance",
      status: "published",
      isFeatured: true,
    });
  };

  const openEdit = (pkg: PackageItem) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name,
      destination: pkg.destination,
      durationDays: pkg.durationDays,
      durationNights: pkg.durationNights,
      startingPrice: pkg.startingPrice,
      sellingPrice: pkg.sellingPrice,
      internalCost: pkg.internalCost,
      category: pkg.category,
      difficulty: pkg.difficulty,
      shortDescription: pkg.shortDescription || "",
      inclusions: pkg.inclusions ? pkg.inclusions.join(", ") : "",
      exclusions: pkg.exclusions ? pkg.exclusions.join(", ") : "",
      status: pkg.status,
      isFeatured: pkg.isFeatured,
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
              <Package className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tour Packages Catalog</h1>
          </div>
          <p className="text-sm text-slate-400">
            Design, price, and publish Himalayan adventure itineraries and cultural holiday packages.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingPkg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Package
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Packages</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalPackages}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Published Live</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.publishedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">In Draft Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.draftCount}</p>
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
            placeholder="Search packages by name, code, or destination..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Categories</option>
            <option value="Himalayan Treks">Himalayan Treks</option>
            <option value="Cultural & Heritage">Cultural & Heritage</option>
            <option value="Honeymoon Special">Honeymoon Special</option>
            <option value="Road Trips & Expeditions">Road Trips & Expeditions</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid of Packages */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Packages from MongoDB Atlas...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Mountain className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No packages found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Create New Package&quot; to add your agency&apos;s signature travel itineraries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const margin = pkg.sellingPrice - pkg.internalCost;
            const marginPercent = Math.round((margin / pkg.sellingPrice) * 100);

            return (
              <div
                key={pkg._id}
                className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-400 border border-sky-800/80 uppercase">
                      {pkg.code}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(pkg)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase cursor-pointer transition ${pkg.status === "published"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                    >
                      {pkg.status}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">{pkg.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-sky-400" />
                      {pkg.destination}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{pkg.shortDescription}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-400">
                      {pkg.difficulty}
                    </span>
                  </div>

                  {/* Pricing info */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Selling Price</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(pkg.sellingPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Profit Margin</span>
                      <span className="text-xs font-semibold text-sky-400">
                        {formatCurrency(margin)} ({marginPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{pkg.category}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="p-1.5 text-sky-400 hover:bg-sky-950/50 rounded-lg transition"
                      title="Edit Package"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                      title="Delete Package"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingPkg ? "Edit Tour Package" : "Create Tour Package"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPkg(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. 6D5N Ladakh High Passes Expedition"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Leh-Ladakh"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Duration Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Duration Nights</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.durationNights}
                    onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Starting Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Internal Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.internalCost}
                    onChange={(e) => setFormData({ ...formData, internalCost: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Himalayan Treks">Himalayan Treks</option>
                    <option value="Cultural & Heritage">Cultural & Heritage</option>
                    <option value="Honeymoon Special">Honeymoon Special</option>
                    <option value="Road Trips & Expeditions">Road Trips & Expeditions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                    <option value="demanding">Demanding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Short Overview</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Catchy package summary..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Inclusions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Exclusions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
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
                  {editingPkg ? "Save Changes" : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
