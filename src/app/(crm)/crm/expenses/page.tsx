import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireAuth();

  return <ExpensesClient />;
}

