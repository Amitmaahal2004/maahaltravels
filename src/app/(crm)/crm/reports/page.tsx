import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import ReportsClient from "./ReportsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const access = await checkPageAccess("reports", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Reports & Analytics" user={access.user} reason={access.reason} />;
  }

  return <ReportsClient />;
}
