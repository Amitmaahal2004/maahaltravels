import { PermissionAction, RecordScope, SystemModuleId } from "@/config/permissions.config";

export interface PermissionDefinition {
  id?: string;
  module: SystemModuleId;
  action: PermissionAction;
  scope: RecordScope;
  description?: string;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  defaultRecordScope: RecordScope;
  permissions: PermissionDefinition[];
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  defaultRecordScope?: RecordScope;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  defaultRecordScope?: RecordScope;
  permissionIds?: string[];
}

