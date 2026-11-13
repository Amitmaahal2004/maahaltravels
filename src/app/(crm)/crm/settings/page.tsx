import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import SettingsClient from "./SettingsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const access = await checkPageAccess("settings", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="System Settings" user={access.user} reason={access.reason} />;
  }

  return <SettingsClient />;
}
