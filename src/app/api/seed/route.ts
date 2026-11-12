import { NextRequest, NextResponse } from "next/server";
import { runSeed } from "../../../../scripts/seed";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const existingUsers = await User.countDocuments();

    // If users already exist, only allow if secret matches or if requested by superadmin
    if (existingUsers > 0) {
      const authHeader = req.headers.get("authorization");
      const secret = process.env.AUTH_SECRET;
      if (!authHeader || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json(
          { success: false, error: "Database already initialized. Authorization required." },
          { status: 403 }
        );
      }
    }

    const result = await runSeed({ silent: true });
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully.",
      superAdminEmail: result.superAdminEmail,
    });
  } catch (error: any) {
    console.error("[Seed API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Database initialization failed." },
      { status: 500 }
    );
  }
}

