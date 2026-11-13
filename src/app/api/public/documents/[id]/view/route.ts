import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PackageDocument from "@/models/PackageDocument";
import { getPdfBuffer } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let storageKey = id;
    let storageProvider = "gridfs";
    let fileName = "package-brochure.pdf";

    // 1. Try finding by PackageDocument _id
    try {
      const doc = await PackageDocument.findById(id);
      if (doc) {
        storageKey = doc.storageKey;
        storageProvider = doc.storageProvider;
        fileName = `${doc.displayName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      } else {
        // Try finding by storageKey
        const docByKey = await PackageDocument.findOne({ storageKey: id });
        if (docByKey) {
          storageKey = docByKey.storageKey;
          storageProvider = docByKey.storageProvider;
          fileName = `${docByKey.displayName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        }
      }
    } catch {
      // id might be a direct storage key
    }

    const buffer = await getPdfBuffer(storageKey, storageProvider);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[Public Document View] Error:", error);
    return NextResponse.json(
      { success: false, error: "Brochure document not found or unavailable" },
      { status: 404 }
    );
  }
}

