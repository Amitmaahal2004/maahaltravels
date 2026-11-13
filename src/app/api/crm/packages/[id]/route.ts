import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

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

    const permError = assertPermission(user, "packages", "view");
    if (permError) return permError;

    await connectToDatabase();

    const pkg = await Package.findById(params.id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pkg });
  } catch (error: any) {
    console.error("GET /api/crm/packages/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch package" },
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

    const permError = assertPermission(user, "packages", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    if (body.inclusions && typeof body.inclusions === "string") {
      body.inclusions = body.inclusions.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (body.exclusions && typeof body.exclusions === "string") {
      body.exclusions = body.exclusions.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const updated = await Package.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/crm/packages/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update package" },
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

    const permError = assertPermission(user, "packages", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const deleted = await Package.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Package deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/packages/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete package" },
      { status: 500 }
    );
  }
}
