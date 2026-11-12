import connectToDatabase from "@/lib/mongodb";
import Role from "@/models/Role";
import Permission, { IPermission } from "@/models/Permission";
import User from "@/models/User";
import { SafeUser } from "@/types/auth.types";
import { PermissionAction, RecordScope, SystemModuleId } from "@/config/permissions.config";
import { CreateRoleInput, RoleWithPermissions, UpdateRoleInput } from "@/types/rbac.types";
import { logActivity } from "./audit.service";

export interface PermissionCheckResult {
  granted: boolean;
  scope?: RecordScope;
  reason?: string;
}

export interface RecordContext {
  id?: string;
  departmentId?: string;
  assignedTo?: string;
  assignedStaff?: string;
  createdBy?: string;
  userId?: string;
}

/**
 * Central server-side permission evaluator.
 * Evaluates module:action access and enforces record-level scopes.
 */
export function checkUserPermission(
  user: SafeUser | null | undefined,
  module: SystemModuleId,
  action: PermissionAction,
  record?: RecordContext
): PermissionCheckResult {
  if (!user) {
    return { granted: false, reason: "Authentication required." };
  }

  // Super Admin bypass: has total, unrestricted access across all modules
  if (user.role.slug === "super-admin") {
    return { granted: true, scope: "all" };
  }

  // Match module and action
  const matched = user.permissions.find(
    (p) => p.module === module && (p.action === action || p.action === "manage")
  );

  if (!matched) {
    return {
      granted: false,
      reason: `Access denied. You lack the '${module}:${action}' permission.`,
    };
  }

  let effectiveScope: RecordScope = matched.scope || "all";
  if (user.role.defaultRecordScope && user.role.defaultRecordScope !== "all") {
    effectiveScope = user.role.defaultRecordScope;
  }

  // If a record context is provided, enforce record-level scoping
  if (record) {
    switch (effectiveScope) {
      case "all":
        return { granted: true, scope: "all" };

      case "department":
        if (
          user.department?.id &&
          record.departmentId &&
          user.department.id === record.departmentId.toString()
        ) {
          return { granted: true, scope: "department" };
        }
        return {
          granted: false,
          scope: "department",
          reason: "Access denied. Record does not belong to your department.",
        };

      case "assigned":
        const assignedTarget = record.assignedTo || record.assignedStaff;
        if (assignedTarget && assignedTarget.toString() === user.id) {
          return { granted: true, scope: "assigned" };
        }
        return {
          granted: false,
          scope: "assigned",
          reason: "Access denied. Record is not assigned to you.",
        };

      case "own":
        const ownerTarget = record.createdBy || record.userId;
        if (ownerTarget && ownerTarget.toString() === user.id) {
          return { granted: true, scope: "own" };
        }
        return {
          granted: false,
          scope: "own",
          reason: "Access denied. You are not the owner of this record.",
        };

      default:
        return { granted: true, scope: effectiveScope };
    }
  }

  return { granted: true, scope: effectiveScope };
}

/**
 * Returns all system roles with their permissions and assigned user count.
 */
export async function getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  await connectToDatabase();

  const roles = await Role.find().populate("permissions").sort({ isSystem: -1, createdAt: 1 });

  const result: RoleWithPermissions[] = [];

  for (const r of roles) {
    const userCount = await User.countDocuments({ roleId: r._id });
    result.push({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      defaultRecordScope: r.defaultRecordScope,
      userCount,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      permissions: (r.permissions as any[]).map((p) => ({
        id: p._id.toString(),
        module: p.module,
        action: p.action,
        scope: p.scope,
        description: p.description,
      })),
    });
  }

  return result;
}

/**
 * Fetches all available permission records in MongoDB.
 */
export async function getAllSystemPermissions(): Promise<IPermission[]> {
  await connectToDatabase();
  return Permission.find().sort({ module: 1, action: 1 });
}

/**
 * Creates a new custom role with assigned permissions.
 */
export async function createCustomRole(
  input: CreateRoleInput,
  actorUser?: SafeUser
): Promise<{ success: boolean; role?: any; error?: string }> {
  await connectToDatabase();

  const slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

  const existing = await Role.findOne({ slug });
  if (existing) {
    return { success: false, error: `A role with slug '${slug}' already exists.` };
  }

  const role = await Role.create({
    name: input.name.trim(),
    slug,
    description: input.description?.trim(),
    isSystem: false,
    defaultRecordScope: input.defaultRecordScope || "assigned",
    permissions: input.permissionIds,
  });

  if (actorUser) {
    await logActivity({
      userId: actorUser.id,
      userName: actorUser.name,
      userEmail: actorUser.email,
      userRole: actorUser.role.slug,
      action: "role_created",
      module: "roles",
      recordId: role._id.toString(),
      details: { roleName: role.name, slug: role.slug },
    });
  }

  return { success: true, role };
}

/**
 * Updates a role's permissions or attributes.
 */
export async function updateRole(
  roleId: string,
  input: UpdateRoleInput,
  actorUser?: SafeUser
): Promise<{ success: boolean; role?: any; error?: string }> {
  await connectToDatabase();

  const role = await Role.findById(roleId);
  if (!role) {
    return { success: false, error: "Role not found." };
  }

  // Prevent modifying core properties of Super Admin
  if (role.slug === "super-admin" && input.permissionIds) {
    // Super admin inherently has all permissions; ignore restricting it
  }

  if (input.name) role.name = input.name.trim();
  if (input.description !== undefined) role.description = input.description.trim();
  if (input.defaultRecordScope) role.defaultRecordScope = input.defaultRecordScope;
  if (input.permissionIds) {
    role.permissions = input.permissionIds as any;
  }

  await role.save();

  if (actorUser) {
    await logActivity({
      userId: actorUser.id,
      userName: actorUser.name,
      userEmail: actorUser.email,
      userRole: actorUser.role.slug,
      action: "role_updated",
      module: "roles",
      recordId: role._id.toString(),
      details: { roleName: role.name, slug: role.slug },
    });
  }

  return { success: true, role };
}

/**
 * Deletes a custom role (system roles cannot be deleted).
 */
export async function deleteCustomRole(
  roleId: string,
  actorUser?: SafeUser
): Promise<{ success: boolean; error?: string }> {
  await connectToDatabase();

  const role = await Role.findById(roleId);
  if (!role) {
    return { success: false, error: "Role not found." };
  }

  if (role.isSystem) {
    return { success: false, error: "System roles cannot be deleted." };
  }

  const assignedUsersCount = await User.countDocuments({ roleId: role._id });
  if (assignedUsersCount > 0) {
    return {
      success: false,
      error: `Cannot delete role. There are ${assignedUsersCount} active employee(s) assigned to this role.`,
    };
  }

  await Role.findByIdAndDelete(roleId);

  if (actorUser) {
    await logActivity({
      userId: actorUser.id,
      userName: actorUser.name,
      userEmail: actorUser.email,
      userRole: actorUser.role.slug,
      action: "role_deleted",
      module: "roles",
      recordId: roleId,
      details: { roleName: role.name, slug: role.slug },
    });
  }

  return { success: true };
}
