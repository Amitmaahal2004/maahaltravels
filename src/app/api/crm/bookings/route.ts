import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Customer from "@/models/Customer";
import Invoice from "@/models/Invoice";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "bookings", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const bookingStatus = searchParams.get("bookingStatus") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const query: any = {};
    if (bookingStatus && bookingStatus !== "all") query.bookingStatus = bookingStatus;
    if (paymentStatus && paymentStatus !== "all") query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { bookingRef: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    const totalBookings = await Booking.countDocuments();
    const confirmedCount = await Booking.countDocuments({ bookingStatus: "confirmed" });
    const inProgressCount = await Booking.countDocuments({ bookingStatus: "in_progress" });
    const totalBookingValue = bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalCollected = bookings.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    const totalBalance = bookings.reduce((acc, b) => acc + (b.balanceAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: bookings,
      summary: {
        totalBookings,
        confirmedCount,
        inProgressCount,
        totalBookingValue,
        totalCollected,
        totalBalance,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/bookings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bookings" },
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

    const permError = assertPermission(user, "bookings", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      packageName,
      departureDate,
      returnDate,
      adults = 2,
      children = 0,
      totalAmount,
      paidAmount = 0,
      specialRequirements,
      bookingStatus = "confirmed",
    } = body;

    if (!customerName || !customerEmail || !packageName || !departureDate || !totalAmount) {
      return NextResponse.json(
        { success: false, error: "Customer, package, departure date, and total amount are required" },
        { status: 400 }
      );
    }

    // Find or create customer
    let customer = await Customer.findOne({ email: customerEmail.toLowerCase() });
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone || "N/A",
        customerType: "individual",
        source: "website",
        status: "active",
        tags: ["Direct Booking", packageName],
        totalSpent: Number(totalAmount),
        bookingsCount: 1,
        assignedTo: user.id,
      });
    } else {
      customer.totalSpent = (customer.totalSpent || 0) + Number(totalAmount);
      customer.bookingsCount = (customer.bookingsCount || 0) + 1;
      await customer.save();
    }

    const count = await Booking.countDocuments();
    const bookingRef = `BK-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const numTotal = Number(totalAmount);
    const numPaid = Number(paidAmount);
    const numBalance = Math.max(0, numTotal - numPaid);
    const paymentStatus = numPaid >= numTotal ? "paid" : numPaid > 0 ? "partially_paid" : "unpaid";
    const travellersCount = Number(adults) + Number(children);

    const newBooking = await Booking.create({
      bookingRef,
      customerId: customer._id,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: customerPhone || "",
      packageName,
      departureDate: new Date(departureDate),
      returnDate: returnDate ? new Date(returnDate) : new Date(new Date(departureDate).getTime() + 5 * 24 * 60 * 60 * 1000),
      adults: Number(adults),
      children: Number(children),
      infants: 0,
      travellersCount,
      travellers: [
        {
          fullName: customerName,
          age: 30,
          gender: "other",
        },
      ],
      bookingSource: "crm",
      totalAmount: numTotal,
      discount: 0,
      taxAmount: Math.round(numTotal * 0.05),
      paidAmount: numPaid,
      balanceAmount: numBalance,
      paymentStatus,
      bookingStatus,
      specialRequirements: specialRequirements || "",
      assignedStaff: user.id,
    });

    // Auto-create invoice
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;
    await Invoice.create({
      invoiceNumber,
      bookingId: newBooking._id,
      bookingRef: newBooking.bookingRef,
      customerId: customer._id,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: customerPhone || "",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: `${packageName} for ${travellersCount} Guests`,
          quantity: 1,
          rate: numTotal - Math.round(numTotal * 0.05),
          amount: numTotal - Math.round(numTotal * 0.05),
        },
      ],
      subtotal: numTotal - Math.round(numTotal * 0.05),
      discount: 0,
      gstRate: 5,
      gstAmount: Math.round(numTotal * 0.05),
      totalAmount: numTotal,
      paidAmount: numPaid,
      balanceAmount: numBalance,
      status: paymentStatus,
    });

    return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/bookings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
