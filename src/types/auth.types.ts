import { PermissionAction, RecordScope, SystemModuleId } from "@/config/permissions.config";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: {
    id: string;
    name: string;
    slug: string;
    isSystem: boolean;
    defaultRecordScope: RecordScope;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  status: "active" | "inactive" | "suspended";
  profileImage?: string;
  isEmailVerified: boolean;
  lastLoginAt?: string | null;
  permissions: {
    module: SystemModuleId;
    action: PermissionAction;
    scope: RecordScope;
  }[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: SafeUser;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ForgotPasswordRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}

