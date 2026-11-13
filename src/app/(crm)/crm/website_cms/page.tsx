import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import WebsiteCmsClient from "./WebsiteCmsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function WebsiteCmsPage() {
  const access = await checkPageAccess("website_cms", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Website CMS" user={access.user} reason={access.reason} />;
  }

  return <WebsiteCmsClient />;
}
