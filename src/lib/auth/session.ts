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

  // Populate role if not already populated
  let roleDoc: IRole | null = null;
  if (userDoc.roleId && (userDoc.roleId as any).name) {
    roleDoc = userDoc.roleId as unknown as IRole;
  } else if (userDoc.roleId) {
    roleDoc = await Role.findById(userDoc.roleId).populate("permissions");
  }

  // Populate department if present
  let deptDoc: IDepartment | null = null;
  if (userDoc.departmentId && (userDoc.departmentId as any).name) {
    deptDoc = userDoc.departmentId as unknown as IDepartment;
  } else if (userDoc.departmentId) {
    deptDoc = await Department.findById(userDoc.departmentId);
  }

  // Extract effective permissions
  const permissionsMap = new Map<string, { module: any; action: any; scope: any }>();

  // 1. Role permissions
  if (roleDoc && Array.isArray(roleDoc.permissions)) {
    for (const p of roleDoc.permissions) {
      if (p && (p as any).module && (p as any).action) {
        const perm = p as unknown as IPermission;
        const key = `${perm.module}:${perm.action}`;
        const effectiveScope = roleDoc.defaultRecordScope || perm.scope || "all";
        permissionsMap.set(key, {
          module: perm.module,
          action: perm.action,
          scope: effectiveScope,
        });
      }
    }
  }

  // 2. Direct user overrides
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
