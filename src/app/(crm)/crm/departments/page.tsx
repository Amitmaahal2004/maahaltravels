import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import DepartmentsClient from "./DepartmentsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const access = await checkPageAccess("departments", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Departments" user={access.user} reason={access.reason} />;
  }

  return <DepartmentsClient />;
}
