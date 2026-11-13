import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import PackagesClient from "./PackagesClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const access = await checkPageAccess("packages", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Tour Packages" user={access.user} reason={access.reason} />;
  }

  return <PackagesClient />;
}
