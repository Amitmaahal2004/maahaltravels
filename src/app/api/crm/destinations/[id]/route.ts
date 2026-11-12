import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Destination from "@/models/Destination";

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

    const dest = await Destination.findById(params.id);
    if (!dest) {
      return NextResponse.json({ success: false, error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dest });
  } catch (error: any) {
    console.error("GET /api/crm/destinations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch destination" },
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

    if (body.attractions && typeof body.attractions === "string") {
      body.attractions = body.attractions.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const updated = await Destination.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/destinations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update destination" },
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

    const deleted = await Destination.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Destination deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/destinations/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete destination" },
      { status: 500 }
    );
  }
}
