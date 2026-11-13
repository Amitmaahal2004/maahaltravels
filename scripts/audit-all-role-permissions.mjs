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

async function audit() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const roles = await db.collection("roles").find({}).toArray();
  const permissions = await db.collection("permissions").find({}).toArray();

  const permMap = new Map();
  for (const p of permissions) {
    permMap.set(p._id.toString(), p);
  }

  console.log("================= ALL ROLES DETAILED PERMISSIONS AUDIT =================");
  for (const r of roles) {
    const perms = (r.permissions || []).map(pid => permMap.get(pid.toString())).filter(Boolean);
    const viewModules = perms.filter(p => p.action === "view").map(p => p.module);
    const manageModules = perms.filter(p => p.action === "manage").map(p => p.module);
    const actionsByModule = {};
    for (const p of perms) {
      if (!actionsByModule[p.module]) actionsByModule[p.module] = [];
      actionsByModule[p.module].push(p.action);
    }

    console.log(`\n--- ROLE: ${r.name} (${r.slug}) ---`);
    console.log(`Total permissions: ${perms.length}`);
    console.log(`Modules with 'view' action (${viewModules.length}):`, viewModules);
    console.log(`Modules with 'manage' action (${manageModules.length}):`, manageModules);
    console.log(`All Modules mapped:`, Object.keys(actionsByModule));
  }

  process.exit(0);
}

audit().catch(console.error);

