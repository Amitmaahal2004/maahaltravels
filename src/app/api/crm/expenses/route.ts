import { NextResponse } from "next/server";
import { getCurrentUser, assertPermission } from "@/lib/auth/guard";
import connectToDatabase from "@/lib/mongodb";
import Expense from "@/models/Expense";
import Payment from "@/models/Payment";
import Vendor from "@/models/Vendor";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "expenses", "view");
    if (permError) return permError;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const query: any = {};
    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { bookingRef: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Calculate revenue from payments
    const payments = await Payment.find({ status: "completed" });
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    const vendors = await Vendor.find({ status: "active" });

    return NextResponse.json({
      success: true,
      data: expenses,
      vendors,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
      },
    });
  } catch (error: any) {
    console.error("GET /api/crm/expenses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const permError = assertPermission(user, "expenses", "create");
    if (permError) return permError;

    await connectToDatabase();
    const body = await req.json();

    const {
      title,
      category = "hotels",
      amount,
      date,
      bookingRef,
      vendorName,
      notes,
    } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { success: false, error: "Title and amount are required" },
        { status: 400 }
      );
    }

    const newExpense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      bookingRef: bookingRef ? bookingRef.toUpperCase().trim() : undefined,
      vendorName: vendorName || undefined,
      status: "approved",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/expenses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record expense" },
      { status: 500 }
    );
  }
}
