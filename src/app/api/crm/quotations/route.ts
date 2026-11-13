import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Quotation from "@/models/Quotation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "quotations", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { packageName: { $regex: search, $options: "i" } },
      ];
    }

    const quotations = await Quotation.find(query).sort({ createdAt: -1 });

    const totalQuotations = await Quotation.countDocuments();
    const acceptedCount = await Quotation.countDocuments({ status: "accepted" });
    const pendingCount = await Quotation.countDocuments({ status: { $in: ["draft", "sent", "viewed"] } });
    const totalQuotedValue = quotations.reduce((acc, q) => acc + (q.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: quotations,
      summary: {
        totalQuotations,
        acceptedCount,
        pendingCount,
        totalQuotedValue,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/quotations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quotations" },
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

    const permError = assertPermission(user, "quotations", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      packageId,
      packageName,
      destination,
      departureDate,
      durationDays,
      travellersCount,
      lineItems,
      discount = 0,
      gstRate = 5,
      validUntil,
      notes,
      terms,
    } = body;

    if (!customerName || !customerEmail || !destination) {
      return NextResponse.json(
        { success: false, error: "Customer details and destination are required" },
        { status: 400 }
      );
    }

    // Auto-calculate line items
    const parsedItems = Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems.map((item: any) => ({
          description: item.description || "Tour Service",
          quantity: Number(item.quantity) || 1,
          rate: Number(item.rate) || 0,
          total: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
        }))
      : [
          {
            description: `${destination} Tour Package (${travellersCount || 2} Pax)`,
            quantity: 1,
            rate: 50000,
            total: 50000,
          },
        ];

    const subtotal = parsedItems.reduce((acc: number, curr: any) => acc + curr.total, 0);
    const calculatedDiscount = Number(discount) || 0;
    const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
    const gstAmount = Math.round((taxableAmount * Number(gstRate)) / 100);
    const totalAmount = taxableAmount + gstAmount;

    // Generate Unique Quotation Number
    const count = await Quotation.countDocuments();
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const newQuotation = await Quotation.create({
      quotationNumber,
      customerId: customerId || undefined,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: customerPhone || "",
      packageId: packageId || undefined,
      packageName: packageName || `${destination} Custom Tour`,
      destination,
      departureDate: departureDate ? new Date(departureDate) : undefined,
      durationDays: Number(durationDays) || 5,
      travellersCount: Number(travellersCount) || 2,
      lineItems: parsedItems,
      subtotal,
      discount: calculatedDiscount,
      gstRate: Number(gstRate),
      gstAmount,
      totalAmount,
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "draft",
      notes: notes || "Valid for 14 days from issue date.",
      terms: terms || "Standard cancellation and refund policy applies.",
      createdBy: user.id as any,
    });

    return NextResponse.json({ success: true, data: newQuotation }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/quotations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create quotation" },
      { status: 500 }
    );
  }
}
