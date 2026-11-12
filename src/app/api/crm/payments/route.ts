import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import Invoice from "@/models/Invoice";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const method = searchParams.get("method") || "";

    const query: any = {};
    if (method && method !== "all") query.paymentMethod = method;
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: "i" } },
        { bookingRef: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { transactionRef: { $regex: search, $options: "i" } },
      ];
    }

    const payments = await Payment.find(query).sort({ paymentDate: -1 });

    const totalTransactions = await Payment.countDocuments();
    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const upiCollected = payments.filter((p) => p.paymentMethod === "upi").reduce((acc, p) => acc + (p.amount || 0), 0);
    const bankTransferCollected = payments.filter((p) => p.paymentMethod === "bank_transfer").reduce((acc, p) => acc + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: payments,
      summary: {
        totalTransactions,
        totalCollected,
        upiCollected,
        bankTransferCollected,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/payments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
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

    await connectToDatabase();
    const body = await req.json();

    const {
      bookingRef,
      customerName,
      amount,
      paymentMethod = "upi",
      transactionRef,
      notes,
    } = body;

    if (!bookingRef || !amount || !customerName) {
      return NextResponse.json(
        { success: false, error: "Booking reference, customer name, and amount are required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findOne({ bookingRef: bookingRef.trim().toUpperCase() });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: `Booking ${bookingRef} not found in database` },
        { status: 404 }
      );
    }

    const count = await Payment.countDocuments();
    const paymentId = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const numAmount = Number(amount);

    const newPayment = await Payment.create({
      paymentId,
      bookingId: booking._id,
      bookingRef: booking.bookingRef,
      customerId: booking.customerId,
      customerName,
      amount: numAmount,
      paymentMethod,
      transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date(),
      status: "completed",
      recordedBy: user.id,
      notes: notes || "",
    });

    // Automatically update Booking balances
    const newPaidAmount = (booking.paidAmount || 0) + numAmount;
    const newBalanceAmount = Math.max(0, (booking.totalAmount || 0) - newPaidAmount);
    booking.paidAmount = newPaidAmount;
    booking.balanceAmount = newBalanceAmount;
    booking.paymentStatus = newPaidAmount >= booking.totalAmount ? "paid" : "partially_paid";
    await booking.save();

    // Automatically update linked Invoice if exists
    await Invoice.findOneAndUpdate(
      { bookingId: booking._id },
      {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newPaidAmount >= booking.totalAmount ? "paid" : "partially_paid",
      }
    );

    return NextResponse.json({ success: true, data: newPayment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/payments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
