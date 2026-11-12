import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAuth();

  return <PaymentsClient />;
}

