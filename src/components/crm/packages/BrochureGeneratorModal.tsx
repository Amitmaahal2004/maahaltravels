"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  FileText,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Palette,
  Layers,
} from "lucide-react";

interface BrochureGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  packageCode: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  sellingPrice: number;
  onGenerated: (doc: any) => void;
}

export default function BrochureGeneratorModal({
  isOpen,
  onClose,
  packageId,
  packageName,
  packageCode,
  destination,
  durationDays,
  durationNights,
  sellingPrice,
  onGenerated,
}: BrochureGeneratorModalProps) {
  const [templateTheme, setTemplateTheme] = useState<"modern_luxe" | "himalayan_adventure" | "classic_corporate">("modern_luxe");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactEmail, setContactEmail] = useState("travel@explorepackages.com");
  const [customNotes, setCustomNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);

      const res = await fetch(`/api/crm/packages/${packageId}/documents/generate-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateTheme,
          contactPhone,
          contactEmail,
          customNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate brochure");
      }

      onGenerated(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Generation error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Generate PDF Brochure</h2>
              <p className="text-xs text-slate-500">Auto-build official branded PDF from package data</p>
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Package Data Preview Pill */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {packageCode}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                ₹{sellingPrice?.toLocaleString("en-IN")}/-
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{packageName}</h4>
            <p className="text-xs text-slate-500">
              {destination} • {durationDays} Days / {durationNights} Nights • Itinerary & inclusions included
            </p>
          </div>

          {/* Template Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-blue-600" />
              Select Brochure Visual Template
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTemplateTheme("modern_luxe")}
                className={`p-3 rounded-2xl border text-left transition ${
                  templateTheme === "modern_luxe"
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="h-3 w-8 rounded-full bg-blue-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-900 block">Modern Luxe</span>
                <span className="text-[10px] text-slate-500 block">Executive Blue</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateTheme("himalayan_adventure")}
                className={`p-3 rounded-2xl border text-left transition ${
                  templateTheme === "himalayan_adventure"
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="h-3 w-8 rounded-full bg-emerald-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-900 block">Himalayan</span>
                <span className="text-[10px] text-slate-500 block">Alpine Emerald</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateTheme("classic_corporate")}
                className={`p-3 rounded-2xl border text-left transition ${
                  templateTheme === "classic_corporate"
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="h-3 w-8 rounded-full bg-indigo-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-900 block">Classic</span>
                <span className="text-[10px] text-slate-500 block">Corporate Slate</span>
              </button>
            </div>
          </div>

          {/* Agency Helpline Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                Helpline Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                Reservation Email
              </label>
              <input
                type="text"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Custom Booking Note / Highlight (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Special 10% discount for bookings confirmed before month end"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
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

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? "Building Vector PDF..." : "Generate Official PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

