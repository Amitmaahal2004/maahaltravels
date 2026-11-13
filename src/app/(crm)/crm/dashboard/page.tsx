import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import DashboardClient from "./DashboardClient";
import { getDashboardData } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  const user = await requireAuth();
  const initialData = await getDashboardData(user);

  return <DashboardClient user={user} initialData={initialData} />;
}
