"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  Share2,
  Edit2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    _id: string;
    displayName: string;
    fileUrl: string;
    version: number;
    category: string;
    fileSize: number;
    originalFileName: string;
  } | null;
  packageId: string;
  packageName: string;
  onEditClick?: () => void;
  onShareClick?: () => void;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  document,
  packageId,
  packageName,
  onEditClick,
  onShareClick,
}: PdfPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !document) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicViewUrl = document.fileUrl.startsWith("http")
    ? document.fileUrl
    : `${appUrl}/api/public/documents/${document._id}/view`;

  const publicDownloadUrl = `${appUrl}/api/public/documents/${document._id}/download`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const handlePrint = () => {
    const printWindow = window.open(publicViewUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      <div
        className={`w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen ? "h-screen w-screen rounded-none border-none" : "max-w-5xl h-[92vh]"
        }`}
      >
        {/* Top Control Header */}
        <div className="p-3 md:px-5 md:py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <span className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs md:max-w-md">
                  {document.displayName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  v{document.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {packageName} • {(document.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {/* Viewer Tools (Zoom, Print, Download, Share, Edit) */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 py-0.5 shadow-2xs">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 text-xs font-semibold text-slate-700 hover:text-blue-600"
                title="Reset to 100%"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition"
              title="Print PDF"
            >
              <Printer className="h-4 w-4" />
            </button>

            <a
              href={publicDownloadUrl}
              download={`${document.displayName}.pdf`}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </a>

            {onShareClick && (
              <button
                onClick={onShareClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                title="Share on WhatsApp"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            {onEditClick && (
              <button
                onClick={onEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                title="Edit in PDF Studio"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit PDF</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Rendering Stage */}
        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-2 md:p-6">
          <div
            className="w-full h-full bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-150 flex flex-col"
            style={{
              maxWidth: zoom === 100 ? "100%" : `${zoom}%`,
              transformOrigin: "top center",
            }}
          >
            {/* Embedded Native High-Fidelity PDF Engine */}
            <object
              data={`${publicViewUrl}#view=FitH&toolbar=0&navpanes=0`}
              type="application/pdf"
              className="w-full h-full flex-1 border-none rounded-xl"
            >
              <div className="p-12 text-center space-y-4">
                <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  PDF Preview is ready for viewing
                </p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={publicViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={publicDownloadUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            </object>
          </div>
        </div>
      </div>
    </div>
  );
}

