import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import LeavesClient from "./LeavesClient";

export const dynamic = "force-dynamic";

export default async function LeavesPage() {
  await requireAuth();

  return <LeavesClient />;
}

