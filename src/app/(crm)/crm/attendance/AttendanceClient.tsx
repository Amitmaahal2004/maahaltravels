"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  LogIn,
  LogOut,
  Trash2,
} from "lucide-react";

interface AttendanceRecord {
  _id: string;
  userId: { _id: string; name: string; email: string };
  userName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalWorkingHours: number;
  status: "present" | "late" | "half_day" | "absent" | "on_leave";
}

export default function AttendanceClient() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [myTodayRecord, setMyTodayRecord] = useState<any>(null);
  const [summary, setSummary] = useState({ totalStaff: 0, presentCount: 0, absentCount: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/attendance?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setMyTodayRecord(data.myTodayRecord);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleClockAction = async (action: "clock_in" | "clock_out") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/crm/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAttendance();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing clock action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attendance record?")) return;
    try {
      const res = await fetch(`/api/crm/attendance/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchAttendance();
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
              <CalendarCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Attendance & Time Clock</h1>
          </div>
          <p className="text-sm text-slate-500">
            Real-time employee clock-in, punch timestamps, working hours tracking, and punctuality monitoring.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-xs">
          <Calendar className="h-4 w-4 text-blue-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Clock In / Out Banner Widget */}
      <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Live Agency Terminal
          </span>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{currentTime || "--:--:--"}</p>
          <p className="text-xs text-slate-600">
            {myTodayRecord ? (
              myTodayRecord.checkOutTime ? (
                <span className="text-emerald-700 font-semibold">
                  Shift Complete &bull; Worked {myTodayRecord.totalWorkingHours} Hours
                </span>
              ) : (
                <span className="text-blue-700 font-semibold">
                  Clocked In at {new Date(myTodayRecord.checkInTime).toLocaleTimeString()}
                </span>
              )
            ) : (
              "You have not checked in for today's shift yet."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!myTodayRecord ? (
            <button
              onClick={() => handleClockAction("clock_in")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              Clock In Now
            </button>
          ) : !myTodayRecord.checkOutTime ? (
            <button
              onClick={() => handleClockAction("clock_out")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Clock Out (End Shift)
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
              Shift Ended
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Registered Personnel</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalStaff}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Present on Selected Date</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.presentCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Absent / Not Punched</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{summary.absentCount}</p>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading Attendance Records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <CalendarCheck className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No attendance entries recorded for this date</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Clock In button above or select another date.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Check-In Time</th>
                <th className="p-3.5">Check-Out Time</th>
                <th className="p-3.5">Total Hours</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-slate-900">{r.userName}</td>
                  <td className="p-3.5 text-slate-700">{r.date}</td>
                  <td className="p-3.5 text-blue-600 font-mono">
                    {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "-"}
                  </td>
                  <td className="p-3.5 text-slate-700 font-mono">
                    {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "Working..."}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600">{r.totalWorkingHours} hrs</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        r.status === "present"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "late"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Record"
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
    </div>
  );
}

