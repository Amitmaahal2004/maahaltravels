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
      break;
    }
  }
}

async function check() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas.");

  const db = mongoose.connection.db;

  const users = await db.collection("users").find({}).toArray();
  const roles = await db.collection("roles").find({}).toArray();
  const permissions = await db.collection("permissions").find({}).toArray();

  console.log(`Found ${users.length} users, ${roles.length} roles, ${permissions.length} permissions.`);

  const roleMap = new Map();
  for (const r of roles) {
    roleMap.set(r._id.toString(), r);
  }

  const permMap = new Map();
  for (const p of permissions) {
    permMap.set(p._id.toString(), p);
  }

  console.log("\n================ USER ROLES & PERMISSIONS AUDIT ================");
  for (const u of users) {
    const role = roleMap.get(u.roleId?.toString());
    const rolePerms = role?.permissions || [];
    const populatedPerms = rolePerms.map(pid => permMap.get(pid.toString())).filter(Boolean);

    console.log({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      status: u.status,
      roleId: u.roleId?.toString(),
      roleName: role?.name,
      roleSlug: role?.slug,
      permissionsRawCount: rolePerms.length,
      permissionsPopulatedCount: populatedPerms.length,
      samplePermissions: populatedPerms.slice(0, 5).map(p => `${p.module}:${p.action}`)
    });
  }

  console.log("\n================ ROLES OVERVIEW ================");
  for (const r of roles) {
    console.log({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      permissionsCount: (r.permissions || []).length,
    });
  }

  process.exit(0);
}

check().catch(console.error);
