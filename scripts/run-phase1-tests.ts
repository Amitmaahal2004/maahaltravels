import connectToDatabase, { disconnectDatabase } from "../src/lib/mongodb";
import { runSeed } from "./seed";
import {
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../src/services/auth.service";
import {
  validateSessionToken,
  serializeSafeUser,
  invalidateSession,
} from "../src/lib/auth/session";
import {
  checkUserPermission,
  createCustomRole,
  getRolesWithPermissions,
} from "../src/services/rbac.service";
import User from "../src/models/User";
import Session from "../src/models/Session";
import Role from "../src/models/Role";
import Permission from "../src/models/Permission";
import ActivityLog from "../src/models/ActivityLog";
import { hashPassword } from "../src/lib/auth/password";

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING PHASE 1: FOUNDATION, AUTH & RBAC TEST SUITE");
  console.log("=======================================================\n");

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, errorDetails?: any) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] Test ${totalCount}: ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] Test ${totalCount}: ${testName}`);
      if (errorDetails) console.error("   Details:", errorDetails);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 0. Seed Database
  console.log("📦 Preparing test database state...");
  await runSeed({ silent: true });

  // -----------------------------------------------------------
  // Test 1: Successful Login
  // -----------------------------------------------------------
  const loginRes = await loginUser("admin@travelagency.com", "Password@123", "127.0.0.1", "TestRunner/1.0");
  assert(loginRes.success === true && !!loginRes.token && !!loginRes.user, "Super Admin successful login with valid credentials");
  assert(loginRes.user?.email === "admin@travelagency.com", "Authenticated user email matches");
  assert(loginRes.user?.role.slug === "super-admin", "Super Admin role is properly resolved");

  // -----------------------------------------------------------
  // Test 2: Session Validation
  // -----------------------------------------------------------
  const rawToken = loginRes.token!;
  const sessionDoc = await validateSessionToken(rawToken);
  assert(!!sessionDoc && sessionDoc.isValid === true, "Session document validated from database");

  const userDoc = await User.findById(sessionDoc?.userId).populate("roleId").populate("departmentId");
  const safeUser = await serializeSafeUser(userDoc!);
  assert(safeUser.name === "Super Administrator", "User profile serialized safely with relations");

  // -----------------------------------------------------------
  // Test 3: Failed Login Attempts & Counter
  // -----------------------------------------------------------
  const wrongPasswordRes = await loginUser("admin@travelagency.com", "WrongPassword!456", "127.0.0.1", "TestRunner/1.0");
  assert(wrongPasswordRes.success === false, "Bad password rejected");
  const checkUserAfter1stFail = await User.findOne({ email: "admin@travelagency.com" });
  assert(checkUserAfter1stFail?.failedLoginAttempts === 1, "Failed login counter incremented to 1");

  // -----------------------------------------------------------
  // Test 4: Brute-Force Lockout Protection (5 consecutive fails)
  // -----------------------------------------------------------
  // Trigger 4 more failed attempts
  await loginUser("admin@travelagency.com", "WrongPassword!456");
  await loginUser("admin@travelagency.com", "WrongPassword!456");
  await loginUser("admin@travelagency.com", "WrongPassword!456");
  const lockoutRes = await loginUser("admin@travelagency.com", "WrongPassword!456");
  assert(lockoutRes.success === false && Boolean(lockoutRes.error?.includes("locked")), "Account is locked after 5 failed login attempts");

  const lockedUser = await User.findOne({ email: "admin@travelagency.com" });
  assert(lockedUser?.isLocked() === true, "User model `isLocked()` returns true");

  // Attempt login even with correct password during lockout
  const attemptDuringLock = await loginUser("admin@travelagency.com", "Password@123");
  assert(attemptDuringLock.success === false && Boolean(attemptDuringLock.error?.includes("locked")), "Login rejected with correct password while locked");

  // Unlock user for remaining tests
  lockedUser!.lockUntil = undefined;
  lockedUser!.failedLoginAttempts = 0;
  await lockedUser!.save();

  // -----------------------------------------------------------
  // Test 5: Session Invalidation / Logout
  // -----------------------------------------------------------
  await invalidateSession(rawToken);
  const recheckSession = await validateSessionToken(rawToken);
  assert(recheckSession === null, "Invalidated session token is rejected upon subsequent verification");

  // -----------------------------------------------------------
  // Test 6: Forgot Password Token Generation
  // -----------------------------------------------------------
  const forgotRes = await requestPasswordReset("admin@travelagency.com", "127.0.0.1", "TestRunner/1.0");
  assert(forgotRes.success === true && !!forgotRes.rawToken, "Cryptographic password reset token generated and hashed");

  // -----------------------------------------------------------
  // Test 7: Reset Password With Token
  // -----------------------------------------------------------
  const resetToken = forgotRes.rawToken!;
  // Weak password should be rejected
  const weakPasswordRes = await resetPasswordWithToken(resetToken, "short");
  assert(weakPasswordRes.success === false, "Weak password rejected by password complexity validator");

  // Valid strong new password
  const resetSuccess = await resetPasswordWithToken(resetToken, "NewAdminPassword#2026");
  assert(resetSuccess.success === true, "Password successfully reset with valid token");

  // Verify can login with new password
  const newLogin = await loginUser("admin@travelagency.com", "NewAdminPassword#2026");
  assert(newLogin.success === true, "Can authenticate with new password after reset");

  // Reset token cannot be reused
  const reuseTokenRes = await resetPasswordWithToken(resetToken, "AnotherPassword#2026");
  assert(reuseTokenRes.success === false, "Used reset token cannot be reused (single-use enforcement)");

  // Restore default password for development convenience
  await resetPasswordWithToken((await requestPasswordReset("admin@travelagency.com")).rawToken!, "Password@123");

  // -----------------------------------------------------------
  // Test 8: Super Admin Dynamic RBAC Bypass
  // -----------------------------------------------------------
  const superAdminCheck = checkUserPermission(safeUser, "packages", "delete");
  assert(superAdminCheck.granted === true && superAdminCheck.scope === "all", "Super Admin possesses unrestricted access to all modules and actions");

  // -----------------------------------------------------------
  // Test 9: Role-Based Permission Enforcement (Specialized Role)
  // -----------------------------------------------------------
  const salesRole = await Role.findOne({ slug: "sales-executive" }).populate("permissions");
  assert(!!salesRole, "Sales Executive role retrieved from database");

  // Create a mock Sales Executive user
  const salesUserDoc = await User.create({
    name: "Alex Sales Rep",
    email: "alex@travelagency.com",
    passwordHash: await hashPassword("Password@123"),
    roleId: salesRole!._id,
    status: "active",
  });
  const salesSafeUser = await serializeSafeUser(salesUserDoc);

  // Sales Executive has leads:view
  const salesLeadCheck = checkUserPermission(salesSafeUser, "leads", "view");
  assert(salesLeadCheck.granted === true, "Sales Executive is granted leads:view permission");

  // Sales Executive does NOT have invoices:delete
  const salesInvoiceCheck = checkUserPermission(salesSafeUser, "invoices", "delete");
  assert(salesInvoiceCheck.granted === false, "Sales Executive is forbidden from invoices:delete");

  // -----------------------------------------------------------
  // Test 10: Record-Level Scope Checking (Own vs Assigned vs Other)
  // -----------------------------------------------------------
  // Let's test a record assigned to this sales user
  const assignedRecordContext = {
    id: "booking_123",
    assignedTo: salesSafeUser.id,
  };
  const checkAssigned = checkUserPermission(salesSafeUser, "bookings", "view", assignedRecordContext);
  assert(checkAssigned.granted === true, "Access granted to record assigned directly to user");

  const unassignedRecordContext = {
    id: "booking_456",
    assignedTo: "another_user_id_999",
  };
  const checkUnassigned = checkUserPermission(salesSafeUser, "bookings", "view", unassignedRecordContext);
  assert(checkUnassigned.granted === false, "Access denied to record assigned to a different user under assigned scope");

  // -----------------------------------------------------------
  // Test 11: Dynamic Custom Role Creation & Matrix Update
  // -----------------------------------------------------------
  const customPerms = await Permission.find({ module: "packages", action: "view" });
  const newRoleRes = await createCustomRole({
    name: "Tour Guide Lead",
    slug: "tour-guide-lead",
    description: "Lead guide managing itineraries and traveler groups",
    defaultRecordScope: "assigned",
    permissionIds: customPerms.map((p) => p._id.toString()),
  }, safeUser);
  assert(newRoleRes.success === true && !!newRoleRes.role, "Custom role created dynamically in MongoDB");

  const allRoles = await getRolesWithPermissions();
  const createdRoleFound = allRoles.some((r) => r.slug === "tour-guide-lead");
  assert(createdRoleFound, "Newly created custom role listed with permissions");

  // -----------------------------------------------------------
  // Test 12: Audit Trail Logging
  // -----------------------------------------------------------
  const auditEntries = await ActivityLog.find({ module: "auth" }).sort({ timestamp: -1 });
  assert(auditEntries.length >= 5, "Audit log records created for login, failed login, and password operations");

  console.log("\n=======================================================");
  console.log(`🎉 ALL ${passedCount}/${totalCount} PHASE 1 TESTS PASSED SUCCESSFULLY!`);
  console.log("=======================================================\n");

  await disconnectDatabase();
}

runTestSuite().catch(async (err) => {
  console.error("❌ Test suite encountered an error:", err);
  await disconnectDatabase();
  process.exit(1);
});

