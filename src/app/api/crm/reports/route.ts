import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
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
        month: mName,
        revenue: mRevenue,
        expenses: mExpenses,
        profit: mRevenue - mExpenses,
      });
    }

    // Expense breakdown by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    const expenseBreakdown = Object.keys(categoryTotals).map((cat) => ({
      category: cat.replace("_", " ").toUpperCase(),
      amount: categoryTotals[cat],
    }));

    // Lead stage distribution
    const leadStages: Record<string, number> = {};
    leads.forEach((l) => {
      leadStages[l.status] = (leadStages[l.status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        marginRate,
        totalBookings: bookings.length,
        totalCustomers: customers.length,
        totalLeads: leads.length,
        totalPackages: packages.length,
      },
      monthlyFinancials,
      expenseBreakdown,
      leadStages,
    });
  } catch (error: any) {
    console.error("GET /api/crm/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
