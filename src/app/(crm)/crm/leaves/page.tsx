import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import LeavesClient from "./LeavesClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function LeavesPage() {
  const access = await checkPageAccess("leaves", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Leave Approvals" user={access.user} reason={access.reason} />;
  }

  return <LeavesClient />;
}
