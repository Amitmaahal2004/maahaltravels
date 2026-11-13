import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import TasksClient from "./TasksClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const access = await checkPageAccess("tasks", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Tasks & Projects" user={access.user} reason={access.reason} />;
  }

  return <TasksClient />;
}
