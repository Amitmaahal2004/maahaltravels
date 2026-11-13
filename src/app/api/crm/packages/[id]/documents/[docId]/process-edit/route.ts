import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import PackageDocument from "@/models/PackageDocument";
import { getPdfBuffer, uploadPdfBuffer } from "@/lib/storage";
import { applyPdfEdits, PdfEditPayload } from "@/services/pdf-editor.service";

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
    const { editPayload, changeDescription, saveAsNewVersion = true }: {
      editPayload: PdfEditPayload;
      changeDescription?: string;
      saveAsNewVersion?: boolean;
    } = body;

    if (!editPayload) {
      return NextResponse.json({ success: false, error: "Missing edit instructions" }, { status: 400 });
    }

    // Retrieve original PDF binary from storage
    const currentPdfBuffer = await getPdfBuffer(doc.storageKey, doc.storageProvider);

    // Apply full vector edits
    const modifiedPdfBuffer = await applyPdfEdits(currentPdfBuffer, editPayload);

    // Calculate versioning
    const nextVersion = saveAsNewVersion ? doc.version + 1 : doc.version;
    const versionFileName = `${doc.displayName.replace(/[^a-zA-Z0-9_-]/g, "_")}_v${nextVersion}.pdf`;

    // Upload to persistent storage
    const uploadResult = await uploadPdfBuffer(modifiedPdfBuffer, versionFileName, {
      packageId: params.id,
      documentId: doc._id.toString(),
      version: nextVersion,
    });

    // Update document record
    doc.storageKey = uploadResult.storageKey;
    doc.storageProvider = uploadResult.storageProvider;
    doc.fileUrl = uploadResult.fileUrl;
    doc.fileSize = uploadResult.fileSize;
    doc.version = nextVersion;

    const desc = changeDescription || (saveAsNewVersion ? `Updated brochure version ${nextVersion}` : "Edited in PDF Studio");

    doc.versions.push({
      versionNumber: nextVersion,
      storageKey: uploadResult.storageKey,
      storageProvider: uploadResult.storageProvider,
      fileUrl: uploadResult.fileUrl,
      fileSize: uploadResult.fileSize,
      changeDescription: desc,
      modifiedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      modifiedAt: new Date(),
    });

    doc.activityLogs.push({
      action: saveAsNewVersion ? "new_version" : "edit",
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details: `${desc} (v${nextVersion})`,
      timestamp: new Date(),
    });

    await doc.save();

    return NextResponse.json({
      success: true,
      data: doc,
      message: `Document saved successfully as version ${nextVersion}`,
    });
  } catch (error: any) {
    console.error("POST /api/crm/packages/[id]/documents/[docId]/process-edit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process PDF edits" },
      { status: 500 }
    );
  }
}

