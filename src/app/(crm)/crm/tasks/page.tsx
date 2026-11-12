import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requireAuth();

  return <TasksClient />;
}
