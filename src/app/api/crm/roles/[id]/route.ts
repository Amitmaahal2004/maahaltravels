import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { checkUserPermission, deleteCustomRole, updateRole } from "@/services/rbac.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  defaultRecordScope: z.enum(["all", "department", "assigned", "own"]).optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const check = checkUserPermission(user, "roles", "edit");
    if (!check.granted) {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const result = await updateRole(params.id, parsed.data, user);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, role: result.role });
  } catch (error: any) {
    console.error("[Roles PUT API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const check = checkUserPermission(user, "roles", "delete");
    if (!check.granted) {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const result = await deleteCustomRole(params.id, user);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error: any) {
    console.error("[Roles DELETE API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}

