import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "destinations", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";

    const query: any = {};
    if (state && state !== "all") query.state = state;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const destinations = await Destination.find(query).sort({ createdAt: -1 });

    const totalDestinations = await Destination.countDocuments();
    const publishedCount = await Destination.countDocuments({ status: "published" });
    const featuredCount = await Destination.countDocuments({ isFeatured: true });

    return NextResponse.json({
      success: true,
      data: destinations,
      summary: {
        totalDestinations,
        publishedCount,
        featuredCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/destinations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch destinations" },
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

    const permError = assertPermission(user, "destinations", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      state,
      country = "India",
      city,
      description,
      bestTimeToVisit,
      weather,
      attractions,
      status = "published",
      isFeatured = false,
    } = body;

    if (!name || !state || !description) {
      return NextResponse.json(
        { success: false, error: "Destination name, state, and description are required" },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newDest = await Destination.create({
      name,
      slug,
      state,
      country,
      city: city || name,
      description,
      bestTimeToVisit: bestTimeToVisit || "April to October",
      weather: weather || "Cool alpine climate with clear skies",
      attractions: Array.isArray(attractions) ? attractions : typeof attractions === "string" ? attractions.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      status,
      isFeatured: Boolean(isFeatured),
      gallery: [],
    });

    return NextResponse.json({ success: true, data: newDest }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/destinations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create destination" },
      { status: 500 }
    );
  }
}
