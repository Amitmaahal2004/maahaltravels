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

async function runDashboardRbacVerification() {
  console.log("========================================================================");
  console.log("   DASHBOARD WIDGET RBAC & FINANCIAL DATA SECURITY VERIFICATION TEST   ");
  console.log("========================================================================\n");

  await mongoose.connect(uri);

  const User = (await import("../src/models/User.ts")).default;
  const Role = (await import("../src/models/Role.ts")).default;
  const Permission = (await import("../src/models/Permission.ts")).default;
  const { serializeSafeUser } = await import("../src/lib/auth/session.ts");
  const { getDashboardData } = await import("../src/services/dashboard.service.ts");
  const { ALL_WIDGET_IDS, DASHBOARD_WIDGET_CATEGORIES } = await import("../src/config/widgets.config.ts");

  console.log(`[CONFIG] Total standard widgets registered: ${ALL_WIDGET_IDS.length}`);
  console.log(`[CONFIG] Widget categories count: ${DASHBOARD_WIDGET_CATEGORIES.length}\n`);

  const createdTestUserIds = [];

  // 1. Verify Super Admin Access (Must have 100% full financial and operational telemetry)
  console.log("------------------------------------------------------------------------");
  console.log("1. TESTING SUPER ADMIN DASHBOARD (Complete Access & Full Financials)");
  console.log("------------------------------------------------------------------------");
  const superAdminRole = await Role.findOne({ slug: "super-admin" });
  let superAdminUser = await User.findOne({ roleId: superAdminRole._id, status: "active" });
  if (!superAdminUser) {
    superAdminUser = await User.create({
      name: "Test Super Admin",
      email: `test.superadmin.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: superAdminRole._id,
      status: "active",
    });
    createdTestUserIds.push(superAdminUser._id);
  }

  const saUserPopulated = await User.findById(superAdminUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const saSafeUser = await serializeSafeUser(saUserPopulated);
  const saDashboard = await getDashboardData(saSafeUser);

  console.log(`✓ Super Admin Authorized Widgets Count: ${saDashboard.authorizedWidgets.length}`);
  console.log(`  - Total Revenue: ₹${saDashboard.stats.totalRevenue}`);
  console.log(`  - Total Expenses: ₹${saDashboard.stats.totalExpenses}`);
  console.log(`  - Net Profit: ₹${saDashboard.stats.netProfit}`);
  console.log(`  - Financial Chart Months: ${saDashboard.chartData.length}`);
  console.log(`  - Total Bookings: ${saDashboard.stats.totalBookings}`);
  console.log(`  - Total Leads: ${saDashboard.stats.totalLeads}`);

  if (saDashboard.stats.totalRevenue === null || saDashboard.stats.netProfit === null) {
    throw new Error("FAIL: Super Admin should see non-null financial metrics!");
  }
  if (saDashboard.chartData.length === 0) {
    throw new Error("FAIL: Super Admin financial analytics chart should be populated!");
  }
  if (saDashboard.authorizedWidgets.length !== ALL_WIDGET_IDS.length) {
    throw new Error(`FAIL: Super Admin must have all ${ALL_WIDGET_IDS.length} widgets authorized!`);
  }
  console.log("✓ Super Admin Dashboard Security & Metrics Passed 100% OK\n");

  // 2. Verify Sales Executive Dashboard (Strict Financial Masking)
  console.log("------------------------------------------------------------------------");
  console.log("2. TESTING SALES EXECUTIVE DASHBOARD (Strict Financial Data Masking)");
  console.log("------------------------------------------------------------------------");
  const salesRole = await Role.findOne({ slug: "sales-executive" });
  let salesUser = await User.findOne({ roleId: salesRole._id, status: "active" });
  if (!salesUser) {
    salesUser = await User.create({
      name: "Test Sales Exec",
      email: `test.sales.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: salesRole._id,
      status: "active",
    });
    createdTestUserIds.push(salesUser._id);
  }

  const salesUserPopulated = await User.findById(salesUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const salesSafeUser = await serializeSafeUser(salesUserPopulated);
  const salesDashboard = await getDashboardData(salesSafeUser);

  console.log(`✓ Sales Executive Authorized Widgets: [${salesDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Total Revenue (Masked): ${salesDashboard.stats.totalRevenue}`);
  console.log(`  - Total Expenses (Masked): ${salesDashboard.stats.totalExpenses}`);
  console.log(`  - Net Profit (Masked): ${salesDashboard.stats.netProfit}`);
  console.log(`  - Financial Chart Items: ${salesDashboard.chartData.length}`);
  console.log(`  - Personal / Assigned Bookings: ${salesDashboard.stats.totalBookings}`);
  console.log(`  - Personal / Assigned Leads: ${salesDashboard.stats.totalLeads}`);

  // STRICT AUDIT: Sales Executive must NEVER have access to company-wide financial figures
  if (salesDashboard.stats.totalRevenue !== null) {
    throw new Error(`CRITICAL SECURITY LEAK: Sales Executive totalRevenue is not null! Value: ${salesDashboard.stats.totalRevenue}`);
  }
  if (salesDashboard.stats.totalExpenses !== null) {
    throw new Error(`CRITICAL SECURITY LEAK: Sales Executive totalExpenses is not null! Value: ${salesDashboard.stats.totalExpenses}`);
  }
  if (salesDashboard.stats.netProfit !== null) {
    throw new Error(`CRITICAL SECURITY LEAK: Sales Executive netProfit is not null! Value: ${salesDashboard.stats.netProfit}`);
  }
  if (salesDashboard.chartData.length > 0) {
    throw new Error(`CRITICAL SECURITY LEAK: Sales Executive financial chartData is populated! Length: ${salesDashboard.chartData.length}`);
  }
  console.log("✓ Strict Backend Financial Masking Verified: Sales Executive has ZERO financial data leak!\n");

  // 3. Verify Accountant Dashboard (Financial Access, No Operational/HR Overreach)
  console.log("------------------------------------------------------------------------");
  console.log("3. TESTING ACCOUNTANT DASHBOARD (Financial Telemetry Allowed, Ops Masked)");
  console.log("------------------------------------------------------------------------");
  const accountantRole = await Role.findOne({ slug: "accountant" });
  let accountantUser = await User.findOne({ roleId: accountantRole._id, status: "active" });
  if (!accountantUser) {
    accountantUser = await User.create({
      name: "Test Accountant",
      email: `test.accountant.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: accountantRole._id,
      status: "active",
    });
    createdTestUserIds.push(accountantUser._id);
  }

  const acctPopulated = await User.findById(accountantUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const acctSafeUser = await serializeSafeUser(acctPopulated);
  const acctDashboard = await getDashboardData(acctSafeUser);

  console.log(`✓ Accountant Authorized Widgets: [${acctDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Total Revenue: ₹${acctDashboard.stats.totalRevenue}`);
  console.log(`  - Total Expenses: ₹${acctDashboard.stats.totalExpenses}`);
  console.log(`  - Net Profit: ₹${acctDashboard.stats.netProfit}`);
  console.log(`  - Financial Chart Months: ${acctDashboard.chartData.length}`);

  if (acctDashboard.stats.totalRevenue === null || acctDashboard.stats.totalExpenses === null) {
    throw new Error("FAIL: Accountant must see financial figures!");
  }
  if (acctDashboard.authorizedWidgets.includes("active_operations")) {
    throw new Error("FAIL: Accountant should not have active_operations widget!");
  }
  console.log("✓ Accountant Financial Dashboard Verified OK\n");

  // 4. Verify Operations Manager Dashboard (Ops Board, Financials Masked)
  console.log("------------------------------------------------------------------------");
  console.log("4. TESTING OPERATIONS MANAGER DASHBOARD (Ops Board, Masked Financials)");
  console.log("------------------------------------------------------------------------");
  const opsRole = await Role.findOne({ slug: "operations-manager" });
  let opsUser = await User.findOne({ roleId: opsRole._id, status: "active" });
  if (!opsUser) {
    opsUser = await User.create({
      name: "Test Ops Manager",
      email: `test.ops.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: opsRole._id,
      status: "active",
    });
    createdTestUserIds.push(opsUser._id);
  }

  const opsPopulated = await User.findById(opsUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const opsSafeUser = await serializeSafeUser(opsPopulated);
  const opsDashboard = await getDashboardData(opsSafeUser);

  console.log(`✓ Ops Manager Authorized Widgets: [${opsDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Total Revenue: ${opsDashboard.stats.totalRevenue}`);
  console.log(`  - Upcoming Trips: ${opsDashboard.upcomingTrips.length}`);
  console.log(`  - Active Bookings / Operations: ${opsDashboard.stats.activeOperationsCount}`);

  if (opsDashboard.stats.totalRevenue !== null) {
    throw new Error("SECURITY LEAK: Operations Manager should not have company revenue!");
  }
  if (!opsDashboard.authorizedWidgets.includes("upcoming_trips")) {
    throw new Error("FAIL: Operations Manager must have upcoming_trips widget!");
  }
  console.log("✓ Operations Manager Dashboard Verified OK\n");

  // 5. Verify HR Manager Dashboard (Staff Metrics, Masked Financials)
  console.log("------------------------------------------------------------------------");
  console.log("5. TESTING HR MANAGER DASHBOARD (Headcount, Attendance, Masked Financials)");
  console.log("------------------------------------------------------------------------");
  const hrRole = await Role.findOne({ slug: "hr-manager" });
  let hrUser = await User.findOne({ roleId: hrRole._id, status: "active" });
  if (!hrUser) {
    hrUser = await User.create({
      name: "Test HR Manager",
      email: `test.hr.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: hrRole._id,
      status: "active",
    });
    createdTestUserIds.push(hrUser._id);
  }

  const hrPopulated = await User.findById(hrUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const hrSafeUser = await serializeSafeUser(hrPopulated);
  const hrDashboard = await getDashboardData(hrSafeUser);

  console.log(`✓ HR Manager Authorized Widgets: [${hrDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Total Employees: ${hrDashboard.stats.totalEmployees}`);
  console.log(`  - Revenue (Masked): ${hrDashboard.stats.totalRevenue}`);

  if (hrDashboard.stats.totalRevenue !== null) {
    throw new Error("SECURITY LEAK: HR Manager should not see company total revenue!");
  }
  if (!hrDashboard.authorizedWidgets.includes("total_employees")) {
    throw new Error("FAIL: HR Manager must have total_employees widget!");
  }
  console.log("✓ HR Manager Dashboard Verified OK\n");

  // 6. Verify Employee Self-Service Dashboard
  console.log("------------------------------------------------------------------------");
  console.log("6. TESTING EMPLOYEE DASHBOARD (Self-Service Tasks, Attendance)");
  console.log("------------------------------------------------------------------------");
  const empRole = await Role.findOne({ slug: "employee" });
  let empUser = await User.findOne({ roleId: empRole._id, status: "active" });
  if (!empUser) {
    empUser = await User.create({
      name: "Test Employee",
      email: `test.emp.${Date.now()}@travelagency.test`,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
      roleId: empRole._id,
      status: "active",
    });
    createdTestUserIds.push(empUser._id);
  }

  const empPopulated = await User.findById(empUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const empSafeUser = await serializeSafeUser(empPopulated);
  const empDashboard = await getDashboardData(empSafeUser);

  console.log(`✓ Employee Authorized Widgets: [${empDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Revenue (Masked): ${empDashboard.stats.totalRevenue}`);
  console.log(`  - Leads (Masked): ${empDashboard.stats.totalLeads}`);
  console.log(`  - Tasks: ${empDashboard.stats.totalTasks}`);
  console.log(`  - Attendance Status: ${empDashboard.stats.myAttendanceStatus}`);

  if (empDashboard.stats.totalRevenue !== null) {
    throw new Error("SECURITY LEAK: Employee should not see company revenue!");
  }
  if (!empDashboard.authorizedWidgets.includes("upcoming_tasks")) {
    throw new Error("FAIL: Employee must have upcoming_tasks widget!");
  }
  console.log("✓ Employee Self-Service Dashboard Verified OK\n");

  // 7. Verify Dynamic Super Admin Control: Widget Toggling on Custom Role
  console.log("------------------------------------------------------------------------");
  console.log("7. TESTING DYNAMIC SUPER ADMIN WIDGET TOGGLING ON CUSTOM ROLE");
  console.log("------------------------------------------------------------------------");
  const customRole = await Role.create({
    name: "Dynamic Test Role",
    slug: `dynamic-role-${Date.now()}`,
    description: "Testing live Super Admin widget toggling",
    isSystem: false,
    defaultRecordScope: "assigned",
    permissions: [],
    dashboardWidgets: ["personal_bookings", "upcoming_tasks"],
  });

  const customUser = await User.create({
    name: "Dynamic Agent",
    email: `dynamic.agent.${Date.now()}@travelagency.test`,
    passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
    roleId: customRole._id,
    status: "active",
  });
  createdTestUserIds.push(customUser._id);

  // Initial Check: Should have only 2 widgets
  let dynUserPopulated = await User.findById(customUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  let dynSafeUser = await serializeSafeUser(dynUserPopulated);
  let dynDashboard = await getDashboardData(dynSafeUser);

  console.log(`✓ Initial Custom Role Widgets (${dynDashboard.authorizedWidgets.length}): [${dynDashboard.authorizedWidgets.join(", ")}]`);
  if (!dynDashboard.authorizedWidgets.includes("personal_bookings") || dynDashboard.authorizedWidgets.includes("total_revenue")) {
    throw new Error("FAIL: Initial custom role widgets mismatch!");
  }

  // Super Admin Action: Dynamically grant "total_revenue" & "financial_analytics"
  console.log("\n[SUPER ADMIN ACTION] Super Admin adds 'total_revenue' & 'financial_analytics' to this role...");
  customRole.dashboardWidgets.push("total_revenue", "financial_analytics");
  await customRole.save();

  // Re-fetch (Simulating next user page view / API request)
  dynUserPopulated = await User.findById(customUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  dynSafeUser = await serializeSafeUser(dynUserPopulated);
  dynDashboard = await getDashboardData(dynSafeUser);

  console.log(`✓ Updated Custom Role Widgets (${dynDashboard.authorizedWidgets.length}): [${dynDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Revenue (Now Unmasked): ₹${dynDashboard.stats.totalRevenue}`);
  console.log(`  - Chart Months (Now Active): ${dynDashboard.chartData.length}`);

  if (dynDashboard.stats.totalRevenue === null || dynDashboard.chartData.length === 0) {
    throw new Error("FAIL: Dynamic widget toggle did not immediately activate revenue telemetry!");
  }

  // Super Admin Action: Revoke "total_revenue" & "financial_analytics"
  console.log("\n[SUPER ADMIN ACTION] Super Admin revokes financial widgets...");
  customRole.dashboardWidgets = customRole.dashboardWidgets.filter(
    (w) => w !== "total_revenue" && w !== "financial_analytics"
  );
  await customRole.save();

  dynUserPopulated = await User.findById(customUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  dynSafeUser = await serializeSafeUser(dynUserPopulated);
  dynDashboard = await getDashboardData(dynSafeUser);

  console.log(`✓ Final Custom Role Widgets (${dynDashboard.authorizedWidgets.length}): [${dynDashboard.authorizedWidgets.join(", ")}]`);
  console.log(`  - Revenue (Immediately Re-Masked): ${dynDashboard.stats.totalRevenue}`);
  console.log(`  - Chart Months (Immediately Cleared): ${dynDashboard.chartData.length}`);

  if (dynDashboard.stats.totalRevenue !== null || dynDashboard.chartData.length > 0) {
    throw new Error("FAIL: Dynamic widget revoke did not immediately mask revenue telemetry!");
  }
  console.log("✓ Dynamic Super Admin Control Verified 100% Responsive!\n");

  // Cleanup
  console.log("[CLEANUP] Cleaning up test users and custom role...");
  await User.deleteMany({ _id: { $in: createdTestUserIds } });
  await Role.findByIdAndDelete(customRole._id);
  console.log("✓ Cleanup finished successfully.\n");

  console.log("========================================================================");
  console.log("   ALL DASHBOARD RBAC & FINANCIAL SECURITY TESTS PASSED PERFECTLY!     ");
  console.log("========================================================================");

  process.exit(0);
}

runDashboardRbacVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
