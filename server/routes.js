const express = require("express");
const auth = require("./auth");
const { readStore, updateStore } = require("./store");
const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const result = await auth.register(String(req.body.id || ""), req.body.password);
    res.status(201).json(result);
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    res.json(await auth.login(String(req.body.id || ""), req.body.password));
  } catch (e) { next(e); }
});
router.get("/me", auth.authenticate, (req, res) => {
  const user = readStore().users[req.userId];
  res.json({ id: user.id, profile: user.profile });
});
router.post("/logout", auth.authenticate, async (req, res, next) => {
  try { await auth.logout(req.sessionHash); res.json({ ok: true }); }
  catch (e) { next(e); }
});
router.get("/contacts", auth.authenticate, (req, res) => {
  const db = readStore();
  res.json(db.contacts[req.userId] || []);
});
router.post("/contacts", auth.authenticate, async (req, res, next) => {
  try {
    const id = String(req.body.id || "");
    if (!/^[0-9]{10}$/.test(id) || id === req.userId) return res.status(400).json({ error: "INVALID_CONTACT_ID" });
    await updateStore(db => {
      const list = db.contacts[req.userId] || [];
      if (!list.some(c => c.id === id)) list.push({ id, label: String(req.body.label || id).slice(0, 60) });
      db.contacts[req.userId] = list;
    });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});
router.get("/health", (_req, res) => res.json({ status: "ok" }));
module.exports = router;