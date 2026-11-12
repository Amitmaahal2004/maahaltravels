"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface EmployeeItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  role?: { name: string; slug: string };
  department?: { name: string; code: string };
  employeeId: string;
  designation: string;
  employmentType: string;
  salary?: { basic: number; allowances: number; currency: string };
  createdAt: string;
}

export default function EmployeesClient() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalStaff: 0, activeStaff: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);

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
        if (data.departments) setDepartments(data.departments);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
          fetchEmployees();
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
          fetchEmployees();
        } else {
          alert(data.error || "Failed to create employee");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving employee");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this employee and revoke access?")) return;
    try {
      const res = await fetch(`/api/crm/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchEmployees();
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

  const openEdit = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      password: "",
      designation: emp.designation,
      departmentId: (emp.department as any)?._id || "",
      basicSalary: emp.salary?.basic || 35000,
      employmentType: emp.employmentType || "full_time",
      status: emp.status,
    });
    setShowAddModal(true);
  };

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
            Manage agency personnel, designations, salary records, and department attachments.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingEmp(null);
            setShowAddModal(true);
          }}
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
          <p className="text-xs text-slate-400">Departments Active</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{departments.length}</p>
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Personnel from MongoDB Atlas...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Users className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No employees found</p>
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
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.email}</p>
                  </td>
                  <td className="p-3.5 font-mono text-sky-400">{emp.employeeId}</td>
                  <td className="p-3.5 text-slate-200">{emp.designation}</td>
                  <td className="p-3.5 text-slate-300">
                    {emp.department ? (emp.department as any).name : "Global HQ"}
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

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingEmp ? "Edit Staff Details" : "Register Team Member"}
              </h2>
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
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
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
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                    placeholder="e.g. priya@travelagency.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="+91..."
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
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    placeholder="e.g. Senior Tour Specialist"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Basic Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20"
                >
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

