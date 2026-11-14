# Network client

`connectServer` maintains an authenticated WebSocket connection, sends bounded player intents, and applies confirmed snapshots to a replica. Reconnect credentials belong to local storage; reconnects clear held movement and never replay actions.

The snapshot watchdog starts a fresh three-second timeout window when authentication completes or play resumes. Time spent paused or reconnecting does not count as a stalled active connection. A genuinely stalled active connection still closes and retries.
