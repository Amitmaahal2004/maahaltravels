import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import PackageDocument from "@/models/PackageDocument";

export const dynamic = "force-dynamic";

export async function POST(
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
      isActive: true,
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const { targetVersion } = body;

    const historicalVersion = doc.versions.find((v) => v.versionNumber === Number(targetVersion));
    if (!historicalVersion) {
      return NextResponse.json(
        { success: false, error: `Version ${targetVersion} not found in document history` },
        { status: 404 }
      );
    }

    const nextVersion = doc.version + 1;

    // Apply historical storage pointers
    doc.storageKey = historicalVersion.storageKey;
    doc.storageProvider = historicalVersion.storageProvider;
    doc.fileUrl = historicalVersion.fileUrl;
    doc.fileSize = historicalVersion.fileSize;
    doc.version = nextVersion;

    doc.versions.push({
      versionNumber: nextVersion,
      storageKey: historicalVersion.storageKey,
      storageProvider: historicalVersion.storageProvider,
      fileUrl: historicalVersion.fileUrl,
      fileSize: historicalVersion.fileSize,
      changeDescription: `Restored from version ${targetVersion}`,
      modifiedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      modifiedAt: new Date(),
    });

    doc.activityLogs.push({
      action: "restore",
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details: `Restored active document to Version ${targetVersion}`,
      timestamp: new Date(),
    });

    await doc.save();

    return NextResponse.json({
      success: true,
      data: doc,
      message: `Successfully restored version ${targetVersion} as version ${nextVersion}`,
    });
  } catch (error: any) {
    console.error("POST /api/crm/packages/[id]/documents/[docId]/restore error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to restore document version" },
      { status: 500 }
    );
  }
}

