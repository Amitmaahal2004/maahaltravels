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

async function main() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const roles = await db.collection("roles").find().toArray();
    console.log("=== ROLES IN MONGODB ===");
    console.log(roles.map(r => ({ _id: r._id, name: r.name, slug: r.slug, isSystem: r.isSystem, permissionsCount: r.permissions?.length })));

    const users = await db.collection("users").find().toArray();
    console.log("\n=== USERS IN MONGODB ===");
    console.log(users.map(u => ({ _id: u._id, name: u.name, email: u.email, roleId: u.roleId, status: u.status })));

    const permissions = await db.collection("permissions").find().toArray();
    console.log(`\nTotal permissions in DB: ${permissions.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();

