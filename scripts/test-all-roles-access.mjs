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

async function runGlobalRbacTests() {
  console.log("==================================================================");
  console.log("   GLOBAL MULTI-ROLE RBAC, DASHBOARD & NAVIGATION VERIFICATION   ");
  console.log("==================================================================\n");

  await mongoose.connect(uri);

  const User = (await import("../src/models/User.ts")).default;
  const Role = (await import("../src/models/Role.ts")).default;
  const Permission = (await import("../src/models/Permission.ts")).default;
  const { serializeSafeUser } = await import("../src/lib/auth/session.ts");
  const { checkUserPermission } = await import("../src/services/rbac.service.ts");
  const { getDashboardData } = await import("../src/services/dashboard.service.ts");

  // All 20 CRM Sidebar module IDs
  const ALL_MODULES = [
    "roles", "settings", "leads", "customers", "quotations", "packages",
    "destinations", "bookings", "operations", "employees", "departments",
    "attendance", "leaves", "invoices", "payments", "expenses", "vendors",
    "website_cms", "tasks", "reports"
  ];

  // Helper to evaluate sidebar visibility
  function evaluateSidebarVisibility(safeUser) {
    const isSuperAdmin = safeUser.role.slug === "super-admin" || safeUser.role.slug === "admin";
    const visibleModules = [];
    const hiddenModules = [];

    for (const mod of ALL_MODULES) {
      const isVisible = isSuperAdmin || safeUser.permissions.some(
        (p) => p.module === mod && (p.action === "view" || p.action === "manage")
      );
      if (isVisible) {
        visibleModules.push(mod);
      } else {
        hiddenModules.push(mod);
      }
    }
    return { visibleModules, hiddenModules };
  }

  // 1. Audit all 8 System Roles
  const systemRoles = await Role.find({ isSystem: true }).sort({ slug: 1 });
  console.log(`[AUDIT] Found ${systemRoles.length} system roles in MongoDB Atlas.\n`);

  const createdTestUserIds = [];

  for (const role of systemRoles) {
    console.log(`------------------------------------------------------------------`);
    console.log(`TESTING ROLE: ${role.name} (${role.slug})`);
    console.log(`------------------------------------------------------------------`);

    // Find or create a user for this role
    let user = await User.findOne({ roleId: role._id, status: "active" });
    if (!user) {
      user = await User.create({
        name: `Test ${role.name}`,
        email: `test.${role.slug}.${Date.now()}@travelagency.test`,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
        roleId: role._id,
        status: "active",
      });
      createdTestUserIds.push(user._id);
    }

    // Step 1: User & Role Resolution
    const userWithRole = await User.findById(user._id).populate({
      path: "roleId",
      populate: { path: "permissions" },
    }).populate("departmentId");

    const safeUser = await serializeSafeUser(userWithRole);
    console.log(`✓ Resolved User: ${safeUser.name} (${safeUser.email})`);
    console.log(`✓ Resolved Role: ${safeUser.role.name} [slug: ${safeUser.role.slug}]`);
    console.log(`✓ Effective Permissions Count: ${safeUser.permissions.length}`);

    if (safeUser.permissions.length === 0 && safeUser.role.slug !== "super-admin") {
      throw new Error(`CRITICAL FAILURE: Zero permissions resolved for role ${role.name}!`);
    }

    // Step 2: Sidebar Navigation
    const { visibleModules, hiddenModules } = evaluateSidebarVisibility(safeUser);
    console.log(`✓ Sidebar Visible Modules (${visibleModules.length}): [${visibleModules.join(", ")}]`);
    console.log(`✓ Sidebar Hidden Modules (${hiddenModules.length}): [${hiddenModules.slice(0, 5).join(", ")}${hiddenModules.length > 5 ? "..." : ""}]`);

    if (safeUser.role.slug === "super-admin" || safeUser.role.slug === "admin") {
      if (visibleModules.length !== 20) {
        throw new Error(`CRITICAL FAILURE: ${role.name} must see all 20 modules! Saw: ${visibleModules.length}`);
      }
    } else {
      if (visibleModules.length === 0) {
        throw new Error(`CRITICAL FAILURE: ${role.name} has 0 visible modules!`);
      }
      if (hiddenModules.length === 0) {
        throw new Error(`CRITICAL FAILURE: Non-admin ${role.name} has no hidden modules!`);
      }
    }

    // Step 3: Dashboard Service & Telemetry
    const dashboardData = await getDashboardData(safeUser);
    console.log(`✓ Dashboard Data Computed Successfully:`);
    console.log(`  - Total Bookings: ${dashboardData.stats.totalBookings}`);
    console.log(`  - Total Revenue: ₹${dashboardData.stats.totalRevenue}`);
    console.log(`  - Chart Months: ${dashboardData.chartData.length}`);
    console.log(`  - Recent Bookings: ${dashboardData.recentBookings.length}`);
    console.log(`  - Recent Leads: ${dashboardData.recentLeads.length}`);
    console.log(`  - Upcoming Trips: ${dashboardData.upcomingTrips.length}`);
    console.log(`  - Total Tasks: ${dashboardData.stats.totalTasks ?? 0}`);
    console.log(`  - Attendance Status: ${dashboardData.stats.myAttendanceStatus}`);

    // Step 4: Page Route Access Checks
    for (const mod of visibleModules.slice(0, 3)) {
      const check = checkUserPermission(safeUser, mod, "view");
      if (!check.granted) {
        throw new Error(`CRITICAL: Page access for visible module '${mod}' was denied!`);
      }
    }
    for (const mod of hiddenModules.slice(0, 2)) {
      const check = checkUserPermission(safeUser, mod, "view");
      if (check.granted) {
        throw new Error(`CRITICAL: Page access for hidden module '${mod}' was mistakenly granted!`);
      }
    }
    console.log(`✓ Page Route Access Gates Verified OK\n`);
  }

  // 2. Test Custom Role Lifecycle
  console.log(`------------------------------------------------------------------`);
  console.log(`TESTING CUSTOM ROLE: Custom Travel Specialist`);
  console.log(`------------------------------------------------------------------`);

  const customPerms = await Permission.find({
    module: { $in: ["leads", "bookings", "tasks"] },
    action: "view",
  });
  const customRole = await Role.create({
    name: "Custom Travel Specialist",
    slug: `custom-specialist-${Date.now()}`,
    description: "Custom role for testing dynamic access",
    isSystem: false,
    defaultRecordScope: "assigned",
    permissions: customPerms.map((p) => p._id),
  });

  const customUser = await User.create({
    name: "Custom Agent Test",
    email: `custom.agent.${Date.now()}@travelagency.test`,
    passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789",
    roleId: customRole._id,
    status: "active",
  });
  createdTestUserIds.push(customUser._id);

  const customUserWithRole = await User.findById(customUser._id).populate({
    path: "roleId",
    populate: { path: "permissions" },
  });
  const customSafeUser = await serializeSafeUser(customUserWithRole);

  console.log(`✓ Resolved Custom User: ${customSafeUser.name}`);
  console.log(`✓ Custom Role: ${customSafeUser.role.name} (${customSafeUser.role.slug})`);
  console.log(`✓ Custom Permissions Count: ${customSafeUser.permissions.length}`);

  const customSidebar = evaluateSidebarVisibility(customSafeUser);
  console.log(`✓ Custom Visible Modules: [${customSidebar.visibleModules.join(", ")}]`);
  console.log(`✓ Custom Hidden Modules: [${customSidebar.hiddenModules.slice(0, 5).join(", ")}...]`);

  if (!customSidebar.visibleModules.includes("leads") || !customSidebar.visibleModules.includes("bookings") || !customSidebar.visibleModules.includes("tasks")) {
    throw new Error("Custom role missing assigned modules!");
  }
  if (customSidebar.visibleModules.includes("invoices") || customSidebar.visibleModules.includes("roles")) {
    throw new Error("Custom role has unauthorized modules visible!");
  }

  const customDashboard = await getDashboardData(customSafeUser);
  console.log(`✓ Custom Role Dashboard Rendered (Tasks: ${customDashboard.stats.totalTasks ?? 0}, Bookings: ${customDashboard.stats.totalBookings})`);

  // Step 5: Test Dynamic Role Permission Update & Immediate Reflection
  console.log(`\n[DYNAMIC UPDATE] Granting 'invoices:view' to custom role...`);
  const invoicePerm = await Permission.findOne({ module: "invoices", action: "view" });
  if (invoicePerm) {
    customRole.permissions.push(invoicePerm._id);
    await customRole.save();

    // Re-serialize user (simulating next request)
    const refreshedUser = await User.findById(customUser._id).populate({
      path: "roleId",
      populate: { path: "permissions" },
    });
    const refreshedSafeUser = await serializeSafeUser(refreshedUser);
    const refreshedSidebar = evaluateSidebarVisibility(refreshedSafeUser);

    console.log(`✓ After Role Update: Visible Modules include invoices: ${refreshedSidebar.visibleModules.includes("invoices")}`);
    if (!refreshedSidebar.visibleModules.includes("invoices")) {
      throw new Error("Dynamic permission update failed to reflect immediately!");
    }
  }

  // Cleanup test users and custom role
  console.log(`\n[CLEANUP] Cleaning up test records...`);
  await User.deleteMany({ _id: { $in: createdTestUserIds } });
  await Role.findByIdAndDelete(customRole._id);
  console.log(`✓ Test records cleaned up successfully.`);

  console.log("\n==================================================================");
  console.log("   ALL ROLES VERIFIED: PERMISSIONS, DASHBOARD & NAVIGATION 100% OK ");
  console.log("==================================================================");

  process.exit(0);
}

runGlobalRbacTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

