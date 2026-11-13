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
  const Role = (await import("../src/models/Role.ts")).default;
  const Permission = (await import("../src/models/Permission.ts")).default;

  const users = await User.find({ status: "active" });
  for (const u of users) {
    const roleId = u.roleId?._id || u.roleId;
    const roleDoc = await Role.findById(roleId).populate("permissions");
    const perms = roleDoc?.permissions || [];
    console.log(`User: ${u.name} (${u.email}) -> Role: ${roleDoc?.name} (${roleDoc?.slug}) -> Populated permissions count: ${perms.length}`);
    if (perms.length > 0) {
      const first = perms[0];
      console.log(`   Sample: module=${first.module}, action=${first.action}, scope=${first.scope}`);
    }
  }

  process.exit(0);
}

test().catch(console.error);

