# Authoritative host

`createHost` constructs the native menu world or restores a server-owned snapshot and installs the authoritative systems. `step` advances a fixed 30 Hz simulation, retaining the slower world reference and each actor's own reference phase. Transport handlers only place validated intent into actor mailboxes. They cannot provide positions, clock deltas, inventory or character IDs.

Authenticated account IDs bind to the optional `PLAYER.accountId` component field. Existing actors reconnect by account ID. Death and respawn carry ownership to the replacement ghost and hero. The saved host includes each level world’s snapshot and spawn template, plus elapsed simulation time; reconnect credentials remain separate in server persistence.

Hosted portal transitions enqueue a transfer at the simulation boundary. Menu, dungeon and island have independent worlds; another character may remain in a previous level. Native single-player warps retain their existing behavior. A transfer creates a native hero at the destination spawn, carries persistent player data and inventory, remaps equipment to the new item IDs and primes applied equipment bonuses. Conditions, open interfaces, cumulative effect counters and temporary sequences do not carry across levels. Source cleanup completes before ownership resolves to the new actor. Each actor gets new private interfaces in the destination world.

Terrain initializes around every hosted player, rather than one global camera. Fog remains cooperative. Snapshots are selected by the authenticated account’s current world, and a client discards old entity identities when changing realms. The same numeric ID may refer to different entities in different worlds.

Reconnecting resumes the character in its own saved world; game progression remains shared within that world. NPC scripts choose their active dialog owner or the closest living character. Hosted dungeon rooms reveal once, while quest hints follow each character’s own room. An interrupted fight can restart when the party returns. Dungeon fights close their entrances; characters outside the barrier wait until it opens. Characters pass through teammates, while walls and enemies retain their normal collisions. Late arrivals use the current shared checkpoint and current defeated-unit quest counts.

`setupCooperation` delivers quest rewards from a persistent per-level log. The completing player pays the native quest costs and chooses the reward; all characters receive that same reward and experience. Each player stores a receipt offset per level. Offline living characters receive their rewards in the saved world; ghosts receive pending rewards after revival. New arrivals catch up without replaying rewards already received. Loot on the ground remains shared. Single-player quests retain their native reward and experience animations.

A hosted `PLAYER.connected` flag distinguishes saved characters from active participants. Disconnecting releases their NPC dialog, removes them from targeting and passability checks and hides their actor in other client views. Characters remain in the authoritative save at their last position. Damage over time is ignored while disconnected without accumulating a burst for reconnect, and passive potions are not consumed. Restarted hosts mark all saved characters offline until authenticated. Pausing stops only input and leaves the character in play.

The transport configures username selection and administration callbacks on each realm. `identify` applies account names and runtime permissions; `requestUsername` opens the owner’s native chat prompt. Admin replies use a separate private INFO window and viewpoint. Host saves retain usernames but omit derived rosters and runtime admin flags; restored players start without permission until transport applies the startup allowlist.

Public popups have per-reader views: selection, scroll, viewpoint and forging progress belong to the reader, while quest/shop/brewing data remain linked to the source. Saved readers are closed and private views are removed before restoring authoritative systems. Dungeon barriers close for multiplayer fights, and each actor has a room camera. Named players use their username in tooltips.

## Spawn

```ts src/engine/network/host.ts
type Spawn = {
  POSITION: Position;
  SPAWNABLE: Spawnable;
  BELONGABLE: Belongable;
};
```

## Realm

```ts src/engine/network/host.ts
type Realm = { world: World; spawn: Spawn };
```

## HostedWorld

```ts src/engine/network/host.ts
export type HostedWorld = {
  elapsed: number;
  realms: { snapshot: WorldSnapshot; spawn: Spawn }[];
};
```

## Transfer

```ts src/engine/network/host.ts
type Transfer = {
  accountId: string;
  level: LevelName;
  classKey: ClassKey;
  hairColor: string;
  resetClass: boolean;
};
```

Transport frames request a nearby view around the owned character and active camera. Named entities, points of interest, non-spatial state and referenced parents/particles remain available. Normal frames omit generation matrices; opening the native map supplies the full explored-world data. Saves always retain the complete world.
<!-- source-types -->

## Spawn

```ts src/engine/network/host.ts
type Spawn = {
  POSITION: Position;
  SPAWNABLE: Spawnable;
  BELONGABLE: Belongable;
};
```

## Realm

```ts src/engine/network/host.ts
type Realm = { world: World; spawn: Spawn };
```

## HostedWorld

```ts src/engine/network/host.ts
export type HostedWorld = {
  elapsed: number;
  realms: { snapshot: WorldSnapshot; spawn: Spawn }[];
};
```

## Transfer

```ts src/engine/network/host.ts
type Transfer = {
  accountId: string;
  level: LevelName;
  classKey: ClassKey;
  hairColor: string;
  resetClass: boolean;
};
```
