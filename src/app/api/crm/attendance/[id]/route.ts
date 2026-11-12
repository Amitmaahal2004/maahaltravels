import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export const dynamic = "force-dynamic";

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

    const deleted = await Attendance.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Attendance record deleted" });
  } catch (error: any) {
    console.error("DELETE /api/crm/attendance/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
