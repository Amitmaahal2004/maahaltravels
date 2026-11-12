import mongoose from "mongoose";
import fs from "fs";

// Read .env.local or .env
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
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const Department = mongoose.model(
      "Department",
      new mongoose.Schema({
        name: String,
        code: String,
        description: String,
        isActive: Boolean,
      }, { timestamps: true })
    );

    const departments = await Department.find();
    console.log(`Found ${departments.length} departments:`);
    console.log(JSON.stringify(departments, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
