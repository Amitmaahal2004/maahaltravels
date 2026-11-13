import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import Lead from "@/models/Lead";
import Customer from "@/models/Customer";
import Package from "@/models/Package";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "reports", "view");
    if (permError) return permError;

    await connectToDatabase();

    const [bookings, payments, expenses, leads, customers, packages] = await Promise.all([
      Booking.find(),
      Payment.find({ status: "completed" }),
      Expense.find({ status: "approved" }),
      Lead.find(),
      Customer.find({ status: "active" }),
      Package.find({ status: "published" }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const marginRate = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Monthly breakdown (Last 6 Months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyFinancials = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const mRevenue = payments
        .filter((p) => new Date(p.paymentDate) >= d && new Date(p.paymentDate) < nextD)
        .reduce((sum, p) => sum + p.amount, 0);

      const mExpenses = expenses
        .filter((e) => new Date(e.date) >= d && new Date(e.date) < nextD)
        .reduce((sum, e) => sum + e.amount, 0);

      monthlyFinancials.push({
        month: `${mName} ${d.getFullYear().toString().slice(-2)}`,
        revenue: mRevenue,
        expenses: mExpenses,
        profit: mRevenue - mExpenses,
      });
    }

    // Lead source performance
    const sourceMap: Record<string, { count: number; converted: number }> = {};
    for (const l of leads) {
      const src = l.leadSource || "other";
      if (!sourceMap[src]) sourceMap[src] = { count: 0, converted: 0 };
      sourceMap[src].count += 1;
      if (l.status === "converted") sourceMap[src].converted += 1;
    }
    const leadSources = Object.keys(sourceMap).map((k) => ({
      source: k.toUpperCase(),
      total: sourceMap[k].count,
      converted: sourceMap[k].converted,
      rate: sourceMap[k].count > 0 ? Math.round((sourceMap[k].converted / sourceMap[k].count) * 100) : 0,
    }));

    // Destination / Package performance
    const destMap: Record<string, { bookings: number; revenue: number }> = {};
    for (const b of bookings) {
      const d = (b as any).destination || b.packageName || "General";
      if (!destMap[d]) destMap[d] = { bookings: 0, revenue: 0 };
      destMap[d].bookings += 1;
      destMap[d].revenue += b.totalAmount || 0;
    }
    const destinationPerformance = Object.keys(destMap)
      .map((k) => ({
        destination: k,
        bookings: destMap[k].bookings,
        revenue: destMap[k].revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          marginRate,
          totalBookings: bookings.length,
          totalLeads: leads.length,
          totalCustomers: customers.length,
          activePackages: packages.length,
        },
        monthlyFinancials,
        leadSources,
        destinationPerformance,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate reports" },
      { status: 500 }
    );
  }
}
