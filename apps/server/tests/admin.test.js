const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const http = require("http");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Otp = require("../src/models/otp.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function runTests() {
  console.log("🚀 Starting Admin API Automated Tests...\n");

  const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  await mongoose.connect(mongoUri);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  async function requestApi(endpoint, { method = "GET", body, token } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data };
  }

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "midhun.s@zerone-consulting.com").toLowerCase();
    const adminUser = await User.findOne({ email: adminEmail });
    assert(adminUser && adminUser.role === "admin", "Admin user exists in DB with role 'admin'");

    const customerUser = await User.findOne({ role: "customer" });
    assert(customerUser && customerUser.role === "customer", `Customer user exists in DB: ${customerUser?.email}`);

    // Test 1: Customer email requests admin OTP
    const custRes = await requestApi("/api/admin/auth/request-otp", {
      method: "POST",
      body: { email: customerUser.email },
    });
    assert(custRes.status === 403, `Customer requesting admin OTP returns 403 Forbidden (Got ${custRes.status})`);

    // Test 2: Non-existent email requests admin OTP
    const nonExistentRes = await requestApi("/api/admin/auth/request-otp", {
      method: "POST",
      body: { email: "doesnotexist@example.com" },
    });
    assert(nonExistentRes.status === 404, `Non-existent email requesting admin OTP returns 404 (Got ${nonExistentRes.status})`);

    // Test 3: Admin requests OTP
    const adminOtpRes = await requestApi("/api/admin/auth/request-otp", {
      method: "POST",
      body: { email: adminEmail },
    });
    assert(adminOtpRes.status === 200, `Admin requesting OTP returns 200 OK (Got ${adminOtpRes.status})`);
    assert(adminOtpRes.body.otp === undefined, "OTP is NOT exposed in response body");
    assert(adminOtpRes.body.message === "OTP sent to your registered mobile number", "Correct user-facing OTP message returned");

    // Test 4: Verify with wrong OTP
    const wrongOtpRes = await requestApi("/api/admin/auth/verify-otp", {
      method: "POST",
      body: { email: adminEmail, otp: "999999" },
    });
    assert(wrongOtpRes.status === 400, `Wrong OTP returns 400 Bad Request (Got ${wrongOtpRes.status})`);

    // Set known OTP in DB to test verification securely
    const testOtp = "789123";
    const hashed = await bcrypt.hash(testOtp, 10);
    await Otp.findOneAndUpdate(
      { phone: adminUser.phone, purpose: "ADMIN_LOGIN" },
      { otp: hashed, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    );

    // Test 5: Verify with valid OTP
    const validOtpRes = await requestApi("/api/admin/auth/verify-otp", {
      method: "POST",
      body: { email: adminEmail, otp: testOtp },
    });
    assert(validOtpRes.status === 200, `Valid OTP returns 200 OK (Got ${validOtpRes.status})`);
    assert(validOtpRes.body.data?.token !== undefined, "JWT token returned in response");
    assert(validOtpRes.body.data?.user?.role === "admin", "User role in response is 'admin'");
    const adminToken = validOtpRes.body.data.token;

    // Test 6: Re-verifying the same OTP fails (Single-use OTP)
    const reuseOtpRes = await requestApi("/api/admin/auth/verify-otp", {
      method: "POST",
      body: { email: adminEmail, otp: testOtp },
    });
    assert(reuseOtpRes.status === 400, `Reusing OTP returns 400 (Single-use verified)`);

    // Test 7: Unauthenticated call to /api/admin/dashboard
    const unauthRes = await requestApi("/api/admin/dashboard");
    assert(unauthRes.status === 401, `Unauthenticated request returns 401 (Got ${unauthRes.status})`);

    // Test 8: Customer token call to /api/admin/dashboard
    const customerToken = jwt.sign(
      { userId: customerUser._id, role: customerUser.role || "customer", email: customerUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const custDashRes = await requestApi("/api/admin/dashboard", { token: customerToken });
    assert(custDashRes.status === 403, `Customer token accessing /api/admin/dashboard returns 403 Forbidden (Got ${custDashRes.status})`);

    // Test 9: Admin token call to /api/admin/dashboard
    const adminDashRes = await requestApi("/api/admin/dashboard", { token: adminToken });
    assert(adminDashRes.status === 200, `Admin token accessing /api/admin/dashboard returns 200 OK`);
    assert(typeof adminDashRes.body.data?.totalUsers === "number", `Dashboard stats returned totalUsers: ${adminDashRes.body.data?.totalUsers}`);

    // Test 10: Customer Management & Approvals
    const usersRes = await requestApi("/api/admin/users", { token: adminToken });
    assert(usersRes.status === 200, `GET /api/admin/users returns 200 OK`);

    // Test 11: Events List
    const eventsRes = await requestApi("/api/admin/events", { token: adminToken });
    assert(eventsRes.status === 200, `GET /api/admin/events returns 200 OK`);

    // Test 12: WhatsApp Details (Masked)
    const waRes = await requestApi("/api/admin/whatsapp", { token: adminToken });
    assert(waRes.status === 200, `GET /api/admin/whatsapp returns 200 OK`);
    assert(waRes.body.data?.health !== undefined, "WhatsApp health metadata returned");

    // Test 13: Firebase Details (Safe Metadata)
    const fbRes = await requestApi("/api/admin/firebase", { token: adminToken });
    assert(fbRes.status === 200, `GET /api/admin/firebase returns 200 OK`);
    assert(fbRes.body.data?.projectId !== undefined, "Firebase safe metadata returned");

    // Test 14: Settings
    const setRes = await requestApi("/api/admin/settings", { token: adminToken });
    assert(setRes.status === 200, `GET /api/admin/settings returns 200 OK`);

    console.log(`\n================================`);
    console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
    console.log(`================================\n`);

    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
