import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import PaymentsClient from "./PaymentsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const access = await checkPageAccess("payments", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Payments Ledger" user={access.user} reason={access.reason} />;
  }

  return <PaymentsClient />;
}
