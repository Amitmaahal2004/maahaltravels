import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import WebsiteContent from "@/models/WebsiteContent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "website_cms", "view");
    if (permError) return permError;

    await connectToDatabase();

    const contents = await WebsiteContent.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: contents,
    });
  } catch (error: any) {
    console.error("GET /api/crm/website_cms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch website content" },
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

    const permError = assertPermission(user, "website_cms", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const { key, title, subtitle, content, isPublished = true } = body;

    if (!key || !title) {
      return NextResponse.json(
        { success: false, error: "Key and title are required" },
        { status: 400 }
      );
    }

    const item = await WebsiteContent.findOneAndUpdate(
      { key },
      {
        key,
        title,
        subtitle: subtitle || "",
        content: content || "",
        isPublished: Boolean(isPublished),
        updatedBy: user.id as any,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("POST /api/crm/website_cms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save website content" },
      { status: 500 }
    );
  }
}
