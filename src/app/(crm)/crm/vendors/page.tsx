import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import VendorsClient from "./VendorsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const access = await checkPageAccess("vendors", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Vendors & Suppliers" user={access.user} reason={access.reason} />;
  }

  return <VendorsClient />;
}
