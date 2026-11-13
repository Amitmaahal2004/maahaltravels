import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";
import PackageDocument from "@/models/PackageDocument";
import { uploadPdfBuffer } from "@/lib/storage";
import { generatePackageBrochurePdf } from "@/services/brochure-generator.service";

export const dynamic = "force-dynamic";

export async function POST(
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

    const pkg = await Package.findById(params.id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const {
      templateTheme = "modern_luxe",
      contactPhone,
      contactEmail,
      customNotes,
    } = body;

    // Generate real vector PDF brochure
    const pdfBuffer = await generatePackageBrochurePdf(pkg, {
      templateTheme,
      contactPhone,
      contactEmail,
      customNotes,
    });

    const fileName = `${pkg.code || "PKG"}_Official_Brochure.pdf`;
    const displayName = `${pkg.name} – Official Brochure`;

    // Upload to persistent cloud storage
    const uploadResult = await uploadPdfBuffer(pdfBuffer, fileName, {
      packageId: params.id,
      version: 1,
    });

    // Set as primary brochure if no primary exists
    const hasPrimary = await PackageDocument.exists({
      packageId: params.id,
      isPrimary: true,
      isActive: true,
    });

    const isPrimary = !hasPrimary;

    // Create document record
    const doc = await PackageDocument.create({
      packageId: params.id,
      displayName,
      originalFileName: fileName,
      description: `Generated from ${templateTheme.replace("_", " ")} template with package itinerary and pricing`,
      category: "main_brochure",
      storageProvider: uploadResult.storageProvider,
      storageKey: uploadResult.storageKey,
      fileUrl: uploadResult.fileUrl,
      fileSize: uploadResult.fileSize,
      mimeType: "application/pdf",
      version: 1,
      isPrimary,
      isActive: true,
      uploadedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      uploadedAt: new Date(),
      versions: [
        {
          versionNumber: 1,
          storageKey: uploadResult.storageKey,
          storageProvider: uploadResult.storageProvider,
          fileUrl: uploadResult.fileUrl,
          fileSize: uploadResult.fileSize,
          changeDescription: "Generated from package template",
          modifiedBy: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          modifiedAt: new Date(),
        },
      ],
      activityLogs: [
        {
          action: "generate",
          performedBy: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          details: `Generated official brochure from package itinerary (${(uploadResult.fileSize / 1024).toFixed(1)} KB)`,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: doc,
      message: "Official package brochure generated successfully!",
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/packages/[id]/documents/generate-template error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate brochure PDF" },
      { status: 500 }
    );
  }
}

