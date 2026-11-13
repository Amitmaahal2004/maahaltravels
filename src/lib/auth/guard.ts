import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, validateSessionToken, serializeSafeUser } from "./session";
import User from "@/models/User";
import { SafeUser } from "@/types/auth.types";
import { PermissionAction, SystemModuleId } from "@/config/permissions.config";
import { checkUserPermission, RecordContext } from "@/services/rbac.service";
import { NextResponse } from "next/server";

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await validateSessionToken(token);
    if (!session) return null;

    const user = await User.findById(session.userId)
      .populate({
        path: "roleId",
        populate: { path: "permissions" },
      })
      .populate("departmentId");
    if (!user || user.status !== "active") return null;

    return await serializeSafeUser(user);
  } catch (error) {
    console.error("[AuthGuard] Error resolving current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/crm/login");
  }
  return user;
}

export async function requirePermission(
  module: SystemModuleId,
  action: PermissionAction,
  record?: RecordContext
): Promise<{ user: SafeUser; scope: string }> {
  const user = await requireAuth();

  const check = checkUserPermission(user, module, action, record);
  if (!check.granted) {
    throw new Error(`FORBIDDEN: ${check.reason || "Insufficient permissions."}`);
  }

  return { user, scope: check.scope || "all" };
}

/**
 * Server-side helper to check if current page visitor has required module permission.
 * Does not throw unhandled exception; returns clean authorization status and user.
 */
export async function checkPageAccess(
  module: SystemModuleId,
  action: PermissionAction = "view",
  record?: RecordContext
): Promise<{ authorized: boolean; user: SafeUser; reason?: string }> {
  const user = await requireAuth();
  const check = checkUserPermission(user, module, action, record);
  return {
    authorized: check.granted,
    user,
    reason: check.reason,
  };
}

/**
 * Quick assertion helper for API route handlers.
 * Returns a 403 NextResponse if forbidden, or null if authorized.
 */
export function assertPermission(
  user: SafeUser,
  module: SystemModuleId,
  action: PermissionAction,
  record?: RecordContext
): NextResponse | null {
  const check = checkUserPermission(user, module, action, record);
  if (!check.granted) {
    return NextResponse.json(
      {
        success: false,
        error: check.reason || `Forbidden: You lack the '${module}:${action}' permission.`,
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Route Handler wrapper for authenticated endpoints
 */
export function withAuth(
  handler: (req: Request, user: SafeUser) => Promise<NextResponse>
) {
  return async (req: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    return handler(req, user);
  };
}

/**
 * Route Handler wrapper for permission-restricted endpoints
 */
export function withPermission(
  module: SystemModuleId,
  action: PermissionAction,
  handler: (req: Request, user: SafeUser, scope: string) => Promise<NextResponse>
) {
  return async (req: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const check = checkUserPermission(user, module, action);
    if (!check.granted) {
      return NextResponse.json(
        { success: false, error: check.reason || "Access forbidden." },
        { status: 403 }
      );
    }

    return handler(req, user, check.scope || "all");
  };
}
