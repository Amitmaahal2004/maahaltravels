import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Customer from "@/models/Customer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "customers", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const customerType = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (customerType && customerType !== "all") {
      query.customerType = customerType;
    }
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    const totalCustomers = await Customer.countDocuments();
    const vipCustomers = await Customer.countDocuments({ customerType: "vip" });
    const corporateCustomers = await Customer.countDocuments({ customerType: "corporate" });
    const totalSpentSum = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

    return NextResponse.json({
      success: true,
      data: customers,
      summary: {
        totalCustomers,
        vipCustomers,
        corporateCustomers,
        totalSpentSum,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
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

    const permError = assertPermission(user, "customers", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      email,
      phone,
      whatsapp,
      address,
      city,
      state,
      country,
      customerType,
      source,
      tags,
      notes,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Customer with this email already exists" },
        { status: 400 }
      );
    }

    const newCustomer = await Customer.create({
      name,
      email: email.toLowerCase(),
      phone,
      whatsapp: whatsapp || phone,
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "India",
      customerType: customerType || "individual",
      source: source || "website",
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      notes: notes || "",
      status: "active",
      totalSpent: 0,
      bookingsCount: 0,
      assignedTo: user.id,
    });

    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/customers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
