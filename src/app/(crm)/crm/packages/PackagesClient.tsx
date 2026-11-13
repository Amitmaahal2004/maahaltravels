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
  FileText,
  Share2,
  Upload,
  Layers,
  Star,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ManageBrochuresModal from "@/components/crm/packages/ManageBrochuresModal";
import WhatsAppShareModal from "@/components/crm/packages/WhatsAppShareModal";
import PdfPreviewModal from "@/components/crm/packages/PdfPreviewModal";
import PdfEditorModal from "@/components/crm/packages/PdfEditorModal";

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
  documentsCount?: number;
  primaryDocument?: any;
  documents?: any[];
}

export default function PackagesClient() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [summary, setSummary] = useState({
    totalPackages: 0,
    publishedCount: 0,
    draftCount: 0,
    packagesWithBrochuresCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brochureFilter, setBrochureFilter] = useState("all");
  const [docCategoryFilter, setDocCategoryFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);

  // Brochure Management Modals State
  const [manageBrochuresPkg, setManageBrochuresPkg] = useState<PackageItem | null>(null);
  const [whatsappShareData, setWhatsappShareData] = useState<{ pkg: PackageItem; doc?: any } | null>(null);
  const [previewDocData, setPreviewDocData] = useState<{ doc: any; pkg: PackageItem } | null>(null);
  const [editDocData, setEditDocData] = useState<{ doc: any; pkg: PackageItem } | null>(null);

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

  // Package PDF upload in Create/Edit Form
  const [packagePdfFile, setPackagePdfFile] = useState<File | null>(null);
  const [packagePdfDisplayName, setPackagePdfDisplayName] = useState("");
  const [packagePdfCategory, setPackagePdfCategory] = useState("main_brochure");
  const [packagePdfDescription, setPackagePdfDescription] = useState("");

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (brochureFilter !== "all") params.append("brochures", brochureFilter);
      if (docCategoryFilter !== "all") params.append("docCategory", docCategoryFilter);

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
  }, [search, categoryFilter, statusFilter, brochureFilter, docCategoryFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let savedPkgId = "";
      if (editingPkg) {
        const res = await fetch(`/api/crm/packages/${editingPkg._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          savedPkgId = data.data._id;
        } else {
          alert(data.error || "Failed to update package");
          return;
        }
      } else {
        const res = await fetch("/api/crm/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          savedPkgId = data.data._id;
        } else {
          alert(data.error || "Failed to create package");
          return;
        }
      }

      // If a PDF brochure was selected during creation/editing, upload it now
      if (packagePdfFile && savedPkgId) {
        const docFormData = new FormData();
        docFormData.append("file", packagePdfFile);
        docFormData.append("displayName", packagePdfDisplayName || packagePdfFile.name.replace(/\.pdf$/i, ""));
        docFormData.append("category", packagePdfCategory);
        docFormData.append("description", packagePdfDescription);
        docFormData.append("isPrimary", "true");

        await fetch(`/api/crm/packages/${savedPkgId}/documents`, {
          method: "POST",
          body: docFormData,
        });
      }

      setShowAddModal(false);
      setEditingPkg(null);
      resetForm();
      fetchPackages();
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
    setPackagePdfFile(null);
    setPackagePdfDisplayName("");
    setPackagePdfCategory("main_brochure");
    setPackagePdfDescription("");
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
    setPackagePdfFile(null);
    setPackagePdfDisplayName("");
    setPackagePdfCategory("main_brochure");
    setPackagePdfDescription("");
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tour Packages & PDF Brochures</h1>
          </div>
          <p className="text-sm text-slate-500">
            Curate adventure itineraries, design vector PDF brochures, edit documents, and share directly via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingPkg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Package
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Packages</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalPackages}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Published Live</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.publishedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">In Draft Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.draftCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">With Active Brochures</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.packagesWithBrochuresCount || 0}</p>
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
            placeholder="Search packages by name, code, or destination..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={brochureFilter}
            onChange={(e) => setBrochureFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Brochures Status</option>
            <option value="with">With PDF Brochures</option>
            <option value="without">Without Brochures</option>
          </select>

          <select
            value={docCategoryFilter}
            onChange={(e) => setDocCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Document Types</option>
            <option value="main_brochure">Main Brochure</option>
            <option value="detailed_itinerary">Detailed Itinerary</option>
            <option value="hotel_details">Hotel Details</option>
            <option value="pricing_inclusions">Pricing & Inclusions</option>
            <option value="terms_conditions">Terms & Conditions</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
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
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid of Packages */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Packages from MongoDB Atlas...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <Mountain className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No packages found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Create New Package&quot; to add your agency&apos;s signature travel itineraries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const margin = pkg.sellingPrice - pkg.internalCost;
            const marginPercent = Math.round((margin / pkg.sellingPrice) * 100);
            const docCount = pkg.documentsCount || 0;
            const primaryDoc = pkg.primaryDocument;

            return (
              <div
                key={pkg._id}
                className="rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {pkg.code}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(pkg)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase cursor-pointer transition border ${pkg.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      {pkg.status}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      {pkg.destination}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{pkg.shortDescription}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                      {pkg.difficulty}
                    </span>
                  </div>

                  {/* Pricing info */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Selling Price</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(pkg.sellingPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Profit Margin</span>
                      <span className="text-xs font-semibold text-blue-600">
                        {formatCurrency(margin)} ({marginPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* PDF Brochures Card Section */}
                  <div className="pt-2 border-t border-slate-100">
                    {docCount > 0 ? (
                      <div className="p-3 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-red-500" />
                            {docCount} PDF Brochure{docCount > 1 ? "s" : ""}
                          </span>
                          {primaryDoc && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              v{primaryDoc.version}
                            </span>
                          )}
                        </div>

                        {primaryDoc && (
                          <p className="text-xs font-medium text-slate-800 truncate" title={primaryDoc.displayName}>
                            {primaryDoc.displayName}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-1">
                            {primaryDoc && (
                              <>
                                <button
                                  onClick={() => setPreviewDocData({ doc: primaryDoc, pkg })}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                  title="Preview PDF"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditDocData({ doc: primaryDoc, pkg })}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                  title="Edit in PDF Studio"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setWhatsappShareData({ pkg, doc: primaryDoc })}
                                  className="p-1.5 text-emerald-600 hover:bg-white rounded-lg transition"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => setManageBrochuresPkg(pkg)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            Manage Hub &rarr;
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          No Brochure Yet
                        </span>
                        <button
                          onClick={() => setManageBrochuresPkg(pkg)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{pkg.category}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setManageBrochuresPkg(pkg)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Brochures & Documents Center"
                    >
                      <Layers className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(pkg)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Package"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* Add / Edit Package Modal with Dedicated PDF Section */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPkg ? "Edit Tour Package" : "Create Tour Package"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPkg(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. 6D5N Ladakh High Passes Expedition"
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
                    placeholder="e.g. Leh-Ladakh"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duration Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duration Nights</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.durationNights}
                    onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Starting Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internal Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.internalCost}
                    onChange={(e) => setFormData({ ...formData, internalCost: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="Himalayan Treks">Himalayan Treks</option>
                    <option value="Cultural & Heritage">Cultural & Heritage</option>
                    <option value="Honeymoon Special">Honeymoon Special</option>
                    <option value="Road Trips & Expeditions">Road Trips & Expeditions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                    <option value="demanding">Demanding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Short Overview</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Catchy package summary..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Inclusions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Exclusions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              {/* Dedicated Section: PACKAGE PDF BROCHURES */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Package PDF Brochure Attachment
                  </h4>
                  {editingPkg && (
                    <button
                      type="button"
                      onClick={() => setManageBrochuresPkg(editingPkg)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Open Brochure Hub &rarr;
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Upload PDF File (Optional)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPackagePdfFile(file);
                          if (!packagePdfDisplayName) {
                            setPackagePdfDisplayName(file.name.replace(/\.pdf$/i, ""));
                          }
                        }
                      }}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Brochure Display Name
                    </label>
                    <input
                      type="text"
                      value={packagePdfDisplayName}
                      onChange={(e) => setPackagePdfDisplayName(e.target.value)}
                      placeholder="e.g. Official Tour Brochure"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Document Category
                    </label>
                    <select
                      value={packagePdfCategory}
                      onChange={(e) => setPackagePdfCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                      <option value="main_brochure">Main Brochure</option>
                      <option value="detailed_itinerary">Detailed Itinerary</option>
                      <option value="hotel_details">Hotel Details</option>
                      <option value="pricing_inclusions">Pricing & Inclusions</option>
                      <option value="terms_conditions">Terms & Conditions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Brochure Description
                    </label>
                    <input
                      type="text"
                      value={packagePdfDescription}
                      onChange={(e) => setPackagePdfDescription(e.target.value)}
                      placeholder="Brief note about this document"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>
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
                  {editingPkg ? "Save Changes" : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Document Management Hub Modal */}
      {manageBrochuresPkg && (
        <ManageBrochuresModal
          isOpen={Boolean(manageBrochuresPkg)}
          onClose={() => setManageBrochuresPkg(null)}
          packageItem={manageBrochuresPkg}
          onRefreshPackages={fetchPackages}
        />
      )}

      {/* WhatsApp Share Dialog */}
      {whatsappShareData && (
        <WhatsAppShareModal
          isOpen={Boolean(whatsappShareData)}
          onClose={() => setWhatsappShareData(null)}
          packageId={whatsappShareData.pkg._id}
          packageName={whatsappShareData.pkg.name}
          packageDestination={whatsappShareData.pkg.destination}
          initialBrochure={whatsappShareData.doc}
          brochures={whatsappShareData.pkg.documents || []}
        />
      )}

      {/* PDF Preview Modal */}
      {previewDocData && (
        <PdfPreviewModal
          isOpen={Boolean(previewDocData)}
          onClose={() => setPreviewDocData(null)}
          document={previewDocData.doc}
          packageId={previewDocData.pkg._id}
          packageName={previewDocData.pkg.name}
          onEditClick={() => {
            setEditDocData(previewDocData);
            setPreviewDocData(null);
          }}
          onShareClick={() => {
            setWhatsappShareData({ pkg: previewDocData.pkg, doc: previewDocData.doc });
            setPreviewDocData(null);
          }}
        />
      )}

      {/* Advanced PDF Studio Modal */}
      {editDocData && (
        <PdfEditorModal
          isOpen={Boolean(editDocData)}
          onClose={() => setEditDocData(null)}
          document={editDocData.doc}
          packageId={editDocData.pkg._id}
          packageName={editDocData.pkg.name}
          onSaved={() => {
            fetchPackages();
          }}
        />
      )}
    </div>
  );
}
