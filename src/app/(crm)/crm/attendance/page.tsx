import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import AttendanceClient from "./AttendanceClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const access = await checkPageAccess("attendance", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Attendance Terminal" user={access.user} reason={access.reason} />;
  }

  return <AttendanceClient />;
}
