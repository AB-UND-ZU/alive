# Dedicated LAN server

Run `npm run server` from the repository. It builds the same native engine into a temporary Node bundle, starts WebSockets on port 3001 and prints the localhost and LAN addresses. It serves the simulation only; run the browser application separately with `npm start`.

`HOST` and `PORT` override the listening address. `ALIVE_SERVER_SAVE` selects the server save file; the default is `~/.alive/server.save`. The save holds all level worlds and account hashes. Reconnect bearer tokens stay in each browser's local storage, keyed by normalized server URL. SIGINT/SIGTERM finish a save and remove the temporary bundle.

The launch command is available while the browser's Servers menu is still being integrated. Engine and transport behavior is documented in [host.md](../../src/engine/network/host.md) and [transport.md](transport.md).
