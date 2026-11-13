"use client";

import React, { useState } from "react";
import {
  X,
  History,
  Download,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  Activity,
  FileText,
  AlertCircle,
} from "lucide-react";

interface VersionItem {
  versionNumber: number;
  storageKey: string;
  storageProvider: string;
  fileUrl: string;
  fileSize: number;
  changeDescription: string;
  modifiedBy: {
    id?: string;
    name: string;
    email: string;
  };
  modifiedAt: string;
}

interface ActivityItem {
  action: string;
  performedBy: {
    id?: string;
    name: string;
    email?: string;
  };
  details?: string;
  timestamp: string;
}

interface PdfVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    _id: string;
    displayName: string;
    version: number;
    versions?: VersionItem[];
    activityLogs?: ActivityItem[];
  } | null;
  packageId: string;
  packageName: string;
  onVersionRestored: (updatedDoc: any) => void;
}

export default function PdfVersionHistoryModal({
  isOpen,
  onClose,
  document,
  packageId,
  packageName,
  onVersionRestored,
}: PdfVersionHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"versions" | "audit">("versions");
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const versions = document.versions || [];
  const activityLogs = document.activityLogs || [];

  const handleRestore = async (versionNum: number) => {
    if (!confirm(`Are you sure you want to restore Version ${versionNum} as the latest active brochure?`)) {
      return;
    }

    try {
      setRestoringVersion(versionNum);
      setError(null);

      const res = await fetch(`/api/crm/packages/${packageId}/documents/${document._id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion: versionNum }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to restore version");
      }

      onVersionRestored(data.data);
      alert(`Version ${versionNum} successfully restored as Version ${data.data.version}!`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to restore");
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <History className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{document.displayName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Current: v{document.version}
                </span>
              </div>
              <p className="text-xs text-slate-500">{packageName} • Version Management & Audit Trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab("versions")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "versions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Document Versions ({versions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Activity Log ({activityLogs.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "versions" ? (
            <div className="space-y-3">
              {versions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No version history recorded yet.
                </div>
              ) : (
                versions
                  .slice()
                  .reverse()
                  .map((v) => {
                    const isCurrent = v.versionNumber === document.version;
                    return (
                      <div
                        key={v.versionNumber}
                        className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isCurrent
                            ? "border-blue-200 bg-blue-50/40 ring-1 ring-blue-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCurrent
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              Version {v.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Current Active
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {(v.fileSize / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900">{v.changeDescription}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              {v.modifiedBy?.name || "System"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(v.modifiedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <a
                            href={v.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                            title="Preview Version"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={v.fileUrl}
                            download={`${document.displayName}-v${v.versionNumber}.pdf`}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                            title="Download Version"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {!isCurrent && (
                            <button
                              onClick={() => handleRestore(v.versionNumber)}
                              disabled={restoringVersion !== null}
                              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition flex items-center gap-1"
                              title="Restore this version as active"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>{restoringVersion === v.versionNumber ? "Restoring..." : "Restore"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No activity logged yet.
                </div>
              ) : (
                activityLogs
                  .slice()
                  .reverse()
                  .map((act, idx) => {
                    const badgeColor =
                      act.action === "upload"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : act.action === "edit" || act.action === "new_version"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : act.action === "share"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : act.action === "restore"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${badgeColor}`}>
                              {act.action.replace("_", " ")}
                            </span>
                            <span className="font-semibold text-slate-800">{act.details}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <User className="h-3 w-3 text-slate-400" />
                            {act.performedBy?.name || "User"}
                            <span>•</span>
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

