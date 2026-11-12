import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import DepartmentsClient from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  await requireAuth();

  return <DepartmentsClient />;
}

