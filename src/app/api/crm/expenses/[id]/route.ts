import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Expense from "@/models/Expense";

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

    const permError = assertPermission(user, "expenses", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Expense.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense record deleted" });
  } catch (error: any) {
    console.error("DELETE /api/crm/expenses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
