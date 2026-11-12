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
    const activeOnly = searchParams.get("activeOnly") === "true" || searchParams.get("active") === "true";

    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const departments = await Department.find(query).sort({ name: 1 });

    // Calculate staff count per department by aggregating User.departmentId
    const staffCounts = await User.aggregate([
      { $match: { departmentId: { $exists: true, $ne: null } } },
      { $group: { _id: "$departmentId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    staffCounts.forEach((s) => {
      if (s._id) countMap.set(s._id.toString(), s.count);
    });

    const enrichedDepts = departments.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      code: d.code,
      description: d.description || "",
      isActive: Boolean(d.isActive),
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

    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    // Check duplicate code or name
    const existing = await Department.findOne({
      $or: [
        { code: cleanCode },
        { name: { $regex: `^${cleanName}$`, $options: "i" } },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A department with this name or code already exists" },
        { status: 400 }
      );
    }

    const newDept = await Department.create({
      name: cleanName,
      code: cleanCode,
      description: description ? description.trim() : "",
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
