import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const todayStr = new Date().toISOString().split("T")[0];
    const date = searchParams.get("date") || todayStr;

    const attendanceRecords = await Attendance.find({ date }).populate("userId", "name email").sort({ checkInTime: -1 });

    // Check current logged-in user's attendance for today
    const myTodayRecord = await Attendance.findOne({
      userId: user._id,
      date: todayStr,
    });

    const totalStaff = await User.countDocuments({ status: "active" });
    const presentCount = attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length;
    const absentCount = Math.max(0, totalStaff - presentCount);

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
      myTodayRecord,
      summary: {
        totalStaff,
        presentCount,
        absentCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { action } = body; // "clock_in" or "clock_out"
    const todayStr = new Date().toISOString().split("T")[0];

    let record = await Attendance.findOne({
      userId: user._id,
      date: todayStr,
    });

    if (action === "clock_in") {
      if (record && record.checkInTime) {
        return NextResponse.json(
          { success: false, error: "You have already clocked in today!" },
          { status: 400 }
        );
      }

      const now = new Date();
      // Check if late (e.g., after 9:30 AM)
      const hours = now.getHours();
      const mins = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && mins > 30);

      record = await Attendance.create({
        userId: user._id,
        userName: user.name,
        departmentId: user.department?._id || undefined,
        date: todayStr,
        checkInTime: now,
        totalWorkingHours: 0,
        status: isLate ? "late" : "present",
      });

      return NextResponse.json({
        success: true,
        message: `Clocked in successfully at ${now.toLocaleTimeString()}`,
        data: record,
      });
    }

    if (action === "clock_out") {
      if (!record || !record.checkInTime) {
        return NextResponse.json(
          { success: false, error: "You must clock in before clocking out!" },
          { status: 400 }
        );
      }

      const now = new Date();
      const checkInMs = new Date(record.checkInTime).getTime();
      const diffHours = Number(((now.getTime() - checkInMs) / (1000 * 60 * 60)).toFixed(2));

      record.checkOutTime = now;
      record.totalWorkingHours = diffHours;
      await record.save();

      return NextResponse.json({
        success: true,
        message: `Clocked out successfully at ${now.toLocaleTimeString()}. Worked: ${diffHours} hrs`,
        data: record,
      });
    }

    // Manual Admin entry
    const { userId, userName, date, checkInTime, checkOutTime, status } = body;
    const manualRecord = await Attendance.create({
      userId: userId || user._id,
      userName: userName || user.name,
      date: date || todayStr,
      checkInTime: checkInTime ? new Date(checkInTime) : new Date(),
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      totalWorkingHours: 8,
      status: status || "present",
    });

    return NextResponse.json({ success: true, data: manualRecord }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process attendance" },
      { status: 500 }
    );
  }
}
