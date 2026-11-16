const express = require("express");
const http = require("node:http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const config = require("./config");
const { ensureStore } = require("./store");
const { authenticate } = require("./auth");
const routes = require("./routes");
const { registerMessaging, registerPresence } = require("./messaging");

ensureStore();
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use("/api", routes);
app.use(express.static(require("node:path").join(__dirname, "..", "client")));
app.get("*", (_req, res) => res.sendFile(require("node:path").join(__dirname, "..", "client", "index.html")));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? "INTERNAL_ERROR" : err.message });
});
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false }, maxHttpBufferSize: 2e6, pingInterval: 25000, pingTimeout: 60000 });
io.use((socket, next) => {
  try {
    const req = { headers: { authorization: "Bearer " + String(socket.handshake.auth && socket.handshake.auth.token || "") } };
    authenticate(req, { status: () => ({ json: () => next(new Error("Unauthorized")) }) }, () => {
      socket.userId = req.userId;
      next();
    });
  } catch { next(new Error("Unauthorized")); }
});
io.on("connection", socket => {
  registerPresence(socket);
  registerMessaging(io, socket);
});
server.listen(config.port, config.host, () => console.log(`CallSetu listening on ${config.port}`));