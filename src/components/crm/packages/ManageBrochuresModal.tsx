"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Eye,
  Edit2,
  Share2,
  History,
  Download,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import PdfPreviewModal from "./PdfPreviewModal";
import PdfEditorModal from "./PdfEditorModal";
import PdfVersionHistoryModal from "./PdfVersionHistoryModal";
import WhatsAppShareModal from "./WhatsAppShareModal";
import BrochureGeneratorModal from "./BrochureGeneratorModal";

interface DocumentItem {
  _id: string;
  packageId: string;
  displayName: string;
  originalFileName: string;
  description?: string;
  category: string;
  storageProvider: string;
  storageKey: string;
  fileUrl: string;
  fileSize: number;
  version: number;
  isPrimary: boolean;
  isActive: boolean;
  uploadedBy?: { name: string; email: string };
  uploadedAt: string;
  versions?: any[];
  activityLogs?: any[];
}

interface ManageBrochuresModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageItem: {
    _id: string;
    name: string;
    code: string;
    destination: string;
    durationDays: number;
    durationNights: number;
    sellingPrice: number;
  } | null;
  onRefreshPackages?: () => void;
}

export default function ManageBrochuresModal({
  isOpen,
  onClose,
  packageItem,
  onRefreshPackages,
}: ManageBrochuresModalProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-modals
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [historyDoc, setHistoryDoc] = useState<DocumentItem | null>(null);
  const [sharingDoc, setSharingDoc] = useState<DocumentItem | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("main_brochure");
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    if (!packageItem) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/crm/packages/${packageItem._id}/documents`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        setError(data.error || "Failed to load package brochures");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch brochures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && packageItem) {
      fetchDocuments();
    }
  }, [isOpen, packageItem]);

  if (!isOpen || !packageItem) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    setUploadFile(file);
    if (!displayName) {
      setDisplayName(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a PDF file to upload");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("displayName", displayName || uploadFile.name.replace(/\.pdf$/i, ""));
      formData.append("description", description);
      formData.append("category", category);
      formData.append("isPrimary", String(isPrimary));

      const res = await fetch(`/api/crm/packages/${packageItem._id}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to upload brochure");
      }

      setUploadFile(null);
      setDisplayName("");
      setDescription("");
      setShowUploadForm(false);
      await fetchDocuments();
      if (onRefreshPackages) onRefreshPackages();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (docId: string) => {
    try {
      const res = await fetch(`/api/crm/packages/${packageItem._id}/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDocuments();
        if (onRefreshPackages) onRefreshPackages();
      }
    } catch (err) {
      console.error("Failed to set primary document:", err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this PDF brochure?")) return;
    try {
      const res = await fetch(`/api/crm/packages/${packageItem._id}/documents/${docId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchDocuments();
        if (onRefreshPackages) onRefreshPackages();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "main_brochure":
        return "Main Brochure";
      case "detailed_itinerary":
        return "Detailed Itinerary";
      case "hotel_details":
        return "Hotel Details";
      case "pricing_inclusions":
        return "Pricing & Inclusions";
      case "terms_conditions":
        return "Terms & Conditions";
      default:
        return "Other Document";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  {packageItem.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 truncate max-w-md">
                  {packageItem.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Package PDF Brochures, Itineraries & Document Management Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold shadow-2xs transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Generate from Itinerary</span>
            </button>

            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{showUploadForm ? "Hide Upload" : "Upload PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Form Box */}
          {showUploadForm && (
            <form
              onSubmit={handleUploadSubmit}
              className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3.5 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Upload New Package Brochure
                </h4>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select PDF File (Max 25MB) *
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    required
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Manali Shimla Official Holiday Brochure"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="main_brochure">Main Brochure</option>
                    <option value="detailed_itinerary">Detailed Itinerary</option>
                    <option value="hotel_details">Hotel Details</option>
                    <option value="pricing_inclusions">Pricing & Inclusions</option>
                    <option value="terms_conditions">Terms & Conditions</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Includes luxury resort stays and AC taxi"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Mark as Primary Brochure for this Package</span>
                </label>

                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploading ? "Uploading & Storing..." : "Upload & Save Brochure"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Brochures List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span>Loading package documents from storage...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No PDF Brochures Uploaded Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your agency&apos;s itinerary brochures or generate one instantly using the package itinerary generator.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  Upload PDF Brochure
                </button>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition"
                >
                  Generate from Itinerary
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    doc.isPrimary
                      ? "border-blue-300 bg-blue-50/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                        <FileText className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{doc.displayName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                        v{doc.version}
                      </span>
                      {doc.isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Primary
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {getCategoryLabel(doc.category)}
                      </span>
                    </div>

                    {doc.description && (
                      <p className="text-xs text-slate-500 pl-8">{doc.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-8">
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>By {doc.uploadedBy?.name || "Team"}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                      title="Preview PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setEditingDoc(doc)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                      title="Edit in PDF Studio"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setSharingDoc(doc)}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setHistoryDoc(doc)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Version History & Audit Log"
                    >
                      <History className="h-4 w-4" />
                    </button>

                    <a
                      href={`/api/public/documents/${doc._id}/download`}
                      download={`${doc.displayName}.pdf`}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>

                    {!doc.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(doc._id)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Set as Primary Brochure"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Remove Brochure"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-medium">
            Total Brochures: {documents.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub Modals */}
      {previewDoc && (
        <PdfPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          packageId={packageItem._id}
          packageName={packageItem.name}
          onEditClick={() => {
            setEditingDoc(previewDoc);
            setPreviewDoc(null);
          }}
          onShareClick={() => {
            setSharingDoc(previewDoc);
            setPreviewDoc(null);
          }}
        />
      )}

      {editingDoc && (
        <PdfEditorModal
          isOpen={Boolean(editingDoc)}
          onClose={() => setEditingDoc(null)}
          document={editingDoc}
          packageId={packageItem._id}
          packageName={packageItem.name}
          onSaved={() => {
            fetchDocuments();
            if (onRefreshPackages) onRefreshPackages();
          }}
        />
      )}

      {historyDoc && (
        <PdfVersionHistoryModal
          isOpen={Boolean(historyDoc)}
          onClose={() => setHistoryDoc(null)}
          document={historyDoc}
          packageId={packageItem._id}
          packageName={packageItem.name}
          onVersionRestored={() => {
            fetchDocuments();
            if (onRefreshPackages) onRefreshPackages();
          }}
        />
      )}

      {sharingDoc && (
        <WhatsAppShareModal
          isOpen={Boolean(sharingDoc)}
          onClose={() => setSharingDoc(null)}
          packageId={packageItem._id}
          packageName={packageItem.name}
          packageDestination={packageItem.destination}
          initialBrochure={sharingDoc}
          brochures={documents}
        />
      )}

      {showGenerator && (
        <BrochureGeneratorModal
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          packageId={packageItem._id}
          packageName={packageItem.name}
          packageCode={packageItem.code}
          destination={packageItem.destination}
          durationDays={packageItem.durationDays}
          durationNights={packageItem.durationNights}
          sellingPrice={packageItem.sellingPrice}
          onGenerated={() => {
            fetchDocuments();
            if (onRefreshPackages) onRefreshPackages();
          }}
        />
      )}
    </div>
  );
}

