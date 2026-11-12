import React from "react";
import { requirePermission } from "@/lib/auth/guard";
import { getAllSystemPermissions, getRolesWithPermissions } from "@/services/rbac.service";
import RolesManagementClient from "./RolesManagementClient";

export const dynamic = "force-dynamic";

export default async function RolesAdminPage() {
  // Server-side permission check: ensures only authorized users can access this page
  await requirePermission("roles", "view");

  const [roles, permissions] = await Promise.all([
    getRolesWithPermissions(),
    getAllSystemPermissions(),
  ]);

  const serializedPermissions = permissions.map((p) => ({
    id: p._id.toString(),
    module: p.module,
    action: p.action,
    scope: p.scope,
  }));

  return (
    <RolesManagementClient
      initialRoles={roles}
      systemPermissions={serializedPermissions}
    />
  );
}

