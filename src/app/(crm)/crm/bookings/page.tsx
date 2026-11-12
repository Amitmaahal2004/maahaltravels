import React from "react";
import { requireAuth } from "@/lib/auth/guard";
import BookingsClient from "./BookingsClient";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  await requireAuth();

  return <BookingsClient />;
}

