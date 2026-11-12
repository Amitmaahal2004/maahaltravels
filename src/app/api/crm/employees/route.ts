import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import Role from "@/models/Role";
import bcrypt from "bcryptjs";

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
    const status = searchParams.get("status") || "";

    const userQuery: any = {};
    if (status && status !== "all") userQuery.status = status;
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(userQuery)
      .populate("role", "name slug")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    const profiles = await EmployeeProfile.find();
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const enrichedEmployees = users.map((u) => {
      const p = profileMap.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || "N/A",
        status: u.status,
        role: u.role,
        department: u.department,
        employeeId: p ? p.employeeId : `EMP-${u._id.toString().slice(-4).toUpperCase()}`,
        designation: p ? p.designation : (u.role as any)?.name || "Staff Specialist",
        employmentType: p ? p.employmentType : "full_time",
        salary: p ? p.salary : { basic: 35000, allowances: 5000, currency: "INR" },
        createdAt: u.createdAt,
      };
    });

    const totalStaff = users.length;
    const activeStaff = users.filter((u) => u.status === "active").length;
    const departments = await Department.find({ isActive: true });

    return NextResponse.json({
      success: true,
      data: enrichedEmployees,
      departments,
      summary: {
        totalStaff,
        activeStaff,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch employees" },
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

    const {
      name,
      email,
      phone,
      password = "Password@123",
      designation = "Travel Consultant",
      departmentId,
      roleId,
      basicSalary = 35000,
      employmentType = "full_time",
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    let assignedRole = roleId;
    if (!assignedRole) {
      const defaultRole = await Role.findOne({ slug: "tour-operator" }) || await Role.findOne();
      assignedRole = defaultRole?._id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || "",
      role: assignedRole,
      department: departmentId || undefined,
      status: "active",
    });

    const empCount = await EmployeeProfile.countDocuments();
    const employeeId = `EMP-${new Date().getFullYear()}-${String(empCount + 1).padStart(3, "0")}`;

    await EmployeeProfile.create({
      userId: newUser._id,
      employeeId,
      designation,
      departmentId: departmentId || undefined,
      joiningDate: new Date(),
      employmentType,
      salary: {
        basic: Number(basicSalary),
        allowances: Math.round(Number(basicSalary) * 0.15),
        currency: "INR",
      },
      documents: [],
      status: "active",
    });

    return NextResponse.json({ success: true, message: "Employee registered successfully", data: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
