import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import { getAllSystemPermissions, getRolesWithPermissions } from "@/services/rbac.service";
import RolesManagementClient from "./RolesManagementClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function RolesAdminPage() {
  const access = await checkPageAccess("roles", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Roles & Permissions" user={access.user} reason={access.reason} />;
  }

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
