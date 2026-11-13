import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import PackageDocument from "@/models/PackageDocument";
import Package from "@/models/Package";

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

    const permError = assertPermission(user, "packages", "view");
    if (permError) return permError;

    await connectToDatabase();

    const [pkg, doc] = await Promise.all([
      Package.findById(params.id),
      PackageDocument.findOne({ _id: params.docId, packageId: params.id, isActive: true }),
    ]);

    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }
    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      customerName = "Valued Traveler",
      phoneNumber = "",
      customMessage = "",
      sendViaCloudApi = false,
    } = body;

    // Clean phone number (keep only digits)
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`; // Default India country code
    }

    // Resolve public document URL
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const publicUrl = doc.fileUrl.startsWith("http")
      ? doc.fileUrl
      : `${appUrl}/api/public/documents/${doc._id}/view`;

    // Construct professional travel message if not provided
    const message = customMessage || [
      `Hello ${customerName}! 👋`,
      ``,
      `Thank you for your interest in our *${pkg.name}* (${pkg.destination})!`,
      ``,
      `Please find our official, detailed tour package brochure attached below:`,
      `📄 *${doc.displayName}* (v${doc.version})`,
      `🔗 ${publicUrl}`,
      ``,
      `This brochure includes complete day-wise itineraries, inclusions, hotel stays, and all-inclusive pricing.`,
      ``,
      `Please review and feel free to message or call us anytime for dates or customization.`,
      ``,
      `Warm Regards,`,
      `*Explore My Packages*`,
      `Travel OS Enterprise`,
    ].join("\n");

    let cloudApiSuccess = false;
    let cloudApiError = null;

    // Mode 2: WhatsApp Cloud API (if configured and requested)
    const cloudToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (sendViaCloudApi && cloudToken && phoneId && cleanPhone) {
      try {
        const cloudRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cloudToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "document",
            document: {
              link: publicUrl,
              caption: message.slice(0, 1000),
              filename: `${doc.displayName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`,
            },
          }),
        });

        if (cloudRes.ok) {
          cloudApiSuccess = true;
        } else {
          cloudApiError = await cloudRes.text();
          console.warn("[WhatsApp Cloud API] Response error:", cloudApiError);
        }
      } catch (apiErr: any) {
        cloudApiError = apiErr.message;
        console.warn("[WhatsApp Cloud API] Error:", apiErr);
      }
    }

    // Standard Mode 1 click-to-chat URL
    const encodedMessage = encodeURIComponent(message);
    const waLink = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    // Update document statistics & audit log
    doc.shareCount = (doc.shareCount || 0) + 1;
    doc.lastSharedAt = new Date();
    doc.activityLogs.push({
      action: "share",
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details: `Shared with ${customerName} (${cleanPhone || "Web link"})${cloudApiSuccess ? " via WhatsApp Cloud API" : " via WhatsApp Web"}`,
      timestamp: new Date(),
    });
    await doc.save();

    return NextResponse.json({
      success: true,
      data: {
        shareUrl: waLink,
        message,
        customerName,
        phoneNumber: cleanPhone,
        cloudApiConfigured: Boolean(cloudToken && phoneId),
        cloudApiSuccess,
        cloudApiError,
      },
    });
  } catch (error: any) {
    console.error("POST /api/crm/packages/[id]/documents/[docId]/share-whatsapp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate WhatsApp share" },
      { status: 500 }
    );
  }
}

