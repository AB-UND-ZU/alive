# Authoritative player input

`createPlayerInput` owns one bounded intent mailbox for one authenticated entity ID. Its transport-facing `receive` method validates actions and movement, rejects duplicate sequence numbers, and never updates the world clock or performs gameplay. `onUpdate` is driven by the simulation, with at most one action per actor reference generation. The native trigger, movement and magic systems retain their normal eligibility and cooldown checks.

Movement is latest-value state. Only one action can wait, so a lagged connection cannot accumulate a spell burst. Inputs expire after one second of server time without a fresh message. Clients must refresh held movement; stopping, disconnecting and pausing must release it. `received` acknowledges receipt, not action execution. Character IDs, positions, stats, inventory and client clock deltas are deliberately absent from the accepted payload.

These primitives are not connected to a WebSocket transport or UI yet.

## Integration decisions

Use a dedicated server running the same simulation. Keep its fast frame loop for sequence side effects and the existing, independently offset actor reference clocks for gameplay. The 350 ms world reference is not the simulation frame rate. The first networked version should retain authoritative sequences on the server; separating decorative sequence execution is safe only after auditing each sequence for gameplay effects.

Clients should render confirmed snapshots with a short interpolation buffer. They must not run gameplay prediction or authoritative systems. Interpolate only between confirmed states and freeze at the newest state during a stall. Reconnection should replace the client view with a full snapshot rather than replay disconnected inputs. Save credentials belong outside the world snapshot, with unguessable reconnect tokens stored as hashes on the server.

Full-world snapshots simplify the initial transport. Backpressure must discard intermediate unsent snapshots rather than queueing an unbounded history. A separate message-size and message-rate limit is still necessary even with bounded gameplay input. Dialog state and camera ownership must become per-player before exposing a playable server; the current single-player global interact state is not sufficient.

These choices apply the fixed server timestep described by [Gabriel Gambetta](https://www.gabrielgambetta.com/entity-interpolation.html) and confirmed-state rendering described by [Glenn Fiedler](https://gafferongames.com/post/snapshot_interpolation/). [Colyseus](https://docs.colyseus.io/state) demonstrates server-owned state synchronization, while its [reconnection lifecycle](https://docs.colyseus.io/room/reconnection) uses full-state restoration. [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/) distinguish ordered delivery from delivery across disconnects. The [ws API](https://github.com/websockets/ws/blob/master/doc/ws.md) exposes payload limits and buffered bytes needed for transport backpressure. These references guide the design; no multiplayer framework is installed.
