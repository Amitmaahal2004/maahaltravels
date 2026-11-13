"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  Plus,
  Search,
  LayoutGrid,
  List,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  UserCheck,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Share2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import DirectShareBrochureModal from "@/components/crm/packages/DirectShareBrochureModal";

interface LeadItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  destination: string;
  travelDate?: string;
  travellersCount: number;
  budget?: number;
  leadSource: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "contacted" | "interested" | "quotation_sent" | "negotiation" | "converted" | "lost";
  notes?: string;
  createdAt: string;
}

export default function LeadsClient() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [summary, setSummary] = useState({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [sharingLead, setSharingLead] = useState<{ name: string; phone: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    destination: "",
    travelDate: "",
    travellersCount: 2,
    budget: "",
    leadSource: "website",
    priority: "medium",
    status: "new",
    notes: "",
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, priorityFilter]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        const res = await fetch(`/api/crm/leads/${editingLead._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setEditingLead(null);
          setShowAddModal(false);
          resetForm();
          fetchLeads();
        } else {
          alert(data.error || "Failed to update lead");
        }
      } else {
        const res = await fetch("/api/crm/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchLeads();
        } else {
          alert(data.error || "Failed to create lead");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving lead");
    }
  };

  const handleStageChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error("Error updating lead stage:", err);
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    if (!confirm("Are you sure you want to convert this lead to an active Customer?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Lead converted to customer successfully!");
        fetchLeads();
      } else {
        alert(data.error || "Failed to convert lead");
      }
    } catch (err) {
      console.error("Error converting lead:", err);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      } else {
        alert(data.error || "Failed to delete lead");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      destination: "",
      travelDate: "",
      travellersCount: 2,
      budget: "",
      leadSource: "website",
      priority: "medium",
      status: "new",
      notes: "",
    });
  };

  const openEditModal = (lead: LeadItem) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp || "",
      destination: lead.destination,
      travelDate: lead.travelDate ? lead.travelDate.split("T")[0] : "",
      travellersCount: lead.travellersCount || 2,
      budget: lead.budget ? String(lead.budget) : "",
      leadSource: lead.leadSource || "website",
      priority: lead.priority || "medium",
      status: lead.status || "new",
      notes: lead.notes || "",
    });
    setShowAddModal(true);
  };

  const stages = [
    { key: "new", label: "New Inquiry", color: "border-blue-200 bg-blue-50 text-blue-700" },
    { key: "contacted", label: "Contacted", color: "border-amber-200 bg-amber-50 text-amber-700" },
    { key: "interested", label: "Interested", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
    { key: "quotation_sent", label: "Quotation Sent", color: "border-purple-200 bg-purple-50 text-purple-700" },
    { key: "converted", label: "Converted", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { key: "lost", label: "Lost", color: "border-rose-200 bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Filter className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Sales Pipeline</h1>
          </div>
          <p className="text-sm text-slate-500">
            Track, nurture, and convert travel inquiries into confirmed bookings with real-time Atlas sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="h-4 w-4" />
              Table
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setEditingLead(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Leads</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalLeads}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">New Inquiries</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.newLeads}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Converted to Customers</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.convertedLeads}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Pipeline Conversion Rate</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{summary.conversionRate}%</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, phone, or destination..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="quotation_sent">Quotation Sent</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Leads Pipeline from MongoDB Atlas...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <Filter className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No leads found matching your criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search filters or click &quot;Add New Lead&quot; to register a new inquiry.
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            return (
              <div
                key={stage.key}
                className="flex flex-col rounded-2xl bg-slate-50 border border-slate-200 p-3 min-w-[250px] space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{lead.name}</p>
                          <span
                            className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase border ${
                              lead.priority === "urgent"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : lead.priority === "high"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSharingLead({ name: lead.name, phone: lead.phone || lead.whatsapp || "" })}
                            className="p-1 hover:text-emerald-600 text-slate-400 transition"
                            title="Share Brochure on WhatsApp"
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1 hover:text-blue-600 text-slate-400 transition"
                            title="Edit Lead"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="p-1 hover:text-rose-600 text-slate-400 transition"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                          <span className="truncate text-slate-800 font-medium">{lead.destination}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                        {lead.budget && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-indigo-600 shrink-0" />
                            <span>{formatCurrency(lead.budget)}</span>
                          </div>
                        )}
                      </div>

                      {/* Stage Mover Selector */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStageChange(lead._id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg text-[10px] py-1 px-1.5 text-slate-700 focus:outline-none"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="interested">Interested</option>
                          <option value="quotation_sent">Quote Sent</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>

                        {lead.status !== "converted" && (
                          <button
                            onClick={() => handleConvertToCustomer(lead._id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition"
                            title="Convert to Customer"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Lead Name</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Travelers</th>
                <th className="p-3.5">Budget</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-slate-900">
                    {lead.name}
                    <span className="block text-[10px] font-normal text-slate-500">
                      Added {formatDate(lead.createdAt)}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div>{lead.email}</div>
                    <div className="text-slate-500 text-[11px]">{lead.phone}</div>
                  </td>
                  <td className="p-3.5 text-blue-600 font-medium">{lead.destination}</td>
                  <td className="p-3.5 text-slate-700">{lead.travellersCount} Guests</td>
                  <td className="p-3.5 text-slate-700">{lead.budget ? formatCurrency(lead.budget) : "N/A"}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase border ${
                        lead.priority === "urgent"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : lead.priority === "high"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setSharingLead({ name: lead.name, phone: lead.phone || lead.whatsapp || "" })}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Share Brochure on WhatsApp"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    {lead.status !== "converted" && (
                      <button
                        onClick={() => handleConvertToCustomer(lead._id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Convert to Customer"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(lead)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Lead"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Lead"
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

      {/* Add / Edit Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingLead ? "Edit Travel Inquiry" : "Register New Lead"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLead(null);
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
                    placeholder="e.g. Rahul Sharma"
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
                    placeholder="e.g. rahul@example.com"
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
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Manali, Ladakh, Spiti"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Travel Date</label>
                  <input
                    type="date"
                    value={formData.travelDate}
                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Number of Travellers</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travellersCount}
                    onChange={(e) => setFormData({ ...formData, travellersCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Budget (INR)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="website">Website</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Referral</option>
                    <option value="walk-in">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes & Client Preferences</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Looking for 4-star hotels, vegetarian food preferred..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLead(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
                >
                  {editingLead ? "Save Changes" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Direct WhatsApp Share Modal */}
      {sharingLead && (
        <DirectShareBrochureModal
          isOpen={Boolean(sharingLead)}
          onClose={() => setSharingLead(null)}
          recipientName={sharingLead.name}
          recipientPhone={sharingLead.phone}
          sourceType="lead"
        />
      )}
    </div>
  );
}
