import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

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
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};
    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const packages = await Package.find(query).sort({ createdAt: -1 });

    const totalPackages = await Package.countDocuments();
    const publishedCount = await Package.countDocuments({ status: "published" });
    const draftCount = await Package.countDocuments({ status: "draft" });

    return NextResponse.json({
      success: true,
      data: packages,
      summary: {
        totalPackages,
        publishedCount,
        draftCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/packages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch packages" },
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
      destination,
      durationDays = 5,
      durationNights = 4,
      startingPrice,
      sellingPrice,
      internalCost,
      category = "Himalayan Treks",
      difficulty = "moderate",
      shortDescription,
      inclusions,
      exclusions,
      isFeatured = false,
      status = "published",
    } = body;

    if (!name || !destination || !startingPrice || !sellingPrice) {
      return NextResponse.json(
        { success: false, error: "Name, destination, and prices are required" },
        { status: 400 }
      );
    }

    // Auto slug and unique code
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
    const count = await Package.countDocuments();
    const code = `PKG-${String(count + 1).padStart(3, "0")}`;

    const newPkg = await Package.create({
      name,
      slug,
      code,
      destination,
      durationDays: Number(durationDays),
      durationNights: Number(durationNights),
      startingPrice: Number(startingPrice),
      sellingPrice: Number(sellingPrice),
      internalCost: Number(internalCost || startingPrice * 0.7),
      category,
      difficulty,
      shortDescription: shortDescription || `${durationDays} Days / ${durationNights} Nights tour in ${destination}`,
      inclusions: Array.isArray(inclusions) ? inclusions : typeof inclusions === "string" ? inclusions.split(",").map((s: string) => s.trim()).filter(Boolean) : ["Hotel Stays", "Daily Breakfast", "Sightseeing Cab"],
      exclusions: Array.isArray(exclusions) ? exclusions : typeof exclusions === "string" ? exclusions.split(",").map((s: string) => s.trim()).filter(Boolean) : ["Flights", "Personal Expenses"],
      gallery: [],
      itinerary: [
        { day: 1, title: `Arrival in ${destination}`, description: "Check in, welcome tea, evening walk around local market." },
        { day: 2, title: "Scenic Sightseeing & Exploration", description: "Full day excursion to key viewpoint and cultural sites." },
      ],
      status,
      isFeatured: Boolean(isFeatured),
    });

    return NextResponse.json({ success: true, data: newPkg }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/packages error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create package" },
      { status: 500 }
    );
  }
}
