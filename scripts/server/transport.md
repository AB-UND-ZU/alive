# WebSocket engine transport

`createGameServer` wires an engine host to a WebSocket server and durable server persistence. Its default address is loopback and an ephemeral port. The `manual` option disables automatic simulation/publishing for deterministic socket tests. This integration API is not yet connected to a launch command or the browser's Servers menu.

The server steps at 30 Hz with up to five catch-up frames. A long CPU stall slows simulation rather than accepting client time or rolling back. It publishes full encoded snapshots every 100 ms. Sockets with more than 2 MiB buffered are skipped; paused or application-stalled clients do not receive an accumulating snapshot history. Application heartbeats resume current-state delivery. WebSocket pings detect dead connections.

The initial limits are eight connections, 64 stored accounts, 4 KiB incoming messages and 120 messages per second per connection. Clients authenticate with their own reconnect token, can enqueue validated intents, pause their own input, and send connection heartbeats. The server never decodes a client-authored snapshot. A receipt acknowledgement means the input reached the mailbox, not that gameplay has executed it.

New account state is persisted before its credential is returned. Interrupted joins free their unclaimed actor for reuse. Active credentials cannot replace an existing connection. Closing the server releases sockets and writes the current authoritative state. Use WSS on untrusted networks because reconnect tokens are bearer credentials.

Native socket tests exercise two clients, forged actor IDs, queued spell floods, independent pause, wrong/duplicate credentials and ownership across process-style restarts. The gameplay limitations listed in `src/engine/network/host.md` remain; this transport is not a playable multiplayer release.
