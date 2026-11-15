# Authoritative client replica

`createReplica` creates a world without gameplay systems. Its `receive` method accepts increasing snapshot sequence numbers and nondecreasing server timestamps, then applies confirmed state in place through `restoreSnapshot`. It preserves entity identity, view-local ownership and render listeners, and removes entities and components explicitly removed by the server. Initial, realm-change and actor-change frames reset render subscriptions; ordinary frames use the same generation checks as single player.

The replica does not execute movement, spells, damage or AI. It does not replay missed snapshots or predict gameplay outcomes. A bounded rendering-only movement preview is described in [prediction.md](prediction.md). Host frames carry entity values such as position, spring configuration and bump generation. Each client retargets its own movement springs and reconciles previews with confirmed positions; bumps and particle offsets use the same native motion helpers. No motion models travel over the socket. `render` advances only presentation time, up to one second beyond the last confirmed frame so existing motion can settle during a stall; authoritative elapsed time and component state remain fixed. Audited presentation callbacks animate particles and read-only popups locally from confirmed start times. Damage and other gameplay sequence effects stay server-only.

`connectServer` authenticates a browser WebSocket, stores its bearer credential under the normalized server URL in local storage and assigns the authenticated actor to the replica. It refreshes held movement, drops actions during disconnection and resumes with a fresh ordering window after authentication. It never replays a disconnected action backlog. The server resets the owned input mailbox on authenticated reconnect so reloading a page can restart input numbering. Controls, quick use and chat edits send intents instead of changing confirmed components. Chat editing has a separate bounded queue consumed on server frames, rather than waiting for character movement cooldowns. Storage failure stops a new claim before entering the game.

The tests verify stable actor references, component and entity removal, stale-state rejection and that attempted local movement and spell activation cannot run gameplay systems or alter the server world.

Server sound calls are captured before synthesis and attached to bounded snapshot history with monotonically increasing IDs, server timestamps and optional actor ownership or spatial origins. Browser clients play fresh audible events once; they skip private events belonging to others, old events, paused history and the first snapshot after reconnect. Motion models continue to run only presentation on the client; no sound event can trigger gameplay.

After the initial full state, acknowledged packets patch changed components and removed entities. Level fields patch independently; spatial and collision grids update only for changed cells. Compact cell coverage preserves known empty floor; a full frame or realm change rebuilds the grids. Unchanged objects remain intact. Cosmetic particles and read-only popup animations now run locally; see [presentation.md](presentation.md).

## StateFrame

```ts src/engine/network/replica.ts
export type StateFrame = {
  sequence: number;
  removed?: number[];
  removedComponents?: [number, string[]][];
  serverTime: number;
  inputSequence?: number;
  cells?: number[];
  snapshot: WorldSnapshot;
  realm?: LevelName;
  sounds?: (SoundEvent & { id: number; time: number })[];
};
```
<!-- source-types -->

## StateFrame

```ts src/engine/network/replica.ts
export type StateFrame = {
  sequence: number;
  removed?: number[];
  removedComponents?: [number, string[]][];
  serverTime: number;
  inputSequence?: number;
  cells?: number[];
  visibleCells?: number[];
  snapshot: WorldSnapshot;
  realm?: LevelName;
  sounds?: (SoundEvent & { id: number; time: number })[];
};
```
