import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Department from "@/models/Department";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const departments = await Department.find(query).sort({ name: 1 });

    // Calculate staff count per department
    const staffCounts = await User.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const countMap = new Map();
    staffCounts.forEach((s) => {
      if (s._id) countMap.set(s._id.toString(), s.count);
    });

    const enrichedDepts = departments.map((d) => ({
      _id: d._id,
      name: d.name,
      code: d.code,
      description: d.description,
      isActive: d.isActive,
      staffCount: countMap.get(d._id.toString()) || 0,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedDepts,
    });
  } catch (error: any) {
    console.error("GET /api/crm/departments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch departments" },
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

    await connectToDatabase();
    const body = await req.json();

    const { name, code, description, isActive = true } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Department name and code are required" },
        { status: 400 }
      );
    }

    const newDept = await Department.create({
      name,
      code: code.toUpperCase().trim(),
      description: description || "",
      isActive: Boolean(isActive),
    });

    return NextResponse.json({ success: true, data: newDept }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/departments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create department" },
      { status: 500 }
    );
  }
}
