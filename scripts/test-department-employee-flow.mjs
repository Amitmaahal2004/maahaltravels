import mongoose from "mongoose";
import fs from "fs";
import bcrypt from "bcryptjs";

// Read MONGODB_URI
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

async function runTests() {
  console.log("=== STARTING DEPARTMENT & EMPLOYEE INTEGRATION TESTS ===");
  console.log("1. Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("-> Connected successfully!");

  const DepartmentSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true, trim: true },
      code: { type: String, required: true, unique: true, uppercase: true, trim: true },
      description: { type: String, trim: true },
      managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );
  const Department = mongoose.models.Department || mongoose.model("Department", DepartmentSchema);

  const UserSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      passwordHash: { type: String, required: true },
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
      departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
      status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    },
    { timestamps: true }
  );
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const RoleSchema = new mongoose.Schema({
    name: String,
    slug: String,
  }, { timestamps: true });
  const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);

  const EmployeeProfileSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
      employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
      designation: { type: String, required: true, trim: true },
      departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
      salary: {
        basic: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
      },
      status: { type: String, default: "active" },
    },
    { timestamps: true }
  );
  const EmployeeProfile =
    mongoose.models.EmployeeProfile || mongoose.model("EmployeeProfile", EmployeeProfileSchema);

  // Test 1: Fetch all departments
  console.log("\n2. Testing Department retrieval...");
  const initialDepts = await Department.find().sort({ name: 1 });
  console.log(`-> Found ${initialDepts.length} departments in MongoDB:`);
  initialDepts.forEach((d) => console.log(`   - [${d.code}] ${d.name} (Active: ${d.isActive}) (ID: ${d._id})`));
  if (initialDepts.length === 0) throw new Error("Expected at least 1 department in database");

  // Test 2: Create a new Department
  console.log("\n3. Testing New Department Creation...");
  const testDeptCode = `EXP${Date.now().toString().slice(-4)}`;
  const testDeptName = `Expedition Unit ${testDeptCode}`;
  const newDept = await Department.create({
    name: testDeptName,
    code: testDeptCode,
    description: "High-altitude extreme expedition planning division",
    isActive: true,
  });
  console.log(`-> Created Department: [${newDept.code}] ${newDept.name} (ID: ${newDept._id})`);

  // Test 3: Verify the newly created department is retrieved
  console.log("\n4. Verifying New Department Appears in Active Query...");
  const activeDepts = await Department.find({ isActive: true });
  const foundInActive = activeDepts.some((d) => d._id.toString() === newDept._id.toString());
  console.log(`-> New department returned in active query? ${foundInActive ? "YES (PASSED)" : "NO (FAILED)"}`);
  if (!foundInActive) throw new Error("New department not found in active query");

  // Test 4: Create an Employee attached to this department
  console.log("\n5. Testing Employee Registration with Department Assignment...");
  const defaultRole = await Role.findOne() || { _id: new mongoose.Types.ObjectId() };
  const testEmail = `test.staff.${Date.now()}@travelagency.com`;
  const pwdHash = await bcrypt.hash("Password@123", 10);

  const testUser = await User.create({
    name: "Tenzing Norgay Specialist",
    email: testEmail,
    phone: "+91 98888 12345",
    passwordHash: pwdHash,
    roleId: defaultRole._id,
    departmentId: newDept._id,
    status: "active",
  });

  const empProfile = await EmployeeProfile.create({
    userId: testUser._id,
    employeeId: `EMP-${Date.now().toString().slice(-4)}`,
    designation: "Expedition Master",
    departmentId: newDept._id,
    salary: { basic: 50000, allowances: 7500, currency: "INR" },
    status: "active",
  });
  console.log(`-> Registered Employee: ${testUser.name} (${testUser.email})`);
  console.log(`-> Stored User.departmentId: ${testUser.departmentId}`);
  console.log(`-> Stored EmployeeProfile.departmentId: ${empProfile.departmentId}`);

  if (testUser.departmentId.toString() !== newDept._id.toString()) {
    throw new Error("User.departmentId does not match Department ObjectId!");
  }
  if (empProfile.departmentId.toString() !== newDept._id.toString()) {
    throw new Error("EmployeeProfile.departmentId does not match Department ObjectId!");
  }
  console.log("-> Employee Department Assignment: PASSED");

  // Test 5: Verify Population of Department on Employee
  console.log("\n6. Testing Population of Department Reference...");
  const populatedUser = await User.findById(testUser._id).populate("departmentId");
  console.log(`-> Populated Department Name: ${(populatedUser.departmentId).name}`);
  console.log(`-> Populated Department Code: ${(populatedUser.departmentId).code}`);
  if ((populatedUser.departmentId).name !== testDeptName) {
    throw new Error("Populated department name does not match expected!");
  }
  console.log("-> Population Verification: PASSED");

  // Test 6: Update Employee Department Assignment
  console.log("\n7. Testing Employee Department Reassignment (Edit Flow)...");
  const anotherDept = initialDepts.find((d) => d._id.toString() !== newDept._id.toString());
  if (anotherDept) {
    testUser.departmentId = anotherDept._id;
    await testUser.save();
    empProfile.departmentId = anotherDept._id;
    await empProfile.save();

    const updatedUser = await User.findById(testUser._id).populate("departmentId");
    console.log(`-> Reassigned to Department: ${(updatedUser.departmentId).name} (${(updatedUser.departmentId).code})`);
    if ((updatedUser.departmentId)._id.toString() !== anotherDept._id.toString()) {
      throw new Error("Reassignment did not persist!");
    }
    console.log("-> Reassignment Verification: PASSED");
  }

  // Cleanup test employee & test department
  console.log("\n8. Cleaning up test artifacts...");
  await EmployeeProfile.findByIdAndDelete(empProfile._id);
  await User.findByIdAndDelete(testUser._id);
  await Department.findByIdAndDelete(newDept._id);
  console.log("-> Test artifacts cleaned up successfully!");

  await mongoose.disconnect();
  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test Failed:", err);
  process.exit(1);
});

