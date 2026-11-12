import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";

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

    const deleted = await Payment.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Payment record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Payment record deleted" });
  } catch (error: any) {
    console.error("DELETE /api/crm/payments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete payment" },
      { status: 500 }
    );
  }
}
