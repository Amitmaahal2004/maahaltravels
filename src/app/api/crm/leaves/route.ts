import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import LeaveRequest from "@/models/LeaveRequest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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

    const { leaveType = "casual", startDate, endDate, totalDays = 1, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "Start date, end date, and reason are required" },
        { status: 400 }
      );
    }

    const newLeave = await LeaveRequest.create({
      userId: user._id,
      userName: user.name,
      departmentId: user.department?._id || undefined,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays: Number(totalDays) || 1,
      reason,
      status: "pending",
    });

    return NextResponse.json({ success: true, data: newLeave }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leaves error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit leave request" },
      { status: 500 }
    );
  }
}
