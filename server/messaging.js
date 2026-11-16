const { updateStore } = require("./store");
const crypto = require("node:crypto");

function registerMessaging(io, socket) {
  socket.on("message:send", async (payload, ack = () => {}) => {
    try {
      const to = String(payload && payload.to || "");
      const ciphertext = payload && payload.ciphertext;
      const messageId = crypto.randomUUID();
      if (!/^[0-9]{10}$/.test(to) || typeof ciphertext !== "string" || ciphertext.length < 1 || ciphertext.length > 2000000) {
        return ack({ ok: false, error: "INVALID_MESSAGE" });
      }
      // The server stores ciphertext only; clients must encrypt before sending.
      const message = { id: messageId, from: socket.userId, to, ciphertext, createdAt: new Date().toISOString(), status: "sent" };
      await updateStore(db => {
        db.messages[messageId] = message;
      });
      const recipient = onlineUsers.get(to);
      if (recipient) io.to(recipient).emit("message:new", message);
      ack({ ok: true, message });
    } catch {
      ack({ ok: false, error: "MESSAGE_STORE_FAILED" });
    }
  });
}
const onlineUsers = new Map();
function registerPresence(socket) {
  onlineUsers.set(socket.userId, socket.id);
  socket.on("disconnect", () => {
    if (onlineUsers.get(socket.userId) === socket.id) onlineUsers.delete(socket.userId);
  });
}
module.exports = { registerMessaging, registerPresence };