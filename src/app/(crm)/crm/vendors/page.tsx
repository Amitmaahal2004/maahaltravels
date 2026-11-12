import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import VendorsClient from "./VendorsClient";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  await requireAuth();

  return <VendorsClient />;
}
