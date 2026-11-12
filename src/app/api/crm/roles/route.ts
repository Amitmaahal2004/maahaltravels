import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { checkUserPermission, createCustomRole, getRolesWithPermissions } from "@/services/rbac.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  defaultRecordScope: z.enum(["all", "department", "assigned", "own"]).optional(),
  permissionIds: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const check = checkUserPermission(user, "roles", "view");
    if (!check.granted) {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const roles = await getRolesWithPermissions();
    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error("[Roles GET API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const check = checkUserPermission(user, "roles", "create");
    if (!check.granted) {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const result = await createCustomRole(parsed.data, user);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, role: result.role }, { status: 201 });
  } catch (error: any) {
    console.error("[Roles POST API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create role" }, { status: 500 });
  }
}

