import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import WebsiteCmsClient from "./WebsiteCmsClient";

export const dynamic = "force-dynamic";

export default async function WebsiteCmsPage() {
  await requireAuth();

  return <WebsiteCmsClient />;
}
