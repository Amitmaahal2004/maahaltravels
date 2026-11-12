import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import SystemSetting from "@/models/SystemSetting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const generalSetting = await SystemSetting.findOne({ key: "general_settings" });

    const defaultSettings = {
      agencyName: "Himalayan Vistas – Travel OS Enterprise",
      tagline: "Curated High-Altitude Himalayan Expeditions",
      supportEmail: "support@himalayanvistas.com",
      phone: "+91 98765 43210",
      address: "The Mall Road, Manali, Himachal Pradesh 175131",
      gstin: "02AAAAA0000A1Z5",
      currency: "INR",
      currencySymbol: "₹",
      defaultGstRate: 5,
      invoicePrefix: "INV",
      bookingPrefix: "BK",
      smtpEnabled: true,
    };

    return NextResponse.json({
      success: true,
      data: generalSetting ? generalSetting.value : defaultSettings,
    });
  } catch (error: any) {
    console.error("GET /api/crm/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const setting = await SystemSetting.findOneAndUpdate(
      { key: "general_settings" },
      {
        key: "general_settings",
        value: body,
        updatedBy: user._id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: setting.value });
  } catch (error: any) {
    console.error("PUT /api/crm/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
