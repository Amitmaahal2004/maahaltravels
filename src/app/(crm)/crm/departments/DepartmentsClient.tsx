"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DeptItem {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  staffCount: number;
}

export default function DepartmentsClient() {
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DeptItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/crm/departments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const res = await fetch(`/api/crm/departments/${editingDept._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          setEditingDept(null);
          resetForm();
          fetchDepartments();
        } else {
          alert(data.error || "Failed to update department");
        }
      } else {
        const res = await fetch("/api/crm/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setShowAddModal(false);
          resetForm();
          fetchDepartments();
        } else {
          alert(data.error || "Failed to create department");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving department");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await fetch(`/api/crm/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", isActive: true });
  };

  const openEdit = (d: DeptItem) => {
    setEditingDept(d);
    setFormData({
      name: d.name,
      code: d.code,
      description: d.description || "",
      isActive: d.isActive,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Departments</h1>
          </div>
          <p className="text-sm text-slate-500">
            Configure business functional units, divisions, and staffing boundaries.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingDept(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department name or code..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Departments */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Departments from MongoDB Atlas...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No departments configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d) => (
            <div
              key={d._id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition overflow-hidden shadow-xs p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    {d.code}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      d.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{d.description || "No description provided."}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  {d.staffCount} Team Members
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(d)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Department"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Department"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDept ? "Edit Department" : "Add Department"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Sales & Tours"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. SLS"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Functional purpose of this department..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition"
                >
                  {editingDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

