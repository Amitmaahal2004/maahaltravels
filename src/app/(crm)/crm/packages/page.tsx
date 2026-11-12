import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import PackagesClient from "./PackagesClient";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await requireAuth();

  return <PackagesClient />;
}

