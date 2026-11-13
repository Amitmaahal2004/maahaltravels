import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import PackageDocument from "@/models/PackageDocument";
import { deletePdfFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "packages", "view");
    if (permError) return permError;

    await connectToDatabase();

    const doc = await PackageDocument.findOne({
      _id: params.docId,
      packageId: params.id,
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error("GET /api/crm/packages/[id]/documents/[docId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "packages", "edit");
    if (permError) return permError;

    await connectToDatabase();

    const doc = await PackageDocument.findOne({
      _id: params.docId,
      packageId: params.id,
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const { displayName, description, category, isPrimary } = body;

    if (displayName) doc.displayName = displayName;
    if (description !== undefined) doc.description = description;
    if (category) doc.category = category;

    if (isPrimary && !doc.isPrimary) {
      await PackageDocument.updateMany(
        { packageId: params.id, _id: { $ne: doc._id } },
        { isPrimary: false }
      );
      doc.isPrimary = true;
    } else if (isPrimary === false) {
      doc.isPrimary = false;
    }

    doc.activityLogs.push({
      action: "edit",
      performedBy: { id: user.id, name: user.name, email: user.email },
      details: "Updated document metadata / category",
      timestamp: new Date(),
    });

    await doc.save();

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error("PUT /api/crm/packages/[id]/documents/[docId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "packages", "delete");
    if (permError) return permError;

    await connectToDatabase();

    const doc = await PackageDocument.findOne({
      _id: params.docId,
      packageId: params.id,
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    // Soft delete to protect audit trail and version history, or hard delete
    doc.isActive = false;
    doc.activityLogs.push({
      action: "delete",
      performedBy: { id: user.id, name: user.name, email: user.email },
      details: `Document deleted by ${user.name}`,
      timestamp: new Date(),
    });
    await doc.save();

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/crm/packages/[id]/documents/[docId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}

