import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import EmployeeProfile from "@/models/EmployeeProfile";
import Department from "@/models/Department";
import Role from "@/models/Role";
import Session from "@/models/Session";
import { invalidateAllUserSessions } from "@/lib/auth/session";
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

    const permError = assertPermission(user, "employees", "edit");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      phone,
      status,
      designation,
      departmentId,
      roleId,
      basicSalary,
      employmentType,
    } = body;

    const userObj = await User.findById(params.id).populate("roleId");
    if (!userObj) {
      return NextResponse.json({ success: false, error: "Employee user not found." }, { status: 404 });
    }

    // Security: Prevent users from modifying their own role or permissions
    if (params.id === user.id && roleId && roleId !== user.role.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot modify your own role or permissions." },
        { status: 403 }
      );
    }

    const currentRoleSlug = (userObj.roleId as any)?.slug;
    const isCurrentSuperAdmin = currentRoleSlug === "super-admin";

    // Super Admin protection: Cannot demote or deactivate the last active Super Admin
    if (isCurrentSuperAdmin) {
      const superAdminRole = await Role.findOne({ slug: "super-admin" });
      const activeSuperAdmins = await User.countDocuments({
        roleId: superAdminRole?._id,
        status: "active",
      });

      if (roleId && roleId !== (userObj.roleId as any)?._id.toString() && activeSuperAdmins <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot demote the last active Super Administrator." },
          { status: 400 }
        );
      }

      if (status && status !== "active" && userObj.status === "active" && activeSuperAdmins <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot deactivate or suspend the last active Super Administrator." },
          { status: 400 }
        );
      }
    }

    // Role Update Validation
    let updatedRoleDoc: any = null;
    if (roleId && roleId !== "") {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        return NextResponse.json({ success: false, error: "Invalid Role identifier." }, { status: 400 });
      }

      const targetRole = await Role.findById(roleId);
      if (!targetRole) {
        return NextResponse.json({ success: false, error: "The selected Role does not exist in the database." }, { status: 404 });
      }

      // Only an existing Super Admin can grant Super Admin privileges
      if (targetRole.slug === "super-admin" && user.role.slug !== "super-admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only an existing Super Administrator can assign Super Admin access." },
          { status: 403 }
        );
      }

      userObj.roleId = targetRole._id;
      updatedRoleDoc = targetRole;
    }

    // Department Validation
    let verifiedDeptId: mongoose.Types.ObjectId | null = null;
    if (departmentId !== undefined) {
      if (departmentId && departmentId !== "") {
        if (!mongoose.Types.ObjectId.isValid(departmentId)) {
          return NextResponse.json({ success: false, error: "Invalid Department identifier." }, { status: 400 });
        }
        const dept = await Department.findById(departmentId);
        if (!dept) {
          return NextResponse.json({ success: false, error: "Department not found in database." }, { status: 404 });
        }
        verifiedDeptId = dept._id;
      }
    }

    if (name) userObj.name = name.trim();
    if (phone !== undefined) userObj.phone = phone.trim();
    if (status) userObj.status = status;
    if (departmentId !== undefined) {
      userObj.departmentId = verifiedDeptId || undefined;
    }

    await userObj.save();

    // Update Employee Profile
    const profile = await EmployeeProfile.findOne({ userId: userObj._id });
    if (profile) {
      if (designation) profile.designation = designation.trim();
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

    // Refresh active session records for this user so updated role/permissions take effect
    await Session.updateMany({ userId: userObj._id }, { $set: { updatedAt: new Date() } });

    return NextResponse.json({
      success: true,
      message: "Employee profile and role access updated successfully.",
      data: {
        _id: userObj._id.toString(),
        name: userObj.name,
        role: updatedRoleDoc ? { _id: updatedRoleDoc._id.toString(), name: updatedRoleDoc.name, slug: updatedRoleDoc.slug } : undefined,
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

    const permError = assertPermission(user, "employees", "delete");
    if (permError) return permError;

    await connectToDatabase();

    // Prevent user from deleting their own account
    if (params.id === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(params.id).populate("roleId");
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    // Prevent deleting the last active Super Admin
    const isSuperAdmin = (targetUser.roleId as any)?.slug === "super-admin";
    if (isSuperAdmin) {
      const superAdminRole = await Role.findOne({ slug: "super-admin" });
      const activeSuperAdmins = await User.countDocuments({
        roleId: superAdminRole?._id,
        status: "active",
      });

      if (activeSuperAdmins <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last active Super Administrator." },
          { status: 400 }
        );
      }
    }

    // Invalidate all active user sessions
    await invalidateAllUserSessions(targetUser._id);

    // Delete EmployeeProfile and User
    await EmployeeProfile.deleteOne({ userId: targetUser._id });
    await User.findByIdAndDelete(targetUser._id);

    return NextResponse.json({
      success: true,
      message: "Employee and linked account removed successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/crm/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
