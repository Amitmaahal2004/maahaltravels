"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  Building,
  DollarSign,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
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

interface EmployeeItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  role?: { name: string; slug: string };
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
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [summary, setSummary] = useState({ totalStaff: 0, activeStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Password@123",
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

  // Fetch Employees
  const fetchEmployees = async () => {
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
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        } else {
          alert(data.error || "Failed to update employee");
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
        } else {
          alert(data.error || "Failed to create employee");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving employee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this employee and revoke access?")) return;
    try {
      const res = await fetch(`/api/crm/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "Password@123",
      designation: "Travel Consultant",
      departmentId: "",
      basicSalary: 35000,
      employmentType: "full_time",
      status: "active",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEmp(null);
    setShowAddModal(true);
    // Refresh departments dynamically whenever user opens the creation form
    fetchDepartments();
  };

  const openEdit = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    const assignedDeptId = emp.departmentId || emp.department?._id || "";
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      password: "",
      designation: emp.designation,
      departmentId: assignedDeptId,
      basicSalary: emp.salary?.basic || 35000,
      employmentType: emp.employmentType || "full_time",
      status: emp.status,
    });
    setShowAddModal(true);
    // Refresh departments dynamically whenever user opens the edit form
    fetchDepartments();
  };

  // Filtered employees list (including client-side department filter)
  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter === "all") return true;
    const empDeptId = emp.departmentId || emp.department?._id;
    return empDeptId === deptFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff & Employee Directory</h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage agency personnel, designations, salary records, and department attachments with live Atlas sync.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add New Employee
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Total Staff Registered</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalStaff}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Active Operators & Admins</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.activeStaff}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400">Departments Active in Atlas</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-2xl font-bold text-indigo-400">{departments.filter((d) => d.isActive).length}</p>
            <Link
              href="/crm/departments"
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              fetchEmployees();
              fetchDepartments();
            }}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh Staff & Departments"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Personnel from MongoDB Atlas...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Users className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No employees found matching criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add team members to grant login credentials and operational roles.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Staff ID</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Basic Salary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.email}</p>
                  </td>
                  <td className="p-3.5 font-mono text-sky-400">{emp.employeeId}</td>
                  <td className="p-3.5 text-slate-200">{emp.designation}</td>
                  <td className="p-3.5 text-slate-300">
                    {emp.department ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 font-medium">
                        <Building className="h-3 w-3 text-sky-400" />
                        {emp.department.name} ({emp.department.code})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                      {emp.role?.name || "Employee"}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-emerald-400">
                    {formatCurrency(emp.salary?.basic || 35000)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        emp.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => openEdit(emp)}
                      className="p-1.5 text-sky-400 hover:bg-sky-950/50 rounded-lg transition"
                      title="Edit Profile"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingEmp ? "Edit Staff Details" : "Register Team Member"}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingEmp ? `Editing profile of ${editingEmp.name}` : "Create credentials and assign to department"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEmp(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingEmp)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50 focus:outline-none focus:border-sky-500"
                    placeholder="e.g. priya@travelagency.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
                {!editingEmp && (
                  <div>
                    <label className="block text-slate-400 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Senior Tour Specialist"
                  />
                </div>

                {/* Dynamic Department Dropdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-400">Department</label>
                    {departmentsLoading && (
                      <span className="text-[10px] text-sky-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
                      </span>
                    )}
                  </div>

                  {departmentsError ? (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
                      <span>{departmentsError}</span>
                      <button
                        type="button"
                        onClick={fetchDepartments}
                        className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                      disabled={departmentsLoading}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => {
                        // Allow selecting if active OR if it is the employee's currently assigned historical department
                        const isCurrentAssigned = editingEmp && formData.departmentId === d._id;
                        const isSelectable = d.isActive || isCurrentAssigned;

                        return (
                          <option
                            key={d._id}
                            value={d._id}
                            disabled={!isSelectable}
                            className={!d.isActive ? "text-slate-500 bg-slate-900" : "text-white bg-slate-950"}
                          >
                            {d.name} ({d.code}) {!d.isActive ? "(Inactive)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  {!departmentsLoading && departments.length === 0 && !departmentsError && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between mt-1">
                      <span>No departments exist in MongoDB.</span>
                      <Link
                        href="/crm/departments"
                        className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
                        target="_blank"
                      >
                        Create One <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Basic Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                {editingEmp && (
                  <div>
                    <label className="block text-slate-400 mb-1">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50 transition"
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
