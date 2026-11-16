const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.CALLSETU_DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "store.json");
const EMPTY = { users: {}, sessions: {}, messages: {}, contacts: {}, blocks: {}, calls: [] };

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(DB_FILE)) atomicWrite(EMPTY);
}
function readStore() {
  ensureStore();
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    throw new Error("STORE_CORRUPT: refusing to overwrite unreadable data");
  }
  for (const key of Object.keys(EMPTY)) {
    if (!parsed || typeof parsed !== "object" || parsed[key] === undefined) {
      throw new Error("STORE_SCHEMA_INVALID: " + key);
    }
  }
  return parsed;
}
function atomicWrite(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  const temp = DB_FILE + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  try { fs.renameSync(temp, DB_FILE); }
  catch (err) { try { fs.unlinkSync(temp); } catch {} throw err; }
}
let queue = Promise.resolve();
function updateStore(mutator) {
  const operation = queue.then(() => {
    const data = readStore();
    const result = mutator(data);
    atomicWrite(data);
    return result;
  });
  queue = operation.catch(() => {});
  return operation;
}
module.exports = { ensureStore, readStore, updateStore };