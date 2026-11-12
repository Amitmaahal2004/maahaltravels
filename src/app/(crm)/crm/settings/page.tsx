import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAuth();

  return <SettingsClient />;
}
