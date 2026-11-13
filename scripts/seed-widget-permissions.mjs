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

async function seedWidgets() {
  console.log("Connecting to MongoDB Atlas to seed dashboard widget permissions...");
  await mongoose.connect(uri);

  const Role = (await import("../src/models/Role.ts")).default;
  const { getDefaultWidgetsForRole, DASHBOARD_WIDGETS } = await import("../src/config/widgets.config.ts");

  console.log(`Total configured widgets: ${DASHBOARD_WIDGETS.length}`);

  const roles = await Role.find({});
  for (const role of roles) {
    const defaultWidgets = getDefaultWidgetsForRole(role.slug);
    role.dashboardWidgets = defaultWidgets;
    await role.save();
    console.log(`✓ Role "${role.name}" (${role.slug}): Assigned ${defaultWidgets.length} widgets.`);
  }

  console.log("\nAll system roles seeded with default dashboard widgets successfully!");
  process.exit(0);
}

seedWidgets().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

