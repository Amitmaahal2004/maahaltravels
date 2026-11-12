import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import CrmSidebar from "@/components/crm/CrmSidebar";
import CrmHeader from "@/components/crm/CrmHeader";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/crm/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <CrmSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CrmHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

