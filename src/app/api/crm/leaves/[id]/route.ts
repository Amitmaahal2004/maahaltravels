import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import LeaveRequest from "@/models/LeaveRequest";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { status, rejectionReason } = body;

    const leave = await LeaveRequest.findById(params.id);
    if (!leave) {
      return NextResponse.json({ success: false, error: "Leave request not found" }, { status: 404 });
    }

    leave.status = status;
    leave.approvedBy = user.id as any;
    leave.approvedByName = user.name;
    if (rejectionReason) leave.rejectionReason = rejectionReason;

    await leave.save();

    return NextResponse.json({ success: true, data: leave });
  } catch (error: any) {
    console.error("PUT /api/crm/leaves/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update leave" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const deleted = await LeaveRequest.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Leave request deleted" });
  } catch (error: any) {
    console.error("DELETE /api/crm/leaves/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete leave" },
      { status: 500 }
    );
  }
}
