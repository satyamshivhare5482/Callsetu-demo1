require("dotenv").config();

const secret = process.env.JWT_SECRET || "";
if (secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters. Copy .env.example to .env and set a strong secret.");
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || "0.0.0.0",
  jwtSecret: secret,
  sessionDays: Math.max(1, Math.min(30, Number(process.env.SESSION_DAYS || 7))),
  bcryptRounds: Math.max(10, Math.min(14, Number(process.env.BCRYPT_ROUNDS || 12)))
};