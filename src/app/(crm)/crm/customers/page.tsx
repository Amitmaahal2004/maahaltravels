import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireAuth();

  return <CustomersClient />;
}

