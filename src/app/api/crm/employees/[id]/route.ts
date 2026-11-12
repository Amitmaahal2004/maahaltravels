import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const { name, phone, status, designation, departmentId, basicSalary, employmentType } = body;

    const userObj = await User.findById(params.id);
    if (!userObj) {
      return NextResponse.json({ success: false, error: "Employee user not found" }, { status: 404 });
    }

    // Validate Department if provided
    let verifiedDeptId: mongoose.Types.ObjectId | null = null;
    if (departmentId !== undefined) {
      if (departmentId && departmentId !== "") {
        if (!mongoose.Types.ObjectId.isValid(departmentId)) {
          return NextResponse.json({ success: false, error: "Invalid Department identifier" }, { status: 400 });
        }
        const dept = await Department.findById(departmentId);
        if (!dept) {
          return NextResponse.json({ success: false, error: "Department not found in database" }, { status: 404 });
        }
        verifiedDeptId = dept._id;
      }
    }

    if (name) userObj.name = name;
    if (phone !== undefined) userObj.phone = phone;
    if (status) userObj.status = status;
    if (departmentId !== undefined) {
      userObj.departmentId = verifiedDeptId || undefined;
    }
    await userObj.save();

    const profile = await EmployeeProfile.findOne({ userId: userObj._id });
    if (profile) {
      if (designation) profile.designation = designation;
      if (departmentId !== undefined && verifiedDeptId) {
        profile.departmentId = verifiedDeptId;
      }
      if (employmentType) profile.employmentType = employmentType;
      if (basicSalary) {
        profile.salary = {
          basic: Number(basicSalary),
          allowances: Math.round(Number(basicSalary) * 0.15),
          currency: "INR",
        };
      }
      if (status && ["active", "on_notice", "resigned", "terminated"].includes(status)) {
        profile.status = status as any;
      }
      await profile.save();
    }

    return NextResponse.json({
      success: true,
      message: "Employee profile and department assignment updated successfully",
      data: {
        _id: userObj._id.toString(),
        name: userObj.name,
        departmentId: userObj.departmentId?.toString() || "",
      },
    });
  } catch (error: any) {
    console.error("PUT /api/crm/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    await EmployeeProfile.findOneAndDelete({ userId: params.id });
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/crm/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
