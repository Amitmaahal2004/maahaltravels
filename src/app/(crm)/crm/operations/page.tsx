import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import OperationsClient from "./OperationsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const access = await checkPageAccess("operations", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Trip Operations" user={access.user} reason={access.reason} />;
  }

  return <OperationsClient />;
}
