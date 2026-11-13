import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Invoice from "@/models/Invoice";

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

    const permError = assertPermission(user, "bookings", "view");
    if (permError) return permError;

    await connectToDatabase();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    console.error("GET /api/crm/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch booking" },
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

    const permError = assertPermission(user, "bookings", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (body.paidAmount !== undefined) {
      const paid = Number(body.paidAmount);
      body.paidAmount = paid;
      body.balanceAmount = Math.max(0, booking.totalAmount - paid);
      body.paymentStatus = paid >= booking.totalAmount ? "paid" : paid > 0 ? "partially_paid" : "unpaid";

      // Sync linked invoice
      await Invoice.findOneAndUpdate(
        { bookingId: booking._id },
        { paidAmount: paid, balanceAmount: body.balanceAmount, status: body.paymentStatus }
      );
    }

    const updated = await Booking.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
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

    const permError = assertPermission(user, "bookings", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Booking.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Booking deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/bookings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}
