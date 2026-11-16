# CallSetu rebuild — foundation ZIP

This is a clean starter foundation based on the remembered CallSetu requirements, not a recovered copy of the unavailable 50 original code parts.

## Run in Termux
```bash
pkg update
pkg install nodejs-lts
cd CallSetu-rebuild
npm install
cp .env.example .env
```
Edit `.env` and set `JWT_SECRET` to a unique random value of at least 32 characters. Then:
```bash
npm start
```
Open `http://127.0.0.1:5000`.

## Included in this foundation
- 10-digit CallSetu ID + password registration/login (no email OTP flow)
- bcrypt password hashing
- hashed random session tokens, logout, expiry
- JSON store with queued updates and atomic replacement
- Express security headers and API rate limiting
- Socket.IO authenticated connections
- ciphertext-only message transport skeleton
- basic Contacts, Messages, Dial Pad and My Account navigation
- CallSetu navy/orange visual direction and PWA manifest

## Not yet implemented / not production-ready
- End-to-end encryption key exchange, device verification, key backup and rotation
- Actual WebRTC audio/video calls, TURN server and Android background incoming-call service
- Push notifications and native Android permission flows
- Private Contacts vault encryption, Shared/Global Contacts
- Block list, account switching (up to 8 accounts), wallet/payments, call history
- Message delivery/read/recall, offline queue, scheduling, mute/archive, reactions, typing indicators
- Media upload, moderation, file scanning and storage lifecycle
- Production database, migrations, backups, multi-process locking and deployment hardening

Do not deploy this foundation as a finished secure messenger. In particular, the message UI intentionally does not send plaintext, and calling is visibly disabled until those modules are implemented and tested.

## Important engineering note
The JSON store is suitable only for a single-process development prototype. The update queue prevents overlapping writes inside one Node process; it is not a distributed lock. Before production or multiple server instances, replace it with a transactional database such as PostgreSQL and migrations.

## Tests
```bash
npm test
```
The current tests are smoke tests only, not a complete security or integration test suite.
