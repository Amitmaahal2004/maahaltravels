import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import DestinationsClient from "./DestinationsClient";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  await requireAuth();

  return <DestinationsClient />;
}

