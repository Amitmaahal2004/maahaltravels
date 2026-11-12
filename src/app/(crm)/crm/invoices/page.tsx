import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireAuth();

  return <InvoicesClient />;
}

