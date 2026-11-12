import fs from "fs";
import path from "path";

// Safely preload .env.local or .env if running standalone via tsx
function loadEnvFile() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");
  const fileToLoad = fs.existsSync(envLocalPath) ? envLocalPath : fs.existsSync(envPath) ? envPath : null;

  if (fileToLoad) {
    const content = fs.readFileSync(fileToLoad, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnvFile();

import connectToDatabase, { disconnectDatabase } from "../src/lib/mongodb";
import Permission from "../src/models/Permission";
import Role from "../src/models/Role";
import Department from "../src/models/Department";
import User from "../src/models/User";
import SystemSetting from "../src/models/SystemSetting";
import { SYSTEM_MODULES, PERMISSION_ACTIONS, DEFAULT_ROLES } from "../src/config/permissions.config";
import { hashPassword } from "../src/lib/auth/password";

export async function runSeed(options: { silent?: boolean } = {}) {
  const log = (...args: any[]) => {
    if (!options.silent) console.log(...args);
  };

  log("🌱 Starting Travel Agency CRM Database Initialization...");
  await connectToDatabase();

  // 1. Seed System Permissions
  log("1️⃣ Seeding System Permissions...");
  const permissionDocs = [];
  for (const mod of SYSTEM_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      const existing = await Permission.findOne({ module: mod.id, action });
      if (!existing) {
        const created = await Permission.create({
          module: mod.id,
          action,
          scope: "all",
          description: `Permission to ${action} ${mod.label}`,
        });
        permissionDocs.push(created);
      } else {
        permissionDocs.push(existing);
      }
    }
  }
  log(`   Total system permissions cataloged: ${permissionDocs.length}`);

  // 2. Seed Default Department
  log("2️⃣ Seeding Default Departments...");
  let hqDept = await Department.findOne({ code: "HQ" });
  if (!hqDept) {
    hqDept = await Department.create({
      name: "Headquarters & Management",
      code: "HQ",
      description: "Executive and administrative headquarters",
      isActive: true,
    });
    log("   Created HQ Department");
  }

  let salesDept = await Department.findOne({ code: "SALES" });
  if (!salesDept) {
    salesDept = await Department.create({
      name: "Sales & CRM",
      code: "SALES",
      description: "Direct sales, client consulting, and package bookings",
      isActive: true,
    });
    log("   Created Sales Department");
  }

  let opsDept = await Department.findOne({ code: "OPS" });
  if (!opsDept) {
    opsDept = await Department.create({
      name: "Ground Operations & Logistics",
      code: "OPS",
      description: "Tour execution, fleet management, and ground logistics",
      isActive: true,
    });
    log("   Created Operations Department");
  }

  // 3. Seed Roles with targeted permissions
  log("3️⃣ Seeding Roles & Permission Matrices...");
  const allPermissionIds = permissionDocs.map((p) => p._id);

  for (const r of DEFAULT_ROLES) {
    let roleDoc = await Role.findOne({ slug: r.slug });
    let rolePerms = allPermissionIds;

    // Filter permissions for specialized roles
    if (r.slug === "hr-manager") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["employees", "departments", "attendance", "leaves", "tasks", "reports"].includes(
            p.module
          )
        )
        .map((p) => p._id);
    } else if (r.slug === "operations-manager") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["operations", "packages", "destinations", "bookings", "vendors", "tasks"].includes(
            p.module
          )
        )
        .map((p) => p._id);
    } else if (r.slug === "sales-manager") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["leads", "customers", "quotations", "bookings", "packages", "destinations", "reports"].includes(
            p.module
          )
        )
        .map((p) => p._id);
    } else if (r.slug === "sales-executive") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["leads", "customers", "quotations", "bookings", "packages", "destinations"].includes(
            p.module
          )
        )
        .map((p) => p._id);
    } else if (r.slug === "accountant") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["invoices", "payments", "expenses", "vendors", "reports"].includes(p.module)
        )
        .map((p) => p._id);
    } else if (r.slug === "employee") {
      rolePerms = permissionDocs
        .filter((p) =>
          ["tasks", "attendance", "leaves", "notifications"].includes(p.module)
        )
        .map((p) => p._id);
    }

    if (!roleDoc) {
      roleDoc = await Role.create({
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: true,
        permissions: rolePerms,
        defaultRecordScope: r.slug === "super-admin" || r.slug === "admin" ? "all" : "assigned",
      });
      log(`   Created role: ${r.name}`);
    } else {
      // Ensure super-admin always possesses full permission array
      if (r.slug === "super-admin") {
        roleDoc.permissions = allPermissionIds as any;
        await roleDoc.save();
      }
    }
  }

  // 4. Seed Super Admin User (Idempotent, configurable via ENV)
  log("4️⃣ Seeding Default Super Administrator...");
  const superAdminRole = await Role.findOne({ slug: "super-admin" });
  if (!superAdminRole) {
    throw new Error("Super Admin role not found!");
  }

  const superAdminEmail = (process.env.ADMIN_EMAIL || "admin@travelagency.com").toLowerCase().trim();
  const rawAdminPassword = process.env.ADMIN_PASSWORD || "Password@123";

  let superAdmin = await User.findOne({ email: superAdminEmail });
  if (!superAdmin) {
    const passwordHash = await hashPassword(rawAdminPassword);
    superAdmin = await User.create({
      name: "Super Administrator",
      email: superAdminEmail,
      phone: "+91 98765 43210",
      passwordHash,
      roleId: superAdminRole._id,
      departmentId: hqDept._id,
      status: "active",
      isEmailVerified: true,
    });
    log(`   Created Super Admin: ${superAdminEmail}`);
  } else {
    // If admin already exists, ensure role is superAdmin and status is active
    superAdmin.roleId = superAdminRole._id;
    superAdmin.status = "active";
    await superAdmin.save();
    log(`   Super Admin verified and active: ${superAdminEmail}`);
  }

  // 5. Seed System Settings
  log("5️⃣ Seeding System Settings...");
  let genSettings = await SystemSetting.findOne({ key: "general" });
  if (!genSettings) {
    await SystemSetting.create({
      key: "general",
      value: {
        agencyName: "Himalayan Vistas & Beyond",
        tagline: "Curated Expeditions & Bespoke Travel",
        contactEmail: "info@travelagency.com",
        contactPhone: "+91 98765 43210",
        whatsappNumber: "+91 98765 43210",
        address: "The Mall Road, Manali, Himachal Pradesh, India",
        currency: "INR",
        timezone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
      },
    });
    log("   Created General Settings");
  }

  let finSettings = await SystemSetting.findOne({ key: "financial" });
  if (!finSettings) {
    await SystemSetting.create({
      key: "financial",
      value: {
        gstNumber: "02AAAAA0000A1Z5",
        gstRate: 5,
        invoicePrefix: "INV-",
        bookingPrefix: "BKG-",
        quotationPrefix: "QTN-",
      },
    });
    log("   Created Financial Settings");
  }

  log("✅ Database Initialization Completed Successfully!\n");
  return { superAdminEmail, superAdminPassword: rawAdminPassword };
}

// Direct execution entrypoint
if (require.main === module) {
  runSeed()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Seed failed:", err);
      await disconnectDatabase();
      process.exit(1);
    });
}
