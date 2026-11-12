"use client";

import React, { useState, useEffect } from "react";
import { RoleWithPermissions } from "@/types/rbac.types";
import { SYSTEM_MODULES, PERMISSION_ACTIONS, RecordScope } from "@/config/permissions.config";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
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
  const [activeRolePermIds, setActiveRolePermIds] = useState<Set<string>>(new Set());
  const [activeScope, setActiveScope] = useState<RecordScope>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Role Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleScope, setNewRoleScope] = useState<RecordScope>("assigned");
  const [isCreating, setIsCreating] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Sync state whenever selected role changes
  useEffect(() => {
    if (selectedRole) {
      const permIds = new Set(selectedRole.permissions.map((p) => p.id || ""));
      setActiveRolePermIds(permIds);
      setActiveScope(selectedRole.defaultRecordScope || "all");
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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: "error", text: data.error || "Failed to update role permissions." });
        setIsSaving(false);
        return;
      }

      setStatusMessage({ type: "success", text: `Role "${selectedRole.name}" permissions updated successfully.` });
      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? {
                ...r,
                defaultRecordScope: activeScope,
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
        alert(data.error || "Failed to delete role.");
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-sky-400" />
            Dynamic Roles & Permission Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise RBAC with module-level action toggles and record-scoping (own, assigned, department, all).
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Custom Role
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-950/70 border border-emerald-800 text-emerald-200"
              : "bg-rose-950/70 border border-rose-800 text-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Layout: Roles List on left, Permission Matrix on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles Selector Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              System & Custom Roles ({roles.length})
            </div>
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1 ${
                    isSelected
                      ? "bg-sky-500/10 border border-sky-500/30 text-white"
                      : "hover:bg-slate-800/70 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{r.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        r.isSystem
                          ? "bg-slate-800 text-slate-400"
                          : "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                      }`}
                    >
                      {r.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{r.userCount ?? 0} staff assigned</span>
                    <span className="capitalize">{r.defaultRecordScope} scope</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission Grid for Selected Role */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRole ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Role Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedRole.name}</h2>
                    {selectedRole.slug === "super-admin" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Unrestricted System Super Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {selectedRole.description || "Manage permissions and records scope for this role."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!selectedRole.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id, selectedRole.name)}
                      className="p-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold transition"
                      title="Delete custom role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {selectedRole.slug !== "super-admin" && (
                    <button
                      onClick={handleSaveRole}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-60 transition"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Role Permissions
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Record Scope Configuration */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-white block">Default Record Access Scope</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Governs which records this role can view/edit when permissions are active.
                  </span>
                </div>

                <select
                  disabled={selectedRole.slug === "super-admin"}
                  value={activeScope}
                  onChange={(e) => setActiveScope(e.target.value as RecordScope)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                >
                  <option value="all">All Records (Agency-Wide)</option>
                  <option value="department">Department Records Only</option>
                  <option value="assigned">Assigned Records Only</option>
                  <option value="own">Own Created Records Only</option>
                </select>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold min-w-[180px]">System Module</th>
                      {PERMISSION_ACTIONS.map((action) => (
                        <th key={action} className="py-3 px-2 font-semibold text-center min-w-[70px]">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SYSTEM_MODULES.map((mod) => {
                      const isSuper = selectedRole.slug === "super-admin";

                      return (
                        <tr key={mod.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {!isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleRow(mod.id)}
                                  className="text-[10px] text-sky-400 hover:text-sky-300 font-mono underline"
                                  title="Toggle entire row"
                                >
                                  row
                                </button>
                              )}
                              <div>
                                <p className="font-semibold text-white">{mod.label}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">{mod.description}</p>
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
                                  className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">No role selected.</div>
          )}
        </div>
      </div>

      {/* Modal for Creating Custom Role */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-sky-400" />
                Create Custom Role
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Define a dynamic role with custom permission matrix.
              </p>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Role Name
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Role Slug (Identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="senior-tour-specialist"
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Responsibilities and access scope..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Record Scope
                </label>
                <select
                  value={newRoleScope}
                  onChange={(e) => setNewRoleScope(e.target.value as RecordScope)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="assigned">Assigned Records Only</option>
                  <option value="department">Department Records Only</option>
                  <option value="own">Own Created Records Only</option>
                  <option value="all">All Records</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-60 transition flex items-center gap-2"
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

