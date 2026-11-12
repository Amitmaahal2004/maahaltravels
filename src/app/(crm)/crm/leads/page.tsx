import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requireAuth();

  return <LeadsClient />;
}
