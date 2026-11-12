import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requireAuth();

  return <EmployeesClient />;
}

