import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";

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

    if (name) userObj.name = name;
    if (phone) userObj.phone = phone;
    if (status) userObj.status = status;
    if (departmentId) userObj.department = departmentId;
    await userObj.save();

    let profile = await EmployeeProfile.findOne({ userId: userObj._id });
    if (profile) {
      if (designation) profile.designation = designation;
      if (departmentId) profile.departmentId = departmentId;
      if (employmentType) profile.employmentType = employmentType;
      if (basicSalary) {
        profile.salary = {
          basic: Number(basicSalary),
          allowances: Math.round(Number(basicSalary) * 0.15),
          currency: "INR",
        };
      }
      await profile.save();
    }

    return NextResponse.json({ success: true, message: "Employee profile updated successfully" });
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
