import React from "react";
import { checkPageAccess } from "@/lib/auth/guard";
import BookingsClient from "./BookingsClient";
import AccessDenied from "@/components/crm/AccessDenied";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const access = await checkPageAccess("bookings", "view");
  if (!access.authorized) {
    return <AccessDenied moduleName="Bookings Ledger" user={access.user} reason={access.reason} />;
  }

  return <BookingsClient />;
}
