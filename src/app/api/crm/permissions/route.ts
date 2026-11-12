import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { checkUserPermission, getAllSystemPermissions } from "@/services/rbac.service";
import { SYSTEM_MODULES } from "@/config/permissions.config";

export const dynamic = "force-dynamic";

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

    const permissions = await getAllSystemPermissions();

    // Group permissions by module for convenient matrix display
    const grouped = SYSTEM_MODULES.map((mod) => ({
      module: mod.id,
      label: mod.label,
      description: mod.description,
      actions: permissions
        .filter((p) => p.module === mod.id)
        .map((p) => ({
          id: p._id.toString(),
          action: p.action,
          scope: p.scope,
          description: p.description,
        })),
    }));

    return NextResponse.json({ success: true, modules: grouped, all: permissions });
  } catch (error: any) {
    console.error("[Permissions GET API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch permissions" }, { status: 500 });
  }
}

