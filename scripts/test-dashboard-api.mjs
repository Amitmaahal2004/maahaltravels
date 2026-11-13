import mongoose from "mongoose";
import fs from "fs";

let uri = process.env.MONGODB_URI;
if (!uri) {
  const envContent = fs.existsSync(".env.local")
    ? fs.readFileSync(".env.local", "utf8")
    : fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      uri = trimmed.slice("MONGODB_URI=".length).replace(/^["']|["']$/g, "");
      process.env.MONGODB_URI = uri;
      break;
    }
  }
}

async function test() {
  await mongoose.connect(uri);

  const Booking = (await import("../src/models/Booking.ts")).default;
  const Customer = (await import("../src/models/Customer.ts")).default;
  const Lead = (await import("../src/models/Lead.ts")).default;
  const User = (await import("../src/models/User.ts")).default;
  const Package = (await import("../src/models/Package.ts")).default;
  const Expense = (await import("../src/models/Expense.ts")).default;
  const Payment = (await import("../src/models/Payment.ts")).default;
  const TripOperation = (await import("../src/models/TripOperation.ts")).default;

  console.log("Testing dashboard queries...");
  try {
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

    console.log("Counts:", {
      totalBookings,
      totalCustomers,
      totalLeads,
      totalEmployees,
      activePackages,
      pendingBookingsCount,
      bookingsCount: bookingsList.length,
      paymentsCount: paymentsList.length,
      expensesCount: expensesList.length,
      recentLeadsCount: recentLeads.length,
      upcomingTripsCount: upcomingTrips.length,
    });
  } catch (err) {
    console.error("Dashboard query error:", err);
  }

  process.exit(0);
}

test().catch(console.error);

