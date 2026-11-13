import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { getDashboardData } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await getDashboardData(user);
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
