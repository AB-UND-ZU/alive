# Server persistence and credentials

`createPersistence(file)` stores server-owned data with V8 structured serialization, preserving shared objects, cycles and infinite stat caps. It captures data synchronously, orders writes, flushes a private temporary file, and atomically renames that file over the previous save. A failed serialization leaves the previous durable save untouched. Load failures propagate; corrupt data must never silently create a replacement world.

`createCredential` returns a public random account ID, a 256-bit random bearer token and its SHA-256 hash. Return the token only to its owner during account creation. Persist only the ID and hash alongside that account's character binding, never the raw token or the server's account table in a world snapshot. `verifyCredential` validates the bounded token format and compares hashes with a constant-time comparison. Possessing an entity ID or another account's token is insufficient.

These are persistence and authentication primitives. They are not yet connected to a WebSocket handshake, reconnect UI or realm save lifecycle. The eventual server must also validate its saved world version, bind authenticated accounts to actors, cap connections and messages, and use WSS when transport confidentiality is required.

Run `npm run test:server` for native Node simulation and persistence tests. Temporary test files are created outside the repository and removed afterward.
