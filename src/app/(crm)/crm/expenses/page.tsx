import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import ExpensesClient from "./ExpensesClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const access = await checkPageAccess("expenses", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Expenses & Profit" user={access.user} reason={access.reason} />;
  }

  return <ExpensesClient />;
}
