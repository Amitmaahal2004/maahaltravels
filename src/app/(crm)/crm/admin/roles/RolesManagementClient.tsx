"use client";

import React, { useState, useEffect } from "react";
import { RoleWithPermissions } from "@/types/rbac.types";
import { SYSTEM_MODULES, PERMISSION_ACTIONS, RecordScope } from "@/config/permissions.config";
import {
  DASHBOARD_WIDGETS,
  DASHBOARD_WIDGET_CATEGORIES,
  ALL_WIDGET_IDS,
  getDefaultWidgetsForRole,
} from "@/config/widgets.config";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  LayoutDashboard,
  Layers,
  DollarSign,
  TrendingUp,
  Users,
  Compass,
  CheckSquare,
  Check,
  X,
} from "lucide-react";

interface Props {
  initialRoles: RoleWithPermissions[];
  systemPermissions: Array<{
    id: string;
    module: string;
    action: string;
    scope: string;
  }>;
}

export default function RolesManagementClient({
  initialRoles,
  systemPermissions,
}: Props) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    initialRoles[0]?.id || ""
  );
  const [activeTab, setActiveTab] = useState<"modules" | "widgets">("modules");
  const [activeRolePermIds, setActiveRolePermIds] = useState<Set<string>>(new Set());
  const [activeRoleWidgets, setActiveRoleWidgets] = useState<Set<string>>(new Set());
  const [activeScope, setActiveScope] = useState<RecordScope>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Role Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleScope, setNewRoleScope] = useState<RecordScope>("assigned");
  const [newRoleWidgets, setNewRoleWidgets] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Sync state whenever selected role changes
  useEffect(() => {
    if (selectedRole) {
      const permIds = new Set(selectedRole.permissions.map((p) => p.id || ""));
      setActiveRolePermIds(permIds);
      setActiveScope(selectedRole.defaultRecordScope || "all");

      const roleWidgets = (selectedRole.dashboardWidgets && selectedRole.dashboardWidgets.length > 0)
        ? selectedRole.dashboardWidgets
        : getDefaultWidgetsForRole(selectedRole.slug);
      setActiveRoleWidgets(new Set(roleWidgets));

      setStatusMessage(null);
    }
  }, [selectedRoleId, roles, selectedRole]);

  // Lookup permission ID for given module and action
  const getPermissionId = (module: string, action: string) => {
    const found = systemPermissions.find(
      (p) => p.module === module && p.action === action
    );
    return found ? found.id : null;
  };

  const handleTogglePermission = (module: string, action: string) => {
    if (!selectedRole || selectedRole.slug === "super-admin") return;

    const permId = getPermissionId(module, action);
    if (!permId) return;

    const next = new Set(activeRolePermIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setActiveRolePermIds(next);
  };

  const handleToggleModuleRow = (module: string) => {
    if (!selectedRole || selectedRole.slug === "super-admin") return;

    const modulePermIds = systemPermissions
      .filter((p) => p.module === module)
      .map((p) => p.id);

    const allChecked = modulePermIds.every((id) => activeRolePermIds.has(id));
    const next = new Set(activeRolePermIds);

    if (allChecked) {
      modulePermIds.forEach((id) => next.delete(id));
    } else {
      modulePermIds.forEach((id) => next.add(id));
    }
    setActiveRolePermIds(next);
  };

  const handleToggleWidget = (widgetId: string) => {
    if (!selectedRole || selectedRole.slug === "super-admin") return;

    const next = new Set(activeRoleWidgets);
    if (next.has(widgetId)) {
      next.delete(widgetId);
    } else {
      next.add(widgetId);
    }
    setActiveRoleWidgets(next);
  };

  const handleToggleCategoryWidgets = (category: string, enable: boolean) => {
    if (!selectedRole || selectedRole.slug === "super-admin") return;

    const categoryWidgets = DASHBOARD_WIDGETS.filter((w) => w.category === category).map((w) => w.id);
    const next = new Set(activeRoleWidgets);

    categoryWidgets.forEach((id) => {
      if (enable) next.add(id);
      else next.delete(id);
    });
    setActiveRoleWidgets(next);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/crm/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultRecordScope: activeScope,
          permissionIds: Array.from(activeRolePermIds),
          dashboardWidgets: Array.from(activeRoleWidgets),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: "error", text: data.error || "Failed to update role permissions." });
        setIsSaving(false);
        return;
      }

      setStatusMessage({ type: "success", text: `Role "${selectedRole.name}" permissions and dashboard widgets saved.` });
      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? {
                ...r,
                defaultRecordScope: activeScope,
                dashboardWidgets: Array.from(activeRoleWidgets),
                permissions: Array.from(activeRolePermIds).map((id) => {
                  const match = systemPermissions.find((p) => p.id === id);
                  return match as any;
                }),
              }
            : r
        )
      );
      setIsSaving(false);
    } catch (_err) {
      setStatusMessage({ type: "error", text: "Network error saving role." });
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("/api/crm/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          slug: newRoleSlug,
          description: newRoleDesc,
          defaultRecordScope: newRoleScope,
          permissionIds: [],
          dashboardWidgets: Array.from(newRoleWidgets),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Could not create role.");
        setIsCreating(false);
        return;
      }

      const created = data.role;
      const formatted: RoleWithPermissions = {
        id: created._id,
        name: created.name,
        slug: created.slug,
        description: created.description,
        isSystem: false,
        defaultRecordScope: created.defaultRecordScope,
        dashboardWidgets: created.dashboardWidgets || Array.from(newRoleWidgets),
        permissions: [],
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoles((prev) => [...prev, formatted]);
      setSelectedRoleId(formatted.id);
      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleSlug("");
      setNewRoleDesc("");
      setNewRoleWidgets(new Set());
      setIsCreating(false);
    } catch (_err) {
      alert("Network error creating role.");
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete custom role "${roleName}"?`)) return;

    try {
      const res = await fetch(`/api/crm/roles/${roleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Could not delete role.");
        return;
      }

      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      if (selectedRoleId === roleId) {
        setSelectedRoleId(roles[0]?.id || "");
      }
    } catch (_err) {
      alert("Network error deleting role.");
    }
  };

  const isSuper = selectedRole?.slug === "super-admin";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            Roles & Access Governance Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin-controlled RBAC: module actions, record scoping, and granular dashboard widget permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setNewRoleWidgets(new Set(["total_leads", "bookings_overview", "upcoming_tasks", "recent_activities"]));
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Custom Role
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Layout: Roles List on left, Permission Matrix on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles Selector Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Agency Roles ({roles.length})
            </div>
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              const widgetCount = r.dashboardWidgets?.length ?? getDefaultWidgetsForRole(r.slug).length;

              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition flex flex-col gap-1.5 border ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-200 text-blue-900 font-medium shadow-xs"
                      : "hover:bg-slate-50 border-transparent text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{r.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        r.isSystem
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {r.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{r.userCount ?? 0} staff</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {widgetCount} widgets
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission & Widget Matrix for Selected Role */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRole ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Role Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedRole.name}</h2>
                    {selectedRole.slug === "super-admin" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Unrestricted Super Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    {selectedRole.description || "Manage permissions and records scope for this role."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!selectedRole.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id, selectedRole.name)}
                      className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition"
                      title="Delete custom role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {!isSuper && (
                    <button
                      onClick={handleSaveRole}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Role Configuration
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Record Scope Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Default Record Access Scope</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Governs which records this role can view/edit when permissions are active.
                  </span>
                </div>

                <select
                  disabled={isSuper}
                  value={activeScope}
                  onChange={(e) => setActiveScope(e.target.value as RecordScope)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-50 shadow-xs font-medium"
                >
                  <option value="all">All Records (Agency-Wide)</option>
                  <option value="department">Department Records Only</option>
                  <option value="assigned">Assigned Records Only</option>
                  <option value="own">Own Created Records Only</option>
                </select>
              </div>

              {/* Two Tab Navigation: Module Permissions vs Dashboard Widgets */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("modules")}
                  className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                    activeTab === "modules"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Module Action Permissions</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {isSuper ? "All" : activeRolePermIds.size}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("widgets")}
                  className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                    activeTab === "widgets"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard Widget Permissions</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {isSuper ? ALL_WIDGET_IDS.length : activeRoleWidgets.size} / {ALL_WIDGET_IDS.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: MODULE & ACTION PERMISSIONS MATRIX */}
              {activeTab === "modules" && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold min-w-[180px]">System Module</th>
                        {PERMISSION_ACTIONS.map((action) => (
                          <th key={action} className="py-3 px-2 font-semibold text-center min-w-[70px]">
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SYSTEM_MODULES.map((mod) => (
                        <tr key={mod.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {!isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleRow(mod.id)}
                                  className="text-[10px] text-blue-600 hover:text-blue-700 font-mono underline font-medium"
                                  title="Toggle entire row"
                                >
                                  row
                                </button>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900">{mod.label}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-xs">{mod.description}</p>
                              </div>
                            </div>
                          </td>

                          {PERMISSION_ACTIONS.map((action) => {
                            const permId = getPermissionId(mod.id, action);
                            const isChecked = isSuper || (permId ? activeRolePermIds.has(permId) : false);

                            return (
                              <td key={action} className="py-3 px-2 text-center">
                                <input
                                  type="checkbox"
                                  disabled={isSuper}
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(mod.id, action)}
                                  className="h-4 w-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: DASHBOARD WIDGET PERMISSIONS (SECTION 10 REQUIREMENT) */}
              {activeTab === "widgets" && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                    <LayoutDashboard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Super Admin Widget Access Control</p>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                        Control exactly which metrics, KPI cards, charts, and activity feeds appear on this role&apos;s dashboard.
                        Confidential financial metrics (revenue, profit, expenses) will not be sent to unauthorized user browsers via the API.
                      </p>
                    </div>
                  </div>

                  {DASHBOARD_WIDGET_CATEGORIES.map((cat) => {
                    const categoryWidgets = DASHBOARD_WIDGETS.filter((w) => w.category === cat.id);
                    const allCatActive = categoryWidgets.every((w) => isSuper || activeRoleWidgets.has(w.id));

                    return (
                      <div key={cat.id} className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>{cat.label}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                                {categoryWidgets.filter((w) => isSuper || activeRoleWidgets.has(w.id)).length} / {categoryWidgets.length}
                              </span>
                            </h3>
                            <p className="text-[11px] text-slate-500">{cat.description}</p>
                          </div>

                          {!isSuper && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryWidgets(cat.id, true)}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded bg-blue-50 border border-blue-200"
                              >
                                Enable All
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryWidgets(cat.id, false)}
                                className="text-[10px] text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-100 border border-slate-200"
                              >
                                Disable All
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {categoryWidgets.map((w) => {
                            const isEnabled = isSuper || activeRoleWidgets.has(w.id);

                            return (
                              <div
                                key={w.id}
                                onClick={() => !isSuper && handleToggleWidget(w.id)}
                                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer select-none ${
                                  isEnabled
                                    ? "bg-white border-blue-200 shadow-xs hover:border-blue-300"
                                    : "bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80"
                                } ${isSuper ? "cursor-default" : ""}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{w.name}</span>
                                    {w.category === "financial" && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                        Confidential
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">{w.description}</p>
                                </div>

                                <div className="shrink-0 pt-0.5">
                                  <div
                                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                                      isEnabled ? "bg-blue-600" : "bg-slate-300"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                                        isEnabled ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">No role selected.</div>
          )}
        </div>
      </div>

      {/* Modal for Creating Custom Role */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Create Custom Role
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Define a dynamic role with custom permissions and dashboard widgets.
              </p>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Tour Specialist"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (!newRoleSlug) {
                      setNewRoleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Slug (Identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="senior-tour-specialist"
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Responsibilities and access scope..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Record Scope
                </label>
                <select
                  value={newRoleScope}
                  onChange={(e) => setNewRoleScope(e.target.value as RecordScope)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none shadow-xs"
                >
                  <option value="assigned">Assigned Records Only</option>
                  <option value="department">Department Records Only</option>
                  <option value="own">Own Created Records Only</option>
                  <option value="all">All Records</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Dashboard Widgets ({newRoleWidgets.size} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {DASHBOARD_WIDGETS.map((w) => {
                    const isChecked = newRoleWidgets.has(w.id);
                    return (
                      <label key={w.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const next = new Set(newRoleWidgets);
                            if (isChecked) next.delete(w.id);
                            else next.add(w.id);
                            setNewRoleWidgets(next);
                          }}
                          className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                        />
                        <span className="truncate text-[11px] text-slate-700">{w.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
