# Authoritative player input

`createPlayerInput` owns one bounded intent mailbox for one authenticated entity ID. Its transport-facing `receive` method validates actions and movement, rejects duplicate sequence numbers, and never updates the world clock or performs gameplay. `onUpdate` is driven by the simulation, with at most one action per actor reference generation. The native trigger, movement and magic systems retain their normal eligibility and cooldown checks.

Held movement is latest-value state, with one bounded pending tap so a short press survives until the actor’s native reference tick. Only one action can wait, so a lagged connection cannot accumulate a spell burst. Inputs expire after one second of server time without a fresh message. Clients must refresh held movement; stopping, disconnecting and pausing must release it. `received` acknowledges receipt, not action execution. Character IDs, positions, stats, inventory and client clock deltas are deliberately absent from the accepted payload.

The dedicated host, WebSocket transport, browser replica and Servers menu use these primitives.

## Integration decisions

Use a dedicated server running the same simulation. Keep its fast frame loop for sequence side effects and the existing, independently offset actor reference clocks for gameplay. The 350 ms world reference is not the simulation frame rate. The networked version retains authoritative sequences on the server; separating decorative sequence execution is safe only after auditing each sequence for gameplay effects.

Clients render confirmed snapshots and retarget native presentation springs toward confirmed positions. They must not run gameplay prediction or authoritative systems. Finish only confirmed motion during a stall, without inventing subsequent game states. Reconnection should replace the client view with a full snapshot rather than replay disconnected inputs. Save credentials belong outside the world snapshot, with unguessable reconnect tokens stored as hashes on the server.

Full-world snapshots simplify the initial transport. Backpressure must discard intermediate unsent snapshots rather than queueing an unbounded history. A separate message-size and message-rate limit is still necessary even with bounded gameplay input. Dialog state, interaction prompts and camera selection are owned by the acting player.

These choices apply the fixed server timestep described by [Gabriel Gambetta](https://www.gabrielgambetta.com/entity-interpolation.html) and confirmed-state rendering described by [Glenn Fiedler](https://gafferongames.com/post/snapshot_interpolation/). [Colyseus](https://docs.colyseus.io/state) demonstrates server-owned state synchronization, while its [reconnection lifecycle](https://docs.colyseus.io/room/reconnection) uses full-state restoration. [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/) distinguish ordered delivery from delivery across disconnects. The [ws API](https://github.com/websockets/ws/blob/master/doc/ws.md) exposes payload limits and buffered bytes needed for transport backpressure. These references guide the design; no multiplayer framework is installed.


## Current implementation references

Colyseus 0.18’s [server-input contract](https://docs.colyseus.io/netcode/server-input) separates fixed simulation stepping, validated bounded input, receipt/consumption acknowledgements and idle input policy. Holding movement through small packet gaps does not justify repeating edge-triggered actions. Alive adopts those boundaries while keeping native per-character cooldowns. Its [prediction documentation](https://docs.colyseus.io/netcode/client-prediction) also separates predicted simulation from presentation smoothing; Alive deliberately uses confirmed presentation only, accepting input latency to avoid reconciliation and rollback.

The public [Mk48.io server input](https://github.com/SoftbearStudios/mk48/blob/main/server/src/world_inbound.rs) validates commands against server-owned player and entity state, while its [outbound world view](https://github.com/SoftbearStudios/mk48/blob/main/server/src/world_outbound.rs) builds each player’s view from authoritative world data. This supports separating world ownership from a player’s camera and interface. Alive keeps that separation, but sends complete level worlds instead of Mk48’s sensor-filtered contacts. Its public repository notes that releases may be newer than the published source. No code from either project is copied into Alive.

UI indices are checked against native window and keyboard bounds, and explicit tab selection must fit the actor’s current popup. Scroll positions are finite ratios from zero to one. Invalid UI intents are discarded without occupying the actor’s action slot. Frozen, sliding or dead actors cannot retain a spell trigger to execute after recovering; ghost respawn interaction remains available.
