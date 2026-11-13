import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Quotation from "@/models/Quotation";
import Booking from "@/models/Booking";
import Customer from "@/models/Customer";

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

    const permError = assertPermission(user, "quotations", "view");
    if (permError) return permError;

    await connectToDatabase();

    const quotation = await Quotation.findById(params.id);
    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    console.error("GET /api/crm/quotations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotation" },
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

    const permError = assertPermission(user, "quotations", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();
    const { action, ...updateData } = body;

    const quotation = await Quotation.findById(params.id);
    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    // Convert Quotation to Booking
    if (action === "convert_to_booking") {
      let customer = quotation.customerId ? await Customer.findById(quotation.customerId) : null;
      if (!customer) {
        customer = await Customer.findOne({ email: quotation.customerEmail.toLowerCase() });
      }

      if (!customer) {
        customer = await Customer.create({
          name: quotation.customerName,
          email: quotation.customerEmail.toLowerCase(),
          phone: quotation.customerPhone || "N/A",
          customerType: "individual",
          source: "website",
          status: "active",
          tags: ["Quotation Conversion", quotation.destination],
          notes: `Created during conversion of Quotation ${quotation.quotationNumber}`,
          assignedTo: user.id,
        });
      }

      const bookingCount = await Booking.countDocuments();
      const bookingRef = `BK-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(4, "0")}`;

      const depDate = quotation.departureDate ? new Date(quotation.departureDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const days = quotation.durationDays || 5;
      const retDate = new Date(depDate.getTime() + days * 24 * 60 * 60 * 1000);
      const travellers = quotation.travellersCount || 2;

      const booking = await Booking.create({
        bookingRef,
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        packageId: quotation.packageId,
        packageName: quotation.packageName,
        departureDate: depDate,
        returnDate: retDate,
        adults: travellers,
        children: 0,
        infants: 0,
        travellersCount: travellers,
        travellers: [
          {
            fullName: customer.name,
            age: 30,
            gender: "other",
          },
        ],
        bookingSource: "Quotation",
        totalAmount: quotation.totalAmount,
        discount: 0,
        taxAmount: 0,
        paidAmount: 0,
        balanceAmount: quotation.totalAmount,
        paymentStatus: "unpaid",
        bookingStatus: "confirmed",
        specialRequirements: `Converted from Quotation: ${quotation.quotationNumber}. Notes: ${quotation.notes || "None"}`,
        assignedStaff: user.id as any,
      });

      quotation.status = "accepted";
      quotation.convertedBookingId = booking._id;
      await quotation.save();

      return NextResponse.json({
        success: true,
        message: "Quotation converted to Booking successfully",
        booking,
        quotation,
      });
    }

    // Status or content update
    const updatedQuotation = await Quotation.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updatedQuotation });
  } catch (error: any) {
    console.error("PUT /api/crm/quotations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quotation" },
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

    const permError = assertPermission(user, "quotations", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Quotation.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/quotations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete quotation" },
      { status: 500 }
    );
  }
}
