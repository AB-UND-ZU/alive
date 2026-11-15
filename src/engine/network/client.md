# Network client

`connectServer` maintains an authenticated WebSocket connection, sends bounded player intents, and applies confirmed snapshots to a replica. Reconnect credentials belong to local storage; reconnects clear held movement and never replay actions.

The snapshot watchdog starts a fresh 15-second timeout window when authentication completes or play resumes. Time spent paused or reconnecting does not count as a stalled active connection. A genuinely stalled active connection still closes and retries.

Heartbeats repeat the last applied snapshot acknowledgment. A skipped send under backpressure cannot permanently block the server’s single outstanding state. Discrete actions are not retried or queued through disconnection. Movement prediction and action anticipation affect rendering only; see [prediction.md](prediction.md).
<!-- source-types -->

## ConnectionStatus

```ts src/engine/network/client.ts
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "rejected"
  | "closed";
```
