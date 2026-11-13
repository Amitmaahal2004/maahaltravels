"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  FileText,
  User,
  Phone,
  MessageSquare,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface CustomerOption {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  type: "customer" | "lead";
}

interface BrochureOption {
  _id: string;
  displayName: string;
  originalFileName: string;
  fileUrl: string;
  version: number;
  category: string;
  isPrimary: boolean;
}

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  packageDestination: string;
  initialBrochure?: BrochureOption | null;
  brochures?: BrochureOption[];
  preselectedCustomer?: { name: string; phone: string } | null;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  packageId,
  packageName,
  packageDestination,
  initialBrochure,
  brochures = [],
  preselectedCustomer,
}: WhatsAppShareModalProps) {
  const [selectedBrochureId, setSelectedBrochureId] = useState<string>("");
  const [customerName, setCustomerName] = useState(preselectedCustomer?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(preselectedCustomer?.phone || "");
  const [customMessage, setCustomMessage] = useState("");
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize selected brochure
  useEffect(() => {
    if (initialBrochure) {
      setSelectedBrochureId(initialBrochure._id);
    } else if (brochures.length > 0) {
      const primary = brochures.find((b) => b.isPrimary) || brochures[0];
      setSelectedBrochureId(primary._id);
    }
  }, [initialBrochure, brochures]);

  // Load existing customers and leads for quick selection
  useEffect(() => {
    if (!isOpen) return;
    const fetchCustomersAndLeads = async () => {
      try {
        setLoadingCustomers(true);
        const [custRes, leadRes] = await Promise.all([
          fetch("/api/crm/customers?limit=30").then((r) => r.json()).catch(() => ({ success: false })),
          fetch("/api/crm/leads?limit=30").then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        const list: CustomerOption[] = [];
        if (custRes.success && Array.isArray(custRes.data)) {
          for (const c of custRes.data) {
            if (c.phone) {
              list.push({ _id: c._id, name: c.name, phone: c.phone, email: c.email, type: "customer" });
            }
          }
        }
        if (leadRes.success && Array.isArray(leadRes.data)) {
          for (const l of leadRes.data) {
            if (l.phone && !list.some((existing) => existing.phone === l.phone)) {
              list.push({ _id: l._id, name: l.name, phone: l.phone, email: l.email, type: "lead" });
            }
          }
        }
        setCustomersList(list);
      } catch (err) {
        console.error("Failed to load customer list:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomersAndLeads();
  }, [isOpen]);

  // Construct dynamic message whenever inputs change
  const currentBrochure = brochures.find((b) => b._id === selectedBrochureId) || initialBrochure;

  useEffect(() => {
    if (!currentBrochure) return;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = currentBrochure.fileUrl.startsWith("http")
      ? currentBrochure.fileUrl
      : `${appUrl}/api/public/documents/${currentBrochure._id}/view`;

    const name = customerName.trim() || "Valued Traveler";
    const msg = [
      `Hello ${name}! 👋`,
      ``,
      `Thank you for your interest in our *${packageName}* (${packageDestination})!`,
      ``,
      `Please find our official holiday brochure and day-by-day itinerary attached below:`,
      `📄 *${currentBrochure.displayName}* (v${currentBrochure.version})`,
      `🔗 ${publicUrl}`,
      ``,
      `The brochure includes detailed day-wise plans, hotel inclusions, sightseeing highlights and pricing.`,
      ``,
      `Please feel free to reply here if you'd like custom dates or personalized changes.`,
      ``,
      `Best Regards,`,
      `*Explore My Packages*`,
      `Travel OS Enterprise`,
    ].join("\n");

    setCustomMessage(msg);
  }, [customerName, selectedBrochureId, packageName, packageDestination, currentBrochure]);

  if (!isOpen) return null;

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = customersList.find((c) => c._id === val);
    if (found) {
      setCustomerName(found.name);
      setPhoneNumber(found.phone);
    }
  };

  const handleCopyLink = () => {
    if (!currentBrochure) return;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = currentBrochure.fileUrl.startsWith("http")
      ? currentBrochure.fileUrl
      : `${appUrl}/api/public/documents/${currentBrochure._id}/view`;

    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = async (sendViaCloud = false) => {
    if (!currentBrochure) {
      setStatusMessage({ type: "error", text: "Please select a PDF brochure to share" });
      return;
    }

    try {
      setSharing(true);
      setStatusMessage(null);

      // Call backend to log activity and track metrics
      const res = await fetch(`/api/crm/packages/${packageId}/documents/${currentBrochure._id}/share-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phoneNumber,
          customMessage,
          sendViaCloudApi: sendViaCloud,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process share request");
      }

      if (sendViaCloud && data.data?.cloudApiSuccess) {
        setStatusMessage({
          type: "success",
          text: `Document successfully dispatched to ${phoneNumber} via WhatsApp Business Cloud API!`,
        });
      } else {
        // Open standard WhatsApp Web / mobile chat
        if (data.data?.shareUrl) {
          window.open(data.data.shareUrl, "_blank", "noopener,noreferrer");
          setStatusMessage({
            type: "success",
            text: "WhatsApp chat opened with pre-filled message and direct brochure link!",
          });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Sharing error" });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Share2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Share Brochure on WhatsApp</h2>
              <p className="text-xs text-slate-500">{packageName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Brochure Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Select PDF Brochure
            </label>
            {brochures.length > 0 ? (
              <select
                value={selectedBrochureId}
                onChange={(e) => setSelectedBrochureId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                {brochures.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.displayName} (v{b.version}) {b.isPrimary ? "★ Primary" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No brochures uploaded yet for this package. Please upload or generate a PDF first.
              </div>
            )}
          </div>

          {/* Quick Select from CRM */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                Select Existing Customer or Lead (Optional)
              </span>
              {loadingCustomers && <span className="text-[10px] text-slate-400">Loading contacts...</span>}
            </label>
            <select
              onChange={handleSelectCustomer}
              defaultValue=""
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            >
              <option value="">-- Choose from Contacts Directory --</option>
              {customersList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone}) • {c.type === "customer" ? "Active Client" : "Lead"}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 9876543210 or 919876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Editable WhatsApp Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp Message Preview & Editor
              </label>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedLink ? "Link Copied!" : "Copy PDF Link"}
              </button>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:bg-white focus:border-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShareWhatsApp(true)}
              disabled={sharing || !currentBrochure}
              title="Dispatches direct document attachment if WhatsApp Cloud API credentials are set"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Cloud API Direct</span>
            </button>

            <button
              onClick={() => handleShareWhatsApp(false)}
              disabled={sharing || !currentBrochure}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{sharing ? "Processing..." : "Open WhatsApp Chat"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

