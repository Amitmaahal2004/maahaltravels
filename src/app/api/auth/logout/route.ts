import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionTokenFromCookies } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/guard";
import { logoutUser } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const rawToken = await getSessionTokenFromCookies();
    const user = await getCurrentUser();

    if (rawToken) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "unknown";
      await logoutUser(rawToken, user || undefined, ipAddress, userAgent);
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("[Logout API] Error:", error);
    await clearSessionCookie();
    return NextResponse.json(
      { success: true, message: "Logged out successfully" }
    );
  }
}

