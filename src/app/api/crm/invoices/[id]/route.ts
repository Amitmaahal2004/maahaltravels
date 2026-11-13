import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "invoices", "view");
    if (permError) return permError;

    await connectToDatabase();

    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    console.error("GET /api/crm/invoices/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "invoices", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (body.action === "mark_paid") {
      invoice.paidAmount = invoice.totalAmount;
      invoice.balanceAmount = 0;
      invoice.status = "paid";
      await invoice.save();

      // Sync booking if linked
      if (invoice.bookingId) {
        await Booking.findByIdAndUpdate(invoice.bookingId, {
          paidAmount: invoice.totalAmount,
          balanceAmount: 0,
          paymentStatus: "paid",
        });
      }

      return NextResponse.json({ success: true, data: invoice });
    }

    const updated = await Invoice.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/invoices/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice" },
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

    const permError = assertPermission(user, "invoices", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Invoice.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/invoices/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
