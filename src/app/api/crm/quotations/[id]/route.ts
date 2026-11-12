import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
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
          tags: ["Converted from Quotation", quotation.destination],
          totalSpent: quotation.totalAmount,
          bookingsCount: 1,
          assignedTo: user._id,
        });
      } else {
        customer.totalSpent = (customer.totalSpent || 0) + quotation.totalAmount;
        customer.bookingsCount = (customer.bookingsCount || 0) + 1;
        await customer.save();
      }

      const bookingCount = await Booking.countDocuments();
      const bookingRef = `BK-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(4, "0")}`;
      const depDate = quotation.departureDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const retDate = new Date(new Date(depDate).getTime() + (quotation.durationDays || 5) * 24 * 60 * 60 * 1000);

      const newBooking = await Booking.create({
        bookingRef,
        customerId: customer._id,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        packageId: quotation.packageId || undefined,
        packageName: quotation.packageName,
        departureDate: depDate,
        returnDate: retDate,
        adults: quotation.travellersCount || 2,
        children: 0,
        infants: 0,
        travellersCount: quotation.travellersCount || 2,
        travellers: [
          {
            fullName: quotation.customerName,
            age: 30,
            gender: "other",
          },
        ],
        bookingSource: "quotation",
        totalAmount: quotation.totalAmount,
        discount: quotation.discount || 0,
        taxAmount: quotation.gstAmount || 0,
        paidAmount: 0,
        balanceAmount: quotation.totalAmount,
        paymentStatus: "unpaid",
        bookingStatus: "confirmed",
        specialRequirements: quotation.notes,
        assignedStaff: user._id,
      });

      quotation.status = "accepted";
      quotation.convertedBookingId = newBooking._id;
      await quotation.save();

      return NextResponse.json({
        success: true,
        message: "Quotation successfully converted to booking",
        booking: newBooking,
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
