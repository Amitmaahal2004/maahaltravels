import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  await requireAuth();

  return <DashboardClient />;
}
