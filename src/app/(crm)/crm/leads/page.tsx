import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import LeadsClient from "./LeadsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const access = await checkPageAccess("leads", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Leads Pipeline" user={access.user} reason={access.reason} />;
  }

  return <LeadsClient />;
}
