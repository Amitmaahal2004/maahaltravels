import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "vendors", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const query: any = {};
    if (type && type !== "all") query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });

    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({ status: "active" });
    const totalOwed = vendors.reduce((acc, v) => acc + (v.balanceOwed || 0), 0);

    return NextResponse.json({
      success: true,
      data: vendors,
      summary: {
        totalVendors,
        activeVendors,
        totalOwed,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/vendors error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vendors" },
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

    const permError = assertPermission(user, "vendors", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      type = "hotel",
      contactPerson,
      phone,
      email,
      city,
      state,
      services,
      balanceOwed = 0,
      bankAccount,
      bankIfsc,
      bankName,
      status = "active",
      notes,
    } = body;

    if (!name || !contactPerson || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, contact person, and phone are required" },
        { status: 400 }
      );
    }

    const newVendor = await Vendor.create({
      name,
      type,
      contactPerson,
      phone,
      email: email ? email.toLowerCase() : undefined,
      city: city || "",
      state: state || "",
      services: Array.isArray(services) ? services : typeof services === "string" ? services.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      bankDetails: {
        accountNumber: bankAccount || "",
        ifsc: bankIfsc || "",
        bankName: bankName || "",
      },
      balanceOwed: Number(balanceOwed) || 0,
      status,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: newVendor }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/vendors error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vendor" },
      { status: 500 }
    );
  }
}
