"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  FileText,
  Package,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface DirectShareBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhone: string;
  sourceType?: "customer" | "lead" | "quotation";
  initialPackageId?: string;
}

export default function DirectShareBrochureModal({
  isOpen,
  onClose,
  recipientName,
  recipientPhone,
  sourceType = "customer",
  initialPackageId,
}: DirectShareBrochureModalProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackageId || "");
  const [selectedBrochureId, setSelectedBrochureId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load packages
  useEffect(() => {
    if (!isOpen) return;
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const res = await fetch("/api/crm/packages?limit=50");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPackages(data.data);
          if (initialPackageId) {
            setSelectedPackageId(initialPackageId);
          } else if (data.data.length > 0) {
            setSelectedPackageId(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load packages for sharing:", err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, [isOpen, initialPackageId]);

  const selectedPkg = packages.find((p) => p._id === selectedPackageId);
  const availableBrochures = selectedPkg?.documents || [];

  // Update selected brochure when package changes
  useEffect(() => {
    if (availableBrochures.length > 0) {
      const primary = availableBrochures.find((b: any) => b.isPrimary) || availableBrochures[0];
      setSelectedBrochureId(primary._id);
    } else {
      setSelectedBrochureId("");
    }
  }, [selectedPackageId, availableBrochures]);

  // Construct message preview
  const currentBrochure = availableBrochures.find((b: any) => b._id === selectedBrochureId);

  useEffect(() => {
    if (!selectedPkg || !currentBrochure) return;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = currentBrochure.fileUrl?.startsWith("http")
      ? currentBrochure.fileUrl
      : `${appUrl}/api/public/documents/${currentBrochure._id}/view`;

    const name = recipientName.trim() || "Valued Traveler";
    const msg = [
      `Hello ${name}! 👋`,
      ``,
      `Thank you for your inquiry with *Explore My Packages*!`,
      ``,
      `Here is our official brochure & detailed itinerary for *${selectedPkg.name}* (${selectedPkg.destination}):`,
      `📄 *${currentBrochure.displayName}* (v${currentBrochure.version})`,
      `🔗 ${publicUrl}`,
      ``,
      `This brochure includes day-by-day travel plans, hotel stays, inclusions and price details.`,
      ``,
      `Let us know if you would like custom adjustments or to confirm dates!`,
      ``,
      `Warm Regards,`,
      `*Explore My Packages*`,
      `Travel OS Enterprise`,
    ].join("\n");

    setCustomMessage(msg);
  }, [recipientName, selectedPkg, currentBrochure]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!currentBrochure) return;
    const appUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = currentBrochure.fileUrl?.startsWith("http")
      ? currentBrochure.fileUrl
      : `${appUrl}/api/public/documents/${currentBrochure._id}/view`;

    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShare = async (sendViaCloud = false) => {
    if (!currentBrochure || !selectedPkg) {
      setStatusMessage({ type: "error", text: "Please select a package and brochure first." });
      return;
    }

    try {
      setSharing(true);
      setStatusMessage(null);

      const res = await fetch(`/api/crm/packages/${selectedPkg._id}/documents/${currentBrochure._id}/share-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: recipientName,
          phoneNumber: recipientPhone,
          customMessage,
          sendViaCloudApi: sendViaCloud,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process share");
      }

      if (sendViaCloud && data.data?.cloudApiSuccess) {
        setStatusMessage({
          type: "success",
          text: `Document successfully dispatched to ${recipientPhone} via WhatsApp Business Cloud API!`,
        });
      } else if (data.data?.shareUrl) {
        window.open(data.data.shareUrl, "_blank", "noopener,noreferrer");
        setStatusMessage({
          type: "success",
          text: "WhatsApp chat opened with pre-filled brochure message!",
        });
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
              <h2 className="text-base font-bold text-slate-900">Share Tour Brochure on WhatsApp</h2>
              <p className="text-xs text-slate-500">
                To: {recipientName} {recipientPhone ? `(${recipientPhone})` : ""}
              </p>
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

          {/* Select Tour Package */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              Select Tour Package *
            </label>
            {loadingPackages ? (
              <div className="p-2 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Loading packages catalog...</span>
              </div>
            ) : (
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                {packages.map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>
                    [{pkg.code}] {pkg.name} ({pkg.destination}) • {pkg.durationDays}D/{pkg.durationNights}N
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Brochure from this package */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-red-500" />
              Select PDF Brochure Document *
            </label>
            {availableBrochures.length > 0 ? (
              <select
                value={selectedBrochureId}
                onChange={(e) => setSelectedBrochureId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              >
                {availableBrochures.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.displayName} (v{b.version}) {b.isPrimary ? "★ Primary" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No PDF brochures uploaded yet for this package. You can upload or generate one in Tour Packages.
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">WhatsApp Message</label>
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!currentBrochure}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium disabled:opacity-40"
              >
                {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedLink ? "Link Copied!" : "Copy PDF Link"}
              </button>
            </div>
            <textarea
              rows={7}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:bg-white focus:border-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare(true)}
              disabled={sharing || !currentBrochure}
              title="Dispatches direct document attachment if WhatsApp Cloud API credentials are set"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Cloud API</span>
            </button>

            <button
              onClick={() => handleShare(false)}
              disabled={sharing || !currentBrochure}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{sharing ? "Processing..." : "Open WhatsApp"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

