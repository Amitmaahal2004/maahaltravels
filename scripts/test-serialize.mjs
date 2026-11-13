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

  const User = (await import("../src/models/User.ts")).default;
  const { serializeSafeUser } = await import("../src/lib/auth/session.ts");

  console.log("=== Testing real serializeSafeUser from src/lib/auth/session.ts ===");
  const users = await User.find({ status: "active" }).populate({
    path: "roleId",
    populate: { path: "permissions" }
  }).populate("departmentId");

  for (const u of users) {
    const safeUser = await serializeSafeUser(u);
    console.log(`User: ${safeUser.name} (${safeUser.email}) -> Role: ${safeUser.role.name} (${safeUser.role.slug}) -> Permissions: ${safeUser.permissions.length}`);
    const viewPerms = safeUser.permissions.filter(p => p.action === "view").map(p => p.module);
    console.log(`   View modules (${viewPerms.length}):`, viewPerms);
  }

  process.exit(0);
}

test().catch(console.error);
