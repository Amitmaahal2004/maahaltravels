import { cookies } from "next/headers";
import { generateRandomToken, hashToken } from "./password";
import Session, { ISession } from "@/models/Session";
import { type IUser } from "@/models/User";
import Role, { IRole } from "@/models/Role";
import Department, { IDepartment } from "@/models/Department";
import Permission, { IPermission } from "@/models/Permission";
import connectToDatabase from "@/lib/mongodb";
import { SafeUser } from "@/types/auth.types";
import { Types } from "mongoose";
import { ALL_WIDGET_IDS, getDefaultWidgetsForRole } from "@/config/widgets.config";

export const SESSION_COOKIE_NAME = "crm_session";
const SESSION_EXPIRATION_DAYS = 7;

export interface CreateSessionParams {
  userId: string | Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

export async function createSession({
  userId,
  ipAddress,
  userAgent,
}: CreateSessionParams): Promise<{ rawToken: string; session: ISession }> {
  await connectToDatabase();

  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    tokenHash,
    userId,
    expiresAt,
    ipAddress,
    userAgent,
    isValid: true,
  });

  return { rawToken, session };
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value;
}

export async function validateSessionToken(rawToken: string): Promise<ISession | null> {
  if (!rawToken) return null;
  await connectToDatabase();

  const tokenHash = hashToken(rawToken);
  const session = await Session.findOne({
    tokenHash,
    isValid: true,
    expiresAt: { $gt: new Date() },
  });

  return session;
}

export async function invalidateSession(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  await connectToDatabase();

  const tokenHash = hashToken(rawToken);
  const result = await Session.updateOne(
    { tokenHash },
    { $set: { isValid: false } }
  );

  return result.modifiedCount > 0;
}

export async function invalidateAllUserSessions(userId: string | Types.ObjectId): Promise<void> {
  await connectToDatabase();
  await Session.updateMany(
    { userId, isValid: true },
    { $set: { isValid: false } }
  );
}

export async function serializeSafeUser(userDoc: IUser): Promise<SafeUser> {
  await connectToDatabase();

  // 1. Resolve roleDoc safely with permissions populated
  let roleDoc: IRole | null = null;
  let roleId = userDoc.roleId;
  if (roleId && typeof roleId === "object" && "_id" in (roleId as any)) {
    roleId = (roleId as any)._id;
  }

  const candidateRole = userDoc.roleId as any;
  if (
    candidateRole &&
    candidateRole.name &&
    Array.isArray(candidateRole.permissions) &&
    candidateRole.permissions.length > 0 &&
    typeof candidateRole.permissions[0] === "object" &&
    candidateRole.permissions[0].module
  ) {
    roleDoc = candidateRole as IRole;
  } else if (roleId) {
    roleDoc = await Role.findById(roleId).populate("permissions");
  }

  // 2. Resolve department safely
  let deptDoc: IDepartment | null = null;
  let deptId = userDoc.departmentId;
  if (deptId && typeof deptId === "object" && "_id" in (deptId as any)) {
    deptId = (deptId as any)._id;
  }
  const candidateDept = userDoc.departmentId as any;
  if (candidateDept && candidateDept.name) {
    deptDoc = candidateDept as IDepartment;
  } else if (deptId) {
    deptDoc = await Department.findById(deptId);
  }

  // 3. Extract and normalize effective permissions
  const permissionsMap = new Map<string, { module: any; action: any; scope: any }>();

  // If role is super-admin, ensure it has ALL system permissions with scope "all"
  if (roleDoc && roleDoc.slug === "super-admin") {
    const allSystemPerms = await Permission.find();
    for (const perm of allSystemPerms) {
      const key = `${perm.module}:${perm.action}`;
      permissionsMap.set(key, {
        module: perm.module,
        action: perm.action,
        scope: "all",
      });
    }
  } else if (roleDoc && Array.isArray(roleDoc.permissions)) {
    const rawIds: Types.ObjectId[] = [];
    for (const p of roleDoc.permissions as any[]) {
      if (p && typeof p === "object" && p.module && p.action) {
        const key = `${p.module}:${p.action}`;
        const effectiveScope = roleDoc.defaultRecordScope || p.scope || "all";
        permissionsMap.set(key, {
          module: p.module,
          action: p.action,
          scope: effectiveScope,
        });
      } else if (p) {
        rawIds.push(p._id || p);
      }
    }

    if (rawIds.length > 0) {
      const fetched = await Permission.find({ _id: { $in: rawIds } });
      for (const p of fetched) {
        const key = `${p.module}:${p.action}`;
        const effectiveScope = roleDoc.defaultRecordScope || p.scope || "all";
        permissionsMap.set(key, {
          module: p.module,
          action: p.action,
          scope: effectiveScope,
        });
      }
    }
  }

  // 4. Direct user overrides
  if (Array.isArray(userDoc.directPermissions) && userDoc.directPermissions.length > 0) {
    for (const dp of userDoc.directPermissions) {
      const pDoc = await Permission.findById(dp.permissionId);
      if (pDoc) {
        const key = `${pDoc.module}:${pDoc.action}`;
        if (dp.isGranted) {
          permissionsMap.set(key, {
            module: pDoc.module,
            action: pDoc.action,
            scope: pDoc.scope || "all",
          });
        } else {
          permissionsMap.delete(key);
        }
      }
    }
  }

  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    role: {
      id: roleDoc ? roleDoc._id.toString() : "",
      name: roleDoc ? roleDoc.name : "Unassigned",
      slug: roleDoc ? roleDoc.slug : "unassigned",
      isSystem: roleDoc ? roleDoc.isSystem : false,
      defaultRecordScope: roleDoc ? roleDoc.defaultRecordScope : "all",
      dashboardWidgets: roleDoc?.slug === "super-admin"
        ? ALL_WIDGET_IDS
        : (roleDoc?.dashboardWidgets && roleDoc.dashboardWidgets.length > 0)
        ? roleDoc.dashboardWidgets
        : getDefaultWidgetsForRole(roleDoc?.slug || ""),
    },
    department: deptDoc
      ? {
          id: deptDoc._id.toString(),
          name: deptDoc.name,
          code: deptDoc.code,
        }
      : null,
    status: userDoc.status,
    profileImage: userDoc.profileImage,
    isEmailVerified: userDoc.isEmailVerified,
    lastLoginAt: userDoc.lastLoginAt ? userDoc.lastLoginAt.toISOString() : null,
    permissions: Array.from(permissionsMap.values()),
  };
}
