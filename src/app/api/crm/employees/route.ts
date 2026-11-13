import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import Role from "@/models/Role";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "employees", "view");
    if (permError) return permError;

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
      .populate("roleId", "name slug description isSystem permissions")
      .populate("departmentId", "name code isActive")
      .sort({ createdAt: -1 });

    const profiles = await EmployeeProfile.find().populate("departmentId", "name code isActive");
    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const enrichedEmployees = users.map((u) => {
      const p = profileMap.get(u._id.toString());
      const roleObj = u.roleId as any;
      const deptObj = (u.departmentId as any) || (p?.departmentId as any);

      return {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "N/A",
        status: u.status,
        role: roleObj
          ? {
              _id: roleObj._id?.toString(),
              name: roleObj.name,
              slug: roleObj.slug,
              isSystem: Boolean(roleObj.isSystem),
            }
          : { _id: "", name: "Unassigned", slug: "unassigned", isSystem: false },
        roleId: roleObj?._id ? roleObj._id.toString() : "",
        department: deptObj
          ? {
              _id: deptObj._id?.toString(),
              name: deptObj.name,
              code: deptObj.code,
              isActive: Boolean(deptObj.isActive),
            }
          : null,
        departmentId: deptObj?._id ? deptObj._id.toString() : "",
        employeeId: p ? p.employeeId : `EMP-${u._id.toString().slice(-4).toUpperCase()}`,
        designation: p ? p.designation : roleObj?.name || "Staff Specialist",
        employmentType: p ? p.employmentType : "full_time",
        salary: p ? p.salary : { basic: 35000, allowances: 5000, currency: "INR" },
        createdAt: u.createdAt,
      };
    });

    const totalStaff = users.length;
    const activeStaff = users.filter((u) => u.status === "active").length;

    // Fetch all active departments
    const departments = await Department.find().sort({ name: 1 });

    // Fetch all active and assignable roles from MongoDB
    const allRoles = await Role.find().sort({ isSystem: -1, name: 1 });
    const assignableRoles = allRoles.map((r) => ({
      _id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      description: r.description || "",
      isSystem: Boolean(r.isSystem),
      permissionsCount: Array.isArray(r.permissions) ? r.permissions.length : 0,
      isSuperAdminRole: r.slug === "super-admin",
    }));

    return NextResponse.json({
      success: true,
      data: enrichedEmployees,
      departments,
      roles: assignableRoles,
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

    const permError = assertPermission(user, "employees", "create");
    if (permError) return permError;

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

    // Mandatory name and email
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Employee full name is required." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Employee email address is required." },
        { status: 400 }
      );
    }

    // MANDATORY ROLE SELECTION: Must select an active role from MongoDB
    if (!roleId || typeof roleId !== "string" || !roleId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Role / Access Level is mandatory. Please select an active role for this employee.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Role identifier format." },
        { status: 400 }
      );
    }

    const selectedRole = await Role.findById(roleId);
    if (!selectedRole) {
      return NextResponse.json(
        { success: false, error: "The selected Role does not exist in the database." },
        { status: 404 }
      );
    }

    // Special Super Admin protection: Normal staff must not be given Super Admin accidentally
    if (selectedRole.slug === "super-admin") {
      if (user.role.slug !== "super-admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Only an existing Super Administrator can assign the Super Admin role.",
          },
          { status: 403 }
        );
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An employee with this email already exists." },
        { status: 400 }
      );
    }

    // Validate Department ObjectId if supplied
    let verifiedDepartmentId: mongoose.Types.ObjectId | undefined = undefined;
    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return NextResponse.json(
          { success: false, error: "Invalid Department identifier" },
          { status: 400 }
        );
      }

      const dept = await Department.findById(departmentId);
      if (!dept) {
        return NextResponse.json(
          { success: false, error: "The selected Department does not exist in the database." },
          { status: 404 }
        );
      }

      if (!dept.isActive) {
        return NextResponse.json(
          { success: false, error: `Department "${dept.name}" is inactive and cannot accept new employees.` },
          { status: 400 }
        );
      }

      verifiedDepartmentId = dept._id;
    }

    const hashedPassword = await bcrypt.hash(password || "Password@123", 12);
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      phone: phone?.trim() || "",
      roleId: selectedRole._id,
      departmentId: verifiedDepartmentId,
      status: "active",
    });

    const empCount = await EmployeeProfile.countDocuments();
    const employeeId = `EMP-${new Date().getFullYear()}-${String(empCount + 1).padStart(3, "0")}`;

    const profile = await EmployeeProfile.create({
      userId: newUser._id,
      employeeId,
      designation: designation?.trim() || selectedRole.name,
      departmentId: verifiedDepartmentId || undefined,
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

    return NextResponse.json(
      {
        success: true,
        message: `Employee registered successfully with ${selectedRole.name} access level.`,
        data: {
          _id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          employeeId: profile.employeeId,
          role: {
            _id: selectedRole._id.toString(),
            name: selectedRole.name,
            slug: selectedRole.slug,
          },
          departmentId: verifiedDepartmentId ? verifiedDepartmentId.toString() : "",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/crm/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
