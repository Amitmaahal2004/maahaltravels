import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import CustomersClient from "./CustomersClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const access = await checkPageAccess("customers", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Customers Directory" user={access.user} reason={access.reason} />;
  }

  return <CustomersClient />;
}
