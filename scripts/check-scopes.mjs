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

async function checkScopes() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const roles = await db.collection("roles").find({}).toArray();
  for (const r of roles) {
    console.log({
      name: r.name,
      slug: r.slug,
      defaultRecordScope: r.defaultRecordScope,
    });
  }
  process.exit(0);
}

checkScopes().catch(console.error);

