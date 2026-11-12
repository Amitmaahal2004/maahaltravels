import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import OperationsClient from "./OperationsClient";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireAuth();

  return <OperationsClient />;
}

