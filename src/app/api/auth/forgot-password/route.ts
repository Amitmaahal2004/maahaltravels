import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/services/auth.service";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await requestPasswordReset(
      parsed.data.email,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      // Provide token in non-production environments to facilitate rapid testing and review
      resetToken: process.env.NODE_ENV !== "production" ? result.rawToken : undefined,
    });
  } catch (error: any) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

