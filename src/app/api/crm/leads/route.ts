import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Lead from "@/models/Lead";

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
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: "new" });
    const convertedLeads = await Lead.countDocuments({ status: "converted" });
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: leads,
      summary: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leads" },
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
      name,
      email,
      phone,
      whatsapp,
      destination,
      travelDate,
      travellersCount,
      budget,
      leadSource,
      priority,
      status,
      notes,
    } = body;

    if (!name || !email || !phone || !destination) {
      return NextResponse.json(
        { success: false, error: "Name, email, phone, and destination are required" },
        { status: 400 }
      );
    }

    const newLead = await Lead.create({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      destination,
      travelDate: travelDate ? new Date(travelDate) : undefined,
      travellersCount: Number(travellersCount) || 2,
      budget: budget ? Number(budget) : undefined,
      leadSource: leadSource || "website",
      priority: priority || "medium",
      status: status || "new",
      notes: notes || "",
      assignedTo: user.id,
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}
