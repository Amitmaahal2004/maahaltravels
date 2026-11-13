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

    const users = await db.collection("users").find().toArray();
    const roles = await db.collection("roles").find().toArray();
    const roleMap = new Map();
    roles.forEach(r => roleMap.set(r._id.toString(), r));

    const profiles = await db.collection("employeeprofiles").find().toArray();
    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.userId.toString(), p));

    console.log("=== EMPLOYEE ROLE AUDIT ===");
    for (const u of users) {
      const r = roleMap.get(u.roleId?.toString());
      const p = profileMap.get(u._id.toString());
      console.log({
        name: u.name,
        email: u.email,
        roleName: r?.name || "UNASSIGNED",
        roleSlug: r?.slug || "unassigned",
        designation: p?.designation || "N/A",
        employeeId: p?.employeeId || "N/A",
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();

