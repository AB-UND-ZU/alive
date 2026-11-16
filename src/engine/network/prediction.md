# Visual prediction

Movement uses a single outstanding step with a monotonically increasing input sequence. The client starts its existing movement spring immediately for a known walkable cell. The server commits that direction until the actor reference generation advances, then includes `movementSequence` in its state frame, even if a collision prevented movement. Receipt of an input is separate from execution of a movement step.

Direction changes update the next requested step. They cannot replace the current step or accumulate a backlog. After execution is acknowledged, the client requests the latest held direction. The native reference clock limits speed, so a round trip below the player tick normally leaves time to supply the next step. Longer delays reduce movement throughput instead of inventing more positions or replaying a burst. A short tap commits one step; releasing stops subsequent requests.

Only presentation predicts: POSITION, inventory, collision queries and all gameplay systems remain authoritative. Matching acknowledgments retire the preview without another animation. Rejected steps retarget the existing spring to the confirmed position. Ordinary snapshots without an execution acknowledgment leave the preview intact. Unknown cells, mounts and ghosts render confirmed movement. Realm changes, pause and disconnect clear prediction.

Available spells and skills retain their bounded anticipation bump, without spending resources or creating effects.

This adapts [Gabriel Gambetta’s sequence-based reconciliation](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html) to one outstanding grid step. [Colyseus distinguishes input receipt from consumption](https://docs.colyseus.io/netcode/server-input); its [prediction guide](https://docs.colyseus.io/netcode/client-prediction) separates simulation from presentation. Alive needs neither a replay history nor server rollback because at most one movement command awaits execution. Collisions and other players can still invalidate a preview.
