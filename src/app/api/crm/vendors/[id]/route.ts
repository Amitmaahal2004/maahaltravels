import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

export const dynamic = "force-dynamic";

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

    if (body.services && typeof body.services === "string") {
      body.services = body.services.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const updated = await Vendor.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/vendors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vendor" },
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

    const deleted = await Vendor.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/vendors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
