import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import QuotationsClient from "./QuotationsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const access = await checkPageAccess("quotations", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Quotations Builder" user={access.user} reason={access.reason} />;
  }

  return <QuotationsClient />;
}
