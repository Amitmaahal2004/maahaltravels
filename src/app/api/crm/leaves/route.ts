import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import LeaveRequest from "@/models/LeaveRequest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "leaves", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status && status !== "all") query.status = status;

    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });

    const totalRequests = await LeaveRequest.countDocuments();
    const pendingCount = await LeaveRequest.countDocuments({ status: "pending" });
    const approvedCount = await LeaveRequest.countDocuments({ status: "approved" });

    return NextResponse.json({
      success: true,
      data: leaves,
      summary: {
        totalRequests,
        pendingCount,
        approvedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/leaves error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leaves" },
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

    const { leaveType, startDate, endDate, reason } = body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "Leave type, start date, end date, and reason are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = await LeaveRequest.create({
      userId: user.id,
      userName: user.name,
      departmentId: user.department?.id || undefined,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "pending",
    });

    return NextResponse.json({ success: true, data: newLeave }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leaves error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply for leave" },
      { status: 500 }
    );
  }
}
