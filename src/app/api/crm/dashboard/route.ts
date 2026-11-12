import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Package from "@/models/Package";
import Expense from "@/models/Expense";
import Payment from "@/models/Payment";
import TripOperation from "@/models/TripOperation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Core aggregates
    const [
      totalBookings,
      totalCustomers,
      totalLeads,
      totalEmployees,
      activePackages,
      pendingBookingsCount,
      bookingsList,
      paymentsList,
      expensesList,
      recentLeads,
      upcomingTrips,
    ] = await Promise.all([
      Booking.countDocuments(),
      Customer.countDocuments({ status: "active" }),
      Lead.countDocuments(),
      User.countDocuments({ status: "active" }),
      Package.countDocuments({ status: "published" }),
      Booking.countDocuments({ bookingStatus: { $in: ["new", "pending_confirmation"] } }),
      Booking.find().sort({ createdAt: -1 }),
      Payment.find({ status: "completed" }),
      Expense.find({ status: "approved" }),
      Lead.find().sort({ createdAt: -1 }).limit(5),
      TripOperation.find({ departureDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort({ departureDate: 1 })
        .limit(5),
    ]);

    // Financial totals
    const totalRevenue = paymentsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalExpenses = expensesList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const pendingPayments = bookingsList.reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

    // Conversion rate
    const convertedLeads = await Lead.countDocuments({ status: "converted" });
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Monthly chart data (Last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      const mYear = d.getFullYear();
      const nextD = new Date(mYear, d.getMonth() + 1, 1);

      const mRevenue = paymentsList
        .filter((p) => new Date(p.paymentDate) >= d && new Date(p.paymentDate) < nextD)
        .reduce((sum, p) => sum + p.amount, 0);

      const mExpenses = expensesList
        .filter((e) => new Date(e.date) >= d && new Date(e.date) < nextD)
        .reduce((sum, e) => sum + e.amount, 0);

      chartData.push({
        month: `${mName} ${mYear.toString().slice(-2)}`,
        revenue: mRevenue,
        expenses: mExpenses,
        profit: mRevenue - mExpenses,
      });
    }

    // Top packages
    const packageCounts: Record<string, { count: number; name: string; revenue: number }> = {};
    for (const b of bookingsList) {
      if (b.packageName) {
        if (!packageCounts[b.packageName]) {
          packageCounts[b.packageName] = { count: 0, name: b.packageName, revenue: 0 };
        }
        packageCounts[b.packageName].count += 1;
        packageCounts[b.packageName].revenue += b.totalAmount || 0;
      }
    }
    const topPackages = Object.values(packageCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingPayments,
        totalBookings,
        totalCustomers,
        totalLeads,
        totalEmployees,
        activePackages,
        pendingBookingsCount,
        conversionRate,
        upcomingTripsCount: upcomingTrips.length,
      },
      chartData,
      recentBookings: bookingsList.slice(0, 5),
      recentLeads,
      topPackages,
      upcomingTrips,
    });
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
