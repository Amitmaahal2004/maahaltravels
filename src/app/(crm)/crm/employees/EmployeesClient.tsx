"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Building,
  Shield,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DepartmentOption {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  staffCount?: number;
}

interface RoleOption {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
  permissionsCount?: number;
  isSuperAdminRole?: boolean;
}

interface EmployeeItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  role?: { _id?: string; name: string; slug: string; isSystem?: boolean } | null;
  roleId?: string;
  department?: { _id?: string; name: string; code: string; isActive?: boolean } | null;
  departmentId?: string;
  employeeId: string;
  designation: string;
  employmentType: string;
  salary?: { basic: number; allowances: number; currency: string };
  createdAt: string;
}

export default function EmployeesClient() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [summary, setSummary] = useState({ totalStaff: 0, activeStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Password@123",
    roleId: "", // Mandatory: Default is empty, NEVER Admin or Super Admin
    designation: "Travel Consultant",
    departmentId: "",
    basicSalary: 35000,
    employmentType: "full_time",
    status: "active",
  });

  // Dedicated Department Fetcher from MongoDB
  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      const res = await fetch("/api/crm/departments");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDepartments(json.data);
      } else {
        setDepartmentsError(json.error || "Failed to load departments from database");
      }
    } catch (err: any) {
      console.error("Error fetching departments:", err);
      setDepartmentsError(err.message || "Network error loading departments");
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  // Dedicated Roles Fetcher from MongoDB
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setRolesError(null);
      const res = await fetch("/api/crm/roles");
      const json = await res.json();
      if (json.success && Array.isArray(json.roles)) {
        const mappedRoles = json.roles.map((r: any) => ({
          _id: r.id || r._id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          isSystem: r.isSystem,
          permissionsCount: Array.isArray(r.permissions) ? r.permissions.length : 0,
          isSuperAdminRole: r.slug === "super-admin",
        }));
        setRoles(mappedRoles);
      } else {
        setRolesError(json.error || "Failed to load roles from database");
      }
    } catch (err: any) {
      console.error("Error fetching roles:", err);
      setRolesError(err.message || "Network error loading roles");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Fetch Employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/crm/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        if (data.summary) setSummary(data.summary);
        // Also populate roles & departments if provided by endpoint
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          setRoles(data.roles);
        }
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
        }
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchEmployees();
  }, [fetchDepartments, fetchRoles, fetchEmployees]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // Strict validation: Role is mandatory
    if (!formData.roleId || formData.roleId.trim() === "") {
      setFormValidationError("Role / Access Level is mandatory. Please select an active role for this employee.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingEmp) {
        const res = await fetch(`/api/crm/employees/${editingEmp._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setEditingEmp(null);
          resetForm();
          await fetchEmployees();
          await fetchDepartments();
          await fetchRoles();
        } else {
          setFormValidationError(data.error || "Failed to update employee");
        }
      } else {
        const res = await fetch("/api/crm/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          await fetchEmployees();
          await fetchDepartments();
          await fetchRoles();
        } else {
          setFormValidationError(data.error || "Failed to create employee");
        }
      }
    } catch (err: any) {
      console.error(err);
      setFormValidationError(err.message || "Error saving employee record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" and revoke their CRM access?`)) return;
    try {
      const res = await fetch(`/api/crm/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchEmployees();
        await fetchDepartments();
        await fetchRoles();
      } else {
        alert(data.error || "Failed to delete employee");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error deleting employee");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "Password@123",
      roleId: "", // Always reset to empty
      designation: "Travel Consultant",
      departmentId: "",
      basicSalary: 35000,
      employmentType: "full_time",
      status: "active",
    });
    setFormValidationError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEmp(null);
    setShowAddModal(true);
    fetchDepartments();
    fetchRoles();
  };

  const openEdit = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setFormValidationError(null);
    const assignedDeptId = emp.departmentId || emp.department?._id || "";
    const assignedRoleId = emp.roleId || emp.role?._id || "";

    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone !== "N/A" ? emp.phone : "",
      password: "",
      roleId: assignedRoleId,
      designation: emp.designation,
      departmentId: assignedDeptId,
      basicSalary: emp.salary?.basic || 35000,
      employmentType: emp.employmentType || "full_time",
      status: emp.status,
    });
    setShowAddModal(true);
    fetchDepartments();
    fetchRoles();
  };

  // Helper for Role Badges
  const getRoleBadge = (roleName?: string, roleSlug?: string) => {
    const slug = (roleSlug || "").toLowerCase();
    const name = roleName || "Employee";

    if (slug === "super-admin") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
          <Shield className="h-3 w-3 text-purple-600" />
          {name}
        </span>
      );
    }
    if (slug === "admin") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <KeyRound className="h-3 w-3 text-rose-600" />
          {name}
        </span>
      );
    }
    if (slug.includes("sales")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <KeyRound className="h-3 w-3 text-amber-600" />
          {name}
        </span>
      );
    }
    if (slug.includes("operations") || slug.includes("tour")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <KeyRound className="h-3 w-3 text-blue-600" />
          {name}
        </span>
      );
    }
    if (slug.includes("hr")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <KeyRound className="h-3 w-3 text-emerald-600" />
          {name}
        </span>
      );
    }
    if (slug.includes("accountant") || slug.includes("finance")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <KeyRound className="h-3 w-3 text-cyan-600" />
          {name}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <KeyRound className="h-3 w-3 text-slate-500" />
        {name}
      </span>
    );
  };

  // Filtered employees list (Department + Role filters)
  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter !== "all") {
      const empDeptId = emp.departmentId || emp.department?._id;
      if (empDeptId !== deptFilter) return false;
    }
    if (roleFilter !== "all") {
      const empRoleId = emp.roleId || emp.role?._id;
      const empRoleSlug = emp.role?.slug;
      if (empRoleId !== roleFilter && empRoleSlug !== roleFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Employee Directory</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage agency personnel, dynamic role assignments, departmental allocations, and RBAC permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crm/admin/roles"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition"
          >
            <Shield className="h-4 w-4 text-blue-600" />
            <span>Roles & Permissions</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            Add New Employee
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Staff Registered</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalStaff}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Active Staff</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.activeStaff}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Configured Roles</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-2xl font-bold text-indigo-600">{roles.length}</p>
            <Link
              href="/crm/admin/roles"
              className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Configure <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Active Departments</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-2xl font-bold text-blue-600">{departments.filter((d) => d.isActive).length}</p>
            <Link
              href="/crm/departments"
              className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Assigned Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              fetchEmployees();
              fetchDepartments();
              fetchRoles();
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 shadow-xs transition"
            title="Refresh Staff, Roles & Departments"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Personnel and Role assignments from MongoDB Atlas...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <Users className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No employees found matching criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an employee and assign their operational role to grant dashboard access.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Employee Name & Email</th>
                <th className="p-3.5">Staff ID</th>
                <th className="p-3.5">Role / Access Level</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Basic Salary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{emp.name}</p>
                    <p className="text-[10px] text-slate-500">{emp.email}</p>
                  </td>
                  <td className="p-3.5 font-mono text-blue-600 font-medium">{emp.employeeId}</td>
                  <td className="p-3.5">
                    {getRoleBadge(emp.role?.name, emp.role?.slug)}
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">{emp.designation}</td>
                  <td className="p-3.5 text-slate-700">
                    {emp.department ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                        <Building className="h-3 w-3 text-blue-600" />
                        {emp.department.name} ({emp.department.code})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-emerald-600">
                    {formatCurrency(emp.salary?.basic || 35000)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        emp.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEdit(emp)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Profile & Role"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id, emp.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete User"
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

      {/* Add / Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingEmp ? "Edit Staff Details & Role Assignment" : "Register Team Member & Assign Role"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingEmp
                    ? `Update profile, department, and access permissions for ${editingEmp.name}`
                    : "Create user credentials, assign an RBAC role, and allocate department"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEmp(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formValidationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{formValidationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingEmp)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 disabled:opacity-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. priya@travelagency.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Initial Password (only for new employees) */}
                {!editingEmp && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    />
                  </div>
                )}

                {/* MANDATORY ROLE SELECTION FIELD */}
                <div className="md:col-span-2 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-900 font-bold flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                      <span>Role / Access Level *</span>
                      <span className="text-[10px] text-rose-600 font-bold uppercase">(Mandatory)</span>
                    </label>

                    {rolesLoading && (
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" /> Fetching Roles...
                      </span>
                    )}
                  </div>

                  {rolesError ? (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center justify-between">
                      <span>{rolesError}</span>
                      <button
                        type="button"
                        onClick={fetchRoles}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.roleId}
                      onChange={(e) => {
                        setFormData({ ...formData, roleId: e.target.value });
                        setFormValidationError(null);
                      }}
                      className={`w-full p-2.5 bg-white border rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 shadow-xs ${
                        !formData.roleId
                          ? "border-amber-300 focus:ring-amber-500/20 focus:border-amber-500"
                          : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
                      }`}
                      disabled={rolesLoading}
                    >
                      <option value="">-- Select Assigned Role / Access Level (Required) --</option>
                      {roles.map((r) => {
                        const isSuper = r.slug === "super-admin";
                        return (
                          <option key={r._id} value={r._id}>
                            {r.name} {isSuper ? "(System Full Access)" : `(${r.permissionsCount || 0} permissions)`}
                            {r.description ? ` - ${r.description}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      The employee will inherit this role&apos;s permissions for sidebar modules, pages, and actions.
                    </span>
                    <Link
                      href="/crm/admin/roles"
                      target="_blank"
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
                    >
                      Manage Roles in RBAC <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    placeholder="e.g. Senior Tour Specialist"
                  />
                </div>

                {/* Dynamic Department Dropdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-semibold">Department</label>
                    {departmentsLoading && (
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
                      </span>
                    )}
                  </div>

                  {departmentsError ? (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center justify-between">
                      <span>{departmentsError}</span>
                      <button
                        type="button"
                        onClick={fetchDepartments}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                      disabled={departmentsLoading}
                    >
                      <option value="">Select Department (Optional)...</option>
                      {departments.map((d) => {
                        const isCurrentAssigned = editingEmp && formData.departmentId === d._id;
                        const isSelectable = d.isActive || isCurrentAssigned;

                        return (
                          <option
                            key={d._id}
                            value={d._id}
                            disabled={!isSelectable}
                            className={!d.isActive ? "text-slate-400 bg-slate-50" : "text-slate-900 bg-white"}
                          >
                            {d.name} ({d.code}) {!d.isActive ? "(Inactive)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Basic Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                {/* Status (editing only) */}
                {editingEmp && (
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    >
                      <option value="active">Active (Full access according to assigned role)</option>
                      <option value="inactive">Inactive (Access suspended)</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || rolesLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingEmp ? "Save Changes" : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
