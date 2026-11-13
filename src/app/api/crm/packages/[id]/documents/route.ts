import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";
import PackageDocument from "@/models/PackageDocument";
import { uploadPdfBuffer } from "@/lib/storage";

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

    const documents = await PackageDocument.find({
      packageId: params.id,
      isActive: true,
    }).sort({ isPrimary: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    console.error("GET /api/crm/packages/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch package documents" },
      { status: 500 }
    );
  }
}

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

    // Verify package exists
    const pkg = await Package.findById(params.id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer;
    let originalFileName = "brochure.pdf";
    let displayName = "Tour Brochure";
    let description = "";
    let category = "main_brochure";
    let isPrimary = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No PDF file uploaded" }, { status: 400 });
      }

      // Validation
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        return NextResponse.json(
          { success: false, error: "Invalid file format. Only PDF files are allowed." },
          { status: 400 }
        );
      }

      // Max 25 MB
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File exceeds maximum permitted size of 25MB" },
          { status: 400 }
        );
      }

      originalFileName = file.name;
      displayName = (formData.get("displayName") as string) || file.name.replace(/\.pdf$/i, "");
      description = (formData.get("description") as string) || "";
      category = (formData.get("category") as string) || "main_brochure";
      isPrimary = formData.get("isPrimary") === "true";

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // JSON with Base64 payload
      const body = await req.json();
      if (!body.fileBase64) {
        return NextResponse.json({ success: false, error: "Missing file payload" }, { status: 400 });
      }

      originalFileName = body.originalFileName || "brochure.pdf";
      if (!originalFileName.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: "Invalid file format. Only PDF files are allowed." },
          { status: 400 }
        );
      }

      displayName = body.displayName || originalFileName.replace(/\.pdf$/i, "");
      description = body.description || "";
      category = body.category || "main_brochure";
      isPrimary = Boolean(body.isPrimary);

      const cleanBase64 = body.fileBase64.replace(/^data:application\/pdf;base64,/, "");
      buffer = Buffer.from(cleanBase64, "base64");

      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File exceeds maximum permitted size of 25MB" },
          { status: 400 }
        );
      }
    }

    // Upload to persistent storage
    const uploadResult = await uploadPdfBuffer(buffer, originalFileName, {
      packageId: params.id,
      version: 1,
    });

    // If marked primary or first document, manage primary flag
    const existingCount = await PackageDocument.countDocuments({ packageId: params.id, isActive: true });
    if (existingCount === 0) {
      isPrimary = true;
    } else if (isPrimary) {
      await PackageDocument.updateMany({ packageId: params.id }, { isPrimary: false });
    }

    // Create PackageDocument in MongoDB
    const doc = await PackageDocument.create({
      packageId: params.id,
      displayName,
      originalFileName,
      description,
      category: (category as any) || "main_brochure",
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
          changeDescription: "Initial brochure upload",
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
          action: "upload",
          performedBy: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          details: `Uploaded ${displayName} (${(uploadResult.fileSize / 1024).toFixed(1)} KB)`,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/packages/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

