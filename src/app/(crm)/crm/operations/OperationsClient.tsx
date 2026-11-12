"use client";

import React, { useState, useEffect } from "react";
import {
  PlaneTakeoff,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Car,
  User,
  Phone,
  Hotel,
  CheckSquare,
  Square,
  Trash2,
  Calendar,
  Sparkles,
  MapPin,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChecklistItem {
  task: string;
  completed: boolean;
  completedAt?: string;
}

interface HotelAllocation {
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomsCount: number;
}

interface TripOpItem {
  _id: string;
  operationId: string;
  bookingRef: string;
  customerName: string;
  packageName: string;
  departureDate: string;
  returnDate: string;
  travellersCount: number;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  guideName?: string;
  guidePhone?: string;
  hotelAllocations: HotelAllocation[];
  checklist: ChecklistItem[];
  status: "scheduled" | "on_tour" | "completed" | "delayed" | "cancelled";
  notes?: string;
}

export default function OperationsClient() {
  const [operations, setOperations] = useState<TripOpItem[]>([]);
  const [summary, setSummary] = useState({
    totalOperations: 0,
    onTourCount: 0,
    scheduledCount: 0,
    completedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    bookingRef: "",
    customerName: "",
    packageName: "",
    departureDate: "",
    returnDate: "",
    travellersCount: 2,
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    vehicleModel: "Innova Crysta",
    guideName: "",
    guidePhone: "",
    hotelName: "",
    hotelCity: "",
    notes: "",
  });

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/operations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOperations(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load operations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [search, statusFilter]);

  const handleToggleChecklist = async (opId: string, taskIndex: number) => {
    try {
      const res = await fetch(`/api/crm/operations/${opId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_checklist", taskIndex }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOperations();
      }
    } catch (err) {
      console.error("Error toggling checklist:", err);
    }
  };

  const handleStatusChange = async (opId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/operations/${opId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchOperations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchOperations();
      } else {
        alert(data.error || "Failed to create trip operation");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving operation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this operational manifest?")) return;
    try {
      const res = await fetch(`/api/crm/operations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchOperations();
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
              <PlaneTakeoff className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trip Operations & Dispatch</h1>
          </div>
          <p className="text-sm text-slate-400">
            Control vehicle fleet allocation, hotel vouchers, local tour guides, and operational checklists in real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Schedule Trip Operation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Active Operations</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalOperations}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Currently On Tour</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{summary.onTourCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Scheduled Ahead</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.scheduledCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Completed Tours</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.completedCount}</p>
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
            placeholder="Search by operation #, booking ref, guest name, vehicle, or driver..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Trip Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="on_tour">On Tour</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Operations Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Operations Manifest from MongoDB Atlas...</span>
        </div>
      ) : operations.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <PlaneTakeoff className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No active trip operations found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule an operation to assign drivers, hotels, and pre-departure checklists.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {operations.map((op) => (
            <div
              key={op._id}
              className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-lg border border-sky-800/80">
                    {op.operationId}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Ref: {op.bookingRef}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={op.status}
                    onChange={(e) => handleStatusChange(op._id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg text-[10px] py-1 px-2 text-slate-200 focus:outline-none uppercase font-bold"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="on_tour">On Tour</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => handleDelete(op._id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                    title="Delete Manifest"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{op.packageName}</h3>
                <p className="text-xs text-slate-400">
                  Guest: <span className="text-slate-200 font-semibold">{op.customerName}</span> ({op.travellersCount} Travelers)
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" />
                  {formatDate(op.departureDate)} &rarr; {formatDate(op.returnDate)}
                </p>
              </div>

              {/* Driver & Guide Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 text-indigo-400" />
                    Transport & Driver
                  </span>
                  <p className="text-white font-medium mt-1 truncate">{op.driverName || "Unassigned"}</p>
                  <p className="text-slate-400 text-[11px] truncate">
                    {op.vehicleNumber} ({op.vehicleModel})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                    Tour Guide
                  </span>
                  <p className="text-white font-medium mt-1 truncate">{op.guideName || "Local Support"}</p>
                  <p className="text-slate-400 text-[11px] truncate">{op.guidePhone || "HQ Emergency"}</p>
                </div>
              </div>

              {/* Hotel Allocation */}
              {op.hotelAllocations && op.hotelAllocations.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Hotel className="h-3.5 w-3.5 text-amber-400" />
                    Accommodations Allocated
                  </span>
                  {op.hotelAllocations.map((h, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>{h.hotelName} ({h.city})</span>
                      <span className="text-slate-400">{h.roomType} x {h.roomsCount}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Pre-Departure Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 block">
                  Operational Checklist ({op.checklist.filter((c) => c.completed).length} / {op.checklist.length})
                </span>
                <div className="space-y-1.5">
                  {op.checklist.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleChecklist(op._id, idx)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-left transition text-xs"
                    >
                      {item.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-600 shrink-0" />
                      )}
                      <span className={item.completed ? "line-through text-slate-500" : "text-slate-300"}>
                        {item.task}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Operation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Schedule New Trip Operation</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Booking Reference</label>
                  <input
                    type="text"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData({ ...formData, bookingRef: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. BK-2026-0001"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer / Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Meera Kapoor"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. 7D6N Spiti Valley Expedition"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Travelers Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travellersCount}
                    onChange={(e) => setFormData({ ...formData, travellersCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Ramesh Negi"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Driver Phone</label>
                  <input
                    type="tel"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="+91 98..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Registration #</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. HP 01 A 4589"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hotel Name</label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Grand View Resort"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hotel City</label>
                  <input
                    type="text"
                    value={formData.hotelCity}
                    onChange={(e) => setFormData({ ...formData, hotelCity: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Kaza / Manali"
                  />
                </div>
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
                  Schedule Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
