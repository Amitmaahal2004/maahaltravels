import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import AttendanceClient from "./AttendanceClient";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  await requireAuth();

  return <AttendanceClient />;
}

