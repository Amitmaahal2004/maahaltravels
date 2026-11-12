import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

function isDatabaseError(err: any): boolean {
  if (!err) return false;
  const name = err.name || "";
  const msg = err.message || "";
  return (
    name === "MongooseServerSelectionError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    name === "MongoTopologyClosedError" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("timed out") ||
    msg.includes("connection string") ||
    msg.includes("MONGODB_URI") ||
    msg.includes("buffering timed out")
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON in request body." },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const result = await loginUser(
      parsed.data.email,
      parsed.data.password,
      ipAddress,
      userAgent
    );

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid credentials." },
        { status: 401 }
      );
    }

    // Set HttpOnly session cookie
    await setSessionCookie(result.token);

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        message: "Login successful",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Login API] Error occurred during login:", error.message || error);

    if (isDatabaseError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "Database service unavailable. Please ensure MongoDB is reachable.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during login. Please try again.",
      },
      { status: 500 }
    );
  }
}
