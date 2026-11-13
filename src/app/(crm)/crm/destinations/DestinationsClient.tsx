"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Search,
  CloudSun,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Compass,
  Globe,
} from "lucide-react";

interface DestinationItem {
  _id: string;
  name: string;
  state: string;
  country: string;
  city?: string;
  description: string;
  bestTimeToVisit?: string;
  weather?: string;
  attractions: string[];
  status: "published" | "draft";
  isFeatured: boolean;
}

export default function DestinationsClient() {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [summary, setSummary] = useState({
    totalDestinations: 0,
    publishedCount: 0,
    featuredCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDest, setEditingDest] = useState<DestinationItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    state: "Himachal Pradesh",
    country: "India",
    city: "",
    description: "",
    bestTimeToVisit: "April to October",
    weather: "Alpine mountain climate, pleasant summers, snow in winter",
    attractions: "Solang Valley, Rohtang Pass, Old Manali, Hadimba Temple",
    status: "published",
    isFeatured: true,
  });

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (stateFilter !== "all") params.append("state", stateFilter);

      const res = await fetch(`/api/crm/destinations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDestinations(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load destinations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [search, stateFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDest) {
        const res = await fetch(`/api/crm/destinations/${editingDest._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setEditingDest(null);
          resetForm();
          fetchDestinations();
        } else {
          alert(data.error || "Failed to update destination");
        }
      } else {
        const res = await fetch("/api/crm/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchDestinations();
        } else {
          alert(data.error || "Failed to create destination");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving destination");
    }
  };

  const handleToggleStatus = async (dest: DestinationItem) => {
    const nextStatus = dest.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/crm/destinations/${dest._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) fetchDestinations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    try {
      const res = await fetch(`/api/crm/destinations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchDestinations();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      state: "Himachal Pradesh",
      country: "India",
      city: "",
      description: "",
      bestTimeToVisit: "April to October",
      weather: "Alpine mountain climate, pleasant summers, snow in winter",
      attractions: "Solang Valley, Rohtang Pass, Old Manali, Hadimba Temple",
      status: "published",
      isFeatured: true,
    });
  };

  const openEdit = (d: DestinationItem) => {
    setEditingDest(d);
    setFormData({
      name: d.name,
      state: d.state,
      country: d.country,
      city: d.city || "",
      description: d.description,
      bestTimeToVisit: d.bestTimeToVisit || "",
      weather: d.weather || "",
      attractions: d.attractions ? d.attractions.join(", ") : "",
      status: d.status,
      isFeatured: d.isFeatured,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MapPin className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Himalayan Destinations</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage geographical regions, best seasons, key local attractions, and travel weather guides.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingDest(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Destinations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalDestinations}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Published on Website</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.publishedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Featured Explorer Spots</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.featuredCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destination by name, state, or country..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
        >
          <option value="all">All States</option>
          <option value="Himachal Pradesh">Himachal Pradesh</option>
          <option value="Ladakh">Ladakh</option>
          <option value="Jammu & Kashmir">Jammu & Kashmir</option>
          <option value="Uttarakhand">Uttarakhand</option>
          <option value="Sikkim">Sikkim</option>
        </select>
      </div>

      {/* Destinations Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Destinations from MongoDB Atlas...</span>
        </div>
      ) : destinations.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <Globe className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No destinations found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add Destination&quot; to register Himalayan travel regions and states.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((d) => (
            <div
              key={d._id}
              className="rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">{d.state}, {d.country}</span>
                  <button
                    onClick={() => handleToggleStatus(d)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase transition border ${d.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {d.status}
                  </button>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">{d.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{d.description}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  {d.bestTimeToVisit && (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>Best Season: {d.bestTimeToVisit}</span>
                    </div>
                  )}
                  {d.weather && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <CloudSun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{d.weather}</span>
                    </div>
                  )}
                </div>

                {/* Attractions tags */}
                {d.attractions && d.attractions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">Top Attractions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {d.attractions.map((att, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {att}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {d.isFeatured ? "Featured Destination" : "Standard Destination"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(d)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Destination"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Destination"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Destination Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDest ? "Edit Destination" : "Add New Destination"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDest(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Manali"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Himachal Pradesh"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Best Season to Visit</label>
                  <input
                    type="text"
                    value={formData.bestTimeToVisit}
                    onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. May to October"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Weather Summary</label>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Crisp alpine air, cool nights"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide an overview of the region..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Key Attractions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.attractions}
                  onChange={(e) => setFormData({ ...formData, attractions: e.target.value })}
                  placeholder="e.g. Hadimba Temple, Solang Valley, Rohtang Pass"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
                >
                  {editingDest ? "Save Changes" : "Save Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

