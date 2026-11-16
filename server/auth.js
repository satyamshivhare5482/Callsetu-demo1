const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { updateStore, readStore } = require("./store");
const config = require("./config");

const ID_RE = /^[0-9]{10}$/;
const TOKEN_RE = /^[a-f0-9]{64}$/;

function token() { return crypto.randomBytes(32).toString("hex"); }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function validCredentials(id, password) {
  return ID_RE.test(String(id || "")) &&
    typeof password === "string" && password.length >= 8 && password.length <= 128;
}
async function register(id, password) {
  if (!validCredentials(id, password)) throw Object.assign(new Error("Invalid ID or password"), { status: 400 });
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const sessionToken = token();
  await updateStore(db => {
    if (db.users[id]) throw Object.assign(new Error("CallSetu ID already exists"), { status: 409 });
    db.users[id] = { id, passwordHash, createdAt: new Date().toISOString(), profile: { username: id } };
    db.sessions[hash(sessionToken)] = { userId: id, createdAt: Date.now(), expiresAt: Date.now() + config.sessionDays * 86400000 };
  });
  return { id, token: sessionToken };
}
async function login(id, password) {
  if (!validCredentials(id, password)) throw Object.assign(new Error("Invalid credentials"), { status: 400 });
  const db = readStore();
  const user = db.users[id];
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error("Invalid CallSetu ID or password"), { status: 401 });
  const sessionToken = token();
  await updateStore(data => {
    data.sessions[hash(sessionToken)] = { userId: id, createdAt: Date.now(), expiresAt: Date.now() + config.sessionDays * 86400000 };
  });
  return { id, token: sessionToken };
}
function authenticate(req, res, next) {
  const value = req.headers.authorization || "";
  const raw = value.startsWith("Bearer ") ? value.slice(7) : "";
  if (!TOKEN_RE.test(raw)) return res.status(401).json({ error: "UNAUTHORIZED" });
  const db = readStore();
  const session = db.sessions[hash(raw)];
  if (!session || session.expiresAt < Date.now()) return res.status(401).json({ error: "SESSION_EXPIRED" });
  req.userId = session.userId;
  req.sessionHash = hash(raw);
  next();
}
async function logout(sessionHash) {
  await updateStore(db => { delete db.sessions[sessionHash]; });
}
module.exports = { register, login, authenticate, logout, hash };