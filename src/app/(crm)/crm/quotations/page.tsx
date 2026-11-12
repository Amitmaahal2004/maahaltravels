import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import QuotationsClient from "./QuotationsClient";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  await requireAuth();

  return <QuotationsClient />;
}
