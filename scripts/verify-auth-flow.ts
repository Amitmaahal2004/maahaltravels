import fs from "fs";
import path from "path";

function loadEnvFile() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");
  const fileToLoad = fs.existsSync(envLocalPath) ? envLocalPath : fs.existsSync(envPath) ? envPath : null;

  if (fileToLoad) {
    const content = fs.readFileSync(fileToLoad, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnvFile();

import connectToDatabase, { disconnectDatabase } from "../src/lib/mongodb";
import "../src/models";
import User from "../src/models/User";
import Session from "../src/models/Session";
import { hashToken } from "../src/lib/auth/password";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

async function runVerification() {
  console.log("\n=======================================================");
  console.log("🔍 COMPREHENSIVE AUTHENTICATION & DATABASE VERIFICATION");
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log("=======================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string, details?: any) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Step ${total}: ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Step ${total}: ${title}`);
      if (details) console.error("   Details:", details);
      throw new Error(`Assertion failed: ${title}`);
    }
  }

  // 1. Direct MongoDB Connection
  console.log("📡 Connecting directly to MongoDB Atlas...");
  const conn = await connectToDatabase();
  assert(conn.connection.readyState === 1, "Direct MongoDB Atlas connection established successfully");

  // 2. Verify Admin Account in Atlas
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@travelagency.com").toLowerCase().trim();
  const adminUser = await User.findOne({ email: adminEmail }).populate("roleId");
  assert(!!adminUser, `Admin account exists in MongoDB Atlas (${adminEmail})`);
  assert(adminUser?.status === "active", "Admin account status is active");
  assert((adminUser?.roleId as any)?.slug === "super-admin", "Admin user possesses 'super-admin' role");

  // 3. Test Missing Credentials (HTTP 400)
  console.log("\n🧪 Testing API Request Validation...");
  const missingRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(missingRes.status === 400, "Missing credentials returns HTTP 400 Bad Request");

  // 4. Test Malformed Email (HTTP 400)
  const badEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "Password@123" }),
  });
  assert(badEmailRes.status === 400, "Malformed email address returns HTTP 400 Bad Request");

  // 5. Test Non-existent User (HTTP 401)
  const nonExistentRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ghost.user@travelagency.com", password: "Password@123" }),
  });
  assert(nonExistentRes.status === 401, "Non-existent user returns HTTP 401 Unauthorized");

  // 6. Test Incorrect Password (HTTP 401)
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: "IncorrectPassword!999" }),
  });
  assert(wrongPassRes.status === 401, "Incorrect password returns HTTP 401 Unauthorized");

  // 7. Test Successful Login (HTTP 200 + Cookie)
  console.log("\n🔑 Testing Valid Admin Authentication...");
  const correctPassword = process.env.ADMIN_PASSWORD || "Password@123";
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: correctPassword }),
  });

  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success === true, "Valid admin credentials returns HTTP 200 OK");
  assert(loginData.user?.email === adminEmail, "Returned authenticated user email matches admin account");
  assert(loginData.user?.role?.slug === "super-admin", "Returned role is super-admin");

  // Extract session cookie from headers
  const rawCookieHeader = loginRes.headers.get("set-cookie") || "";
  const match = rawCookieHeader.match(/crm_session=([^;]+)/);
  const sessionToken = match ? match[1] : null;
  assert(!!sessionToken, "HttpOnly 'crm_session' cookie received in response headers");

  // 8. Verify Session in Database
  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    const dbSession = await Session.findOne({ tokenHash, isValid: true });
    assert(!!dbSession, "Session document verified in MongoDB Atlas database");
    assert(dbSession?.userId?.toString() === adminUser?._id?.toString(), "Session userId correctly points to admin user ID");
  }

  // 9. Test Protected Dashboard Access with Session Cookie
  console.log("\n🛡️ Testing Protected Routes Access...");
  const authHeaders = { Cookie: `crm_session=${sessionToken}` };

  const dashboardRes = await fetch(`${BASE_URL}/crm/dashboard`, {
    headers: authHeaders,
    redirect: "manual",
  });
  assert(dashboardRes.status === 200, "Authenticated request to /crm/dashboard returns HTTP 200 OK (Access Granted)");

  // 10. Test Protected Roles Admin Page with Session Cookie
  const rolesRes = await fetch(`${BASE_URL}/crm/admin/roles`, {
    headers: authHeaders,
    redirect: "manual",
  });
  assert(rolesRes.status === 200, "Authenticated request to /crm/admin/roles returns HTTP 200 OK (RBAC Access Granted)");

  // 11. Test Unauthenticated Access to Dashboard
  const unauthRes = await fetch(`${BASE_URL}/crm/dashboard`, {
    redirect: "manual",
  });
  assert(unauthRes.status === 307 && unauthRes.headers.get("location")?.includes("/crm/login"), "Unauthenticated request to /crm/dashboard is redirected to /crm/login");

  // 12. Test Logout
  console.log("\n🚪 Testing Logout & Session Invalidation...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: authHeaders,
  });
  assert(logoutRes.status === 200, "Logout API returns HTTP 200 OK");

  // Verify session invalidated in DB
  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    const postLogoutSession = await Session.findOne({ tokenHash });
    assert(postLogoutSession?.isValid === false || !postLogoutSession, "Session marked invalid in MongoDB Atlas after logout");
  }

  // 13. Test Post-Logout Access with Old Cookie
  const postLogoutAccess = await fetch(`${BASE_URL}/crm/dashboard`, {
    headers: authHeaders,
    redirect: "manual",
  });
  assert(postLogoutAccess.status === 307, "Subsequent request with invalidated session cookie is rejected and redirected");

  console.log("\n=======================================================");
  console.log(`🎉 ALL ${passed}/${total} AUTHENTICATION & DATABASE TESTS PASSED!`);
  console.log("=======================================================\n");

  await disconnectDatabase();
}

runVerification().catch(async (err) => {
  console.error("❌ Verification failed:", err);
  await disconnectDatabase();
  process.exit(1);
});
