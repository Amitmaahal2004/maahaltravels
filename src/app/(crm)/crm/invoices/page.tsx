import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import InvoicesClient from "./InvoicesClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const access = await checkPageAccess("invoices", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="GST Invoices" user={access.user} reason={access.reason} />;
  }

  return <InvoicesClient />;
}
