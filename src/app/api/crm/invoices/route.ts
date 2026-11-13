import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "invoices", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { bookingRef: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    const totalInvoices = await Invoice.countDocuments();
    const paidCount = await Invoice.countDocuments({ status: "paid" });
    const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: invoices,
      summary: {
        totalInvoices,
        paidCount,
        totalBilled,
        totalPaid,
        totalOutstanding,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoices" },
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

    const permError = assertPermission(user, "invoices", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      bookingRef,
      customerName,
      customerEmail,
      customerPhone,
      items,
      discount = 0,
      gstRate = 5,
      notes,
    } = body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer details and invoice items are required" },
        { status: 400 }
      );
    }

    let bookingId = undefined;
    if (bookingRef) {
      const b = await Booking.findOne({ bookingRef: bookingRef.trim().toUpperCase() });
      if (b) bookingId = b._id;
    }

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const parsedItems = items.map((i: any) => ({
      description: i.description,
      quantity: Number(i.quantity) || 1,
      rate: Number(i.rate) || 0,
      amount: (Number(i.quantity) || 1) * (Number(i.rate) || 0),
    }));

    const calcSubtotal = parsedItems.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const calcDiscount = Number(discount) || 0;
    const taxable = Math.max(0, calcSubtotal - calcDiscount);
    const gstAmount = Math.round((taxable * Number(gstRate)) / 100);
    const totalAmount = taxable + gstAmount;

    const newInvoice = await Invoice.create({
      invoiceNumber,
      bookingId: bookingId || user.id, // fallback if manual
      bookingRef: bookingRef ? bookingRef.toUpperCase() : `DIRECT-${Date.now().toString().slice(-4)}`,
      customerId: user.id, // fallback
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: customerPhone || "",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: parsedItems,
      subtotal: calcSubtotal,
      discount: calcDiscount,
      gstRate: Number(gstRate),
      gstAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: "unpaid",
      notes: notes || "Payment due within 7 days. Thank you for traveling with us.",
    });

    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
