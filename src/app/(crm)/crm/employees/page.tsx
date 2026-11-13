import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import EmployeesClient from "./EmployeesClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const access = await checkPageAccess("employees", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Staff & Employees" user={access.user} reason={access.reason} />;
  }

  return <EmployeesClient />;
}
