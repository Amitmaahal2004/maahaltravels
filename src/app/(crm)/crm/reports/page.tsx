import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAuth();

  return <ReportsClient />;
}
