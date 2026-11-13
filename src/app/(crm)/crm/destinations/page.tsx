import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import DestinationsClient from "./DestinationsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const access = await checkPageAccess("destinations", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Destinations Hub" user={access.user} reason={access.reason} />;
  }

  return <DestinationsClient />;
}
