const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "callsetu-test-"));
process.env.CALLSETU_DATA_DIR = temp;
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.BCRYPT_ROUNDS = "10";

const auth = require("../server/auth");

test("credential validation rejects malformed IDs and short passwords", async () => {
  await assert.rejects(auth.register("123", "password123"));
  await assert.rejects(auth.register("1234567890", "short"));
});

test("registration and login use a 10-digit ID and password without OTP", async () => {
  const created = await auth.register("1234567890", "securePass123");
  assert.match(created.token, /^[a-f0-9]{64}$/);
  assert.equal(created.id, "1234567890");

  const loggedIn = await auth.login("1234567890", "securePass123");
  assert.match(loggedIn.token, /^[a-f0-9]{64}$/);

  await assert.rejects(auth.login("1234567890", "incorrectPass"));
});

test("duplicate CallSetu IDs are rejected", async () => {
  await auth.register("1111111111", "securePass123");
  await assert.rejects(auth.register("1111111111", "securePass123"));
});

test("test data directory can be removed after the suite", () => {
  fs.rmSync(temp, { recursive: true, force: true });
  assert.equal(fs.existsSync(temp), false);
});
