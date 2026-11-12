"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  User,
  Clock,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskItem {
  _id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignedToName?: string;
  createdByName?: string;
  status: "pending" | "in_progress" | "under_review" | "completed" | "cancelled";
  createdAt: string;
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    urgentTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    assignedToId: "",
    assignedToName: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await fetch(`/api/crm/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
        if (data.staffUsers) setStaffUsers(data.staffUsers);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter]);

  const handleToggleComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_complete" }),
      });
      const data = await res.json();
      if (data.success) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedStaff = staffUsers.find((s) => s._id === formData.assignedToId);
      const payload = {
        ...formData,
        assignedToName: selectedStaff ? selectedStaff.name : "Assigned Staff",
      };

      const res = await fetch("/api/crm/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          assignedToId: "",
          assignedToName: "",
        });
        fetchTasks();
      } else {
        alert(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/crm/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckSquare className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks & Operational To-Dos</h1>
          </div>
          <p className="text-sm text-slate-500">
            Coordinate team follow-ups, voucher deliveries, itinerary checks, and client communications.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Task
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Action Items</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalTasks}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Pending Execution</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingTasks}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Completed Tasks</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.completedTasks}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Urgent Priority</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{summary.urgentTasks}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or assignees..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Tasks from MongoDB Atlas...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <CheckSquare className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No tasks pending</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Everything is up to date! Click &quot;Create New Task&quot; to delegate operational duties.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const isDone = t.status === "completed";
            return (
              <div
                key={t._id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 shadow-xs ${
                  isDone
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(t._id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                  >
                    {isDone ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p className={`text-sm font-bold ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {t.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-600" />
                          Due: {formatDate(t.dueDate)}
                        </span>
                      )}
                      {t.assignedToName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-indigo-600" />
                          Assigned: {t.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      t.priority === "urgent"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : t.priority === "high"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {t.priority}
                  </span>

                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  placeholder="e.g. Call client for Rohtang permit details"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed instructions..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assign To Staff Member</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                >
                  <option value="">Select Assignee...</option>
                  {staffUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
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
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
